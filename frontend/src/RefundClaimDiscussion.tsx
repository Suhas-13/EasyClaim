import React, { useState } from "react";
import { Claim } from "./types";
import Navbar from "./components/Navbar";
import ClaimSummary from "./components/ClaimSummary";

interface Message {
  content: string;
  type: "user" | "credit-card" | "adjudicator" | "seller";
  author: string;
  timestamp: string;
}

interface RefundClaimDiscussionProps {
  claimDetails: Claim;
  messages: Message[];
}

const RefundClaimDiscussion: React.FC<RefundClaimDiscussionProps> = ({
  claimDetails,
  messages,
}) => {
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Message sent:", messageInput);
      setMessageInput("");
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
        {/* Claim Summary */}
        <div className="w-1/3 border-r border-slate-800">
          <ClaimSummary />
        </div>

        {/* Discussion Area */}
        <div className="w-2/3 flex flex-col relative">
          {/* Messages */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-24">
            {messages.map((msg: Message, index: number) => (
              <div key={index} className="group">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-slate-100 font-medium ${getAvatarColor(
                      msg.type
                    )}`}
                  >
                    {msg.author[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${getAuthorColor(msg.type)}`}>
                        {msg.author}
                      </span>
                      <span className="text-xs text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg px-4 py-3 text-slate-200 shadow-sm transition-all duration-200 group-hover:bg-slate-800 text-left">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
            <div className="flex gap-4">
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
              <input type="file" id="file-upload" className="hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundClaimDiscussion;
