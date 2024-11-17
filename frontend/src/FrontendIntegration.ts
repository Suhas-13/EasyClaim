import io, { Socket } from 'socket.io-client';

interface FileChunkData {
  filename: string;
  claimId: number;
  data: string | ArrayBuffer | null;
  chunk: number;
  totalChunks: number;
}

type MessageHandler = (data: any) => void;

class ChargebackClient {
  private baseUrl: string;
  private socket: Socket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connected: boolean = false;
  private structuredData: any = {}; // To store structuredData
  private structuredDataWatchers: Set<(data: any) => void> = new Set(); // Watchers for structuredData

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  // Initialize the connection and set up socket event handlers
  async connect(claimId: string): Promise<void> {
    console.log(claimId);
    if (this.socket) return;

    this.socket = io(this.baseUrl, {
      query: {
        claimId: claimId
      },
      //@ts-ignore
      maxHttpBufferSize: 1e8,
      pingTimeout: 60000
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
    });

    // Listen for the 'update_claim_summary' event
    this.socket.on('update_claim_summary', (data: any) => {
      this.setStructuredData(data); // Update structuredData with the new claim summary
    });

    this.socket.on('message', (data: any) => {
      this.messageHandlers.forEach((handler) => handler(data));
    });

    return new Promise((resolve) => {
      this.socket!.on('connect', resolve);
    });
  }

  // Allow adding watchers for structuredData changes
  addStructuredDataWatcher(watcher: (data: any) => void): void {
    this.structuredDataWatchers.add(watcher);
  }

  // Method to notify all watchers about the structuredData change
  private notifyStructuredDataWatchers(): void {
    this.structuredDataWatchers.forEach((watcher) => watcher(this.structuredData));
  }

  // Set structuredData and notify watchers
  private setStructuredData(data: any): void {
    this.structuredData = data;
    this.notifyStructuredDataWatchers();
  }

  // Example method to fetch structuredData (it will notify watchers if it changes)
  async fetchStructuredData(claimId: string): Promise<void> {
    // Simulate fetching structured data from the server or an API call
    const response = await fetch(`${this.baseUrl}/structured_data/${claimId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch structured data');
    }
    const data = await response.json();
    this.setStructuredData(data); // Set and notify watchers
  }

  // Login/initialize user session
  async login(uuid: string | null = null): Promise<string> {
    const response = await fetch(`${this.baseUrl}/login/${uuid || 'new'}`, {
      credentials: 'include', // Include cookies with the request
    });
    if (!response.ok) {
      throw new Error('Login failed');
    }
    const cookies = response.headers.get('set-cookie');
    const newUuid = cookies?.match(/user_uuid=([^;]+)/)?.[1] || uuid;
    return newUuid || '';
  }

  // Start a new claim
  //@ts-ignore
  async startNewClaim(transaction): Promise<number> {
    const url = new URL(`${this.baseUrl}/start_new_claim`);

    Object.keys(transaction).forEach(key => {
      if (transaction[key] !== undefined && transaction[key] !== null) {
          url.searchParams.append(key, transaction[key]);
      }
  });

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include', // Include cookies with the request
    });

    if (!response.ok) {
      throw new Error('Failed to start new claim');
    }

    const data = await response.json();

    return data.id || 0;
  }

  // Get messages for a claim
  async getMessages(claimId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/get_messages/${claimId}`, {
      credentials: 'include', // Include cookies with the request
    });
    if (!response.ok) {
      throw new Error('Failed to get messages');
    }
    return await response.json();
  }

  // Subscribe to messages
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Send user response
  sendUserResponse(text: string, claim_id: number): void {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    this.socket!.emit('user_response', { text, claim_id: claim_id });
  }

  // Upload file in chunks
  async uploadFile(claimId: number, file: File, onProgress?: (progress: number) => void): Promise<void> {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const reader = new FileReader();

      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            await this.uploadFileChunk({
              filename: file.name,
              claimId: claimId,
              data: reader.result,
              chunk: i,
              totalChunks,
            });

            if (onProgress) {
              onProgress((i + 1) / totalChunks);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(chunk);
      });
    }
  }

  // Upload a single file chunk
  private uploadFileChunk(chunkData: FileChunkData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }
      console.log('Uploading chunk', chunkData.chunk);
      this.socket!.emit('upload_file_chunk', {data: chunkData});
      resolve();
    });
  }

  // Get merchant view
  async getMerchantView(claimId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/merchant_view/${claimId}`, {
      credentials: 'include', // Include cookies with the request
    });
    if (!response.ok) {
      throw new Error('Failed to get merchant view');
    }
    return await response.text();
  }

  // Connect as merchant
  connectAsMerchant(claimId: string): void {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    this.socket!.emit('merchant_connect', { claim_id: claimId });
  }

  // Send merchant response
  sendMerchantResponse(claimId: string, text: string): void {
    if (!this.connected) {
      throw new Error('Not connected to server');
    }
    this.socket!.emit('merchant_response', { claim_id: claimId, text });
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.messageHandlers.clear();
    }
  }
}

export default ChargebackClient;
