import React, { useState, useEffect, useRef } from "react";
import { Claim } from "./types";
import Navbar from "./components/Navbar";
import ClaimSummary from "./components/ClaimSummary";
import ChargebackClient from "./FrontendIntegration";

interface Message {
  content: string;
  type: "user" | "credit-card" | "adjudicator" | "seller";
  author: string;
  timestamp: string;
}

interface RefundClaimDiscussionProps {
  claimDetails: Claim;
  claimId: number;
  client: ChargebackClient;
}

const getType = (sender: string): string => {
  if (sender === "user") {
    return "user";
  }
  if (sender === "assistant") {
    return "adjudicator";
  }
  return "user";
};

const RefundClaimDiscussion: React.FC<RefundClaimDiscussionProps> = ({
  claimDetails,
  client,
  claimId,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesFetchedRef = useRef(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploadProgress(0); // Reset progress
        await client.uploadFile(claimId, file, (progress) => {
          setUploadProgress(progress * 100); // Update progress in percentage
        });
        console.log("File uploaded successfully");
        // Optionally, add a message indicating the file upload success
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            content: `File "${file.name}" uploaded successfully.`,
            author: "You",
            type: "user",
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error("File upload failed:", error);
        // Optionally, add a message indicating the file upload failure
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            content: `Failed to upload file "${file.name}".`,
            author: "You",
            type: "user",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        await client.disconnect();
        await client.connect(claimId.toString());
        if (messagesFetchedRef.current) return; // Prevent duplicate fetches
  
        const fetchedMessages = await client.getMessages(claimId.toString());
        messagesFetchedRef.current = true;
        
        // Process and set the messages
        //@ts-ignore
        const processedMessages = fetchedMessages.messages.map((message: any) => ({
          content: message.content,
          author: message.sender,
          type: getType(message.sender),
          timestamp: message.timestamp,
        }));
  
        setMessages(processedMessages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
  
    fetchMessages();
  }, [claimId, client]);
  

  // Set up message listener
  useEffect(() => {
    const unsubscribe = client.onMessage((newMessage) => {
      setMessages((prevMessages) => {
        // Check if message already exists to prevent duplicates
        const messageExists = prevMessages.some(
          (msg) => 
            msg.content === newMessage.text && 
            msg.timestamp === new Date().toISOString()
        );
        
        if (messageExists) return prevMessages;
        
        return [...prevMessages, {
          content: newMessage.text || "",
          author: "adjudicator",
          type: "adjudicator",
          timestamp: new Date().toISOString(),
        }];
      });
    });

    return () => unsubscribe();
  }, [client]);

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const newMessage = {
        author: "You",
        type: "user" as const,
        timestamp: new Date().toISOString(),
        content: messageInput,
      };

      try {
        setMessageInput(""); // Clear input first
        
        // Update messages optimistically
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        
        await client.sendUserResponse(messageInput, claimId);
      } catch (error) {
        console.error("Failed to send message:", error);
        // Remove the message if sending failed
        setMessages((prevMessages) => 
          prevMessages.filter((msg) => 
            msg.content !== newMessage.content || 
            msg.timestamp !== newMessage.timestamp
          )
        );
      }
    }
  };

  const getAuthorColor = (type: Message["type"]) => {
    const colors = {
      user: "text-cyan-400",
      "credit-card": "text-emerald-400",
      adjudicator: "text-amber-400",
      seller: "text-rose-400",
    };
    return colors[type];
  };

  const getAvatarColor = (type: Message["type"]) => {
    const colors = {
      user: "bg-cyan-500",
      "credit-card": "bg-emerald-500",
      adjudicator: "bg-amber-500",
      seller: "bg-rose-500",
    };
    return colors[type];
  };

  return (
     <div>
      <Navbar />
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
        <div className="w-1/3 border-r border-slate-800">
          <ClaimSummary claim={claimDetails} />
        </div>

        <div className="w-2/3 flex flex-col relative">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-24">
            {messages.map((msg: Message, index: number) => (
              <div key={index} className="group">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-slate-100 font-medium ${getAvatarColor(msg.type)}`}
                  >
                    {msg.author[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${getAuthorColor(msg.type)}`}>
                        {msg.author}
                      </span>
                      <span className="text-xs text-slate-500">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg px-4 py-3 text-slate-200 shadow-sm transition-all duration-200 group-hover:bg-slate-800 text-left">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-slate-800/50 text-slate-200 rounded-lg px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Send
              </button>
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 rounded-lg cursor-pointer transition-colors duration-200"
              >
                Attach
              </label>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {uploadProgress > 0 && (
              <div className="text-sm text-slate-400 mt-2">
                Upload Progress: {uploadProgress.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundClaimDiscussion;