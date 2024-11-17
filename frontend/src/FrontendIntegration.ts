import io, { Socket } from 'socket.io-client';

interface FileChunkData {
  filename: string;
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

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  // Initialize the connection and set up socket event handlers
  async connect(claimId: string): Promise<void> {
    if (this.socket) return;

    this.socket = io(this.baseUrl, {
      query: {
        claimId: claimId
      }
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
    });

    this.socket.on('message', (data: any) => {
      this.messageHandlers.forEach((handler) => handler(data));
    });

    return new Promise((resolve) => {
      this.socket!.on('connect', resolve);
    });
  }


  async fetchViewPage(claimId: string){
    const response = await fetch(`${this.baseUrl}/view/${claimId}`, {
      credentials: 'include', // Include cookies with the request
    });
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
  async startNewClaim(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/start_new_claim`, {
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
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
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

      this.socket!.emit('upload_file_chunk', chunkData);
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

  addMessageHandler(messageHandler:any){
    this.messageHandlers.add(messageHandler);
  }
}

export default ChargebackClient;
