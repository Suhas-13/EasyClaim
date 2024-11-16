import React, { useState, useEffect } from "react";

const RefundClaimDiscussion = () => {
  const [claimSummary, setClaimSummary] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Initialize claim summary and messages
  useEffect(() => {
    setClaimSummary(
      "Claim ID: #123456\nStatus: Awaiting adjudicator decision\nTotal Amount: $120.99\nDate Filed: 2024-11-01"
    );

    setMessages([
      {
        content: "The refund has been initiated. Please wait 3-5 business days.",
        type: "credit-card",
        author: "Credit Card Co.",
        timestamp: "10:12 AM",
      },
      {
        content: "Why is it taking so long?",
        type: "user",
        author: "You",
        timestamp: "10:15 AM",
      },
      {
        content: "The seller needs to approve the refund before we can proceed.",
        type: "adjudicator",
        author: "Adjudicator",
        timestamp: "10:18 AM",
      },
      {
        content: "The refund is approved. Please expedite.",
        type: "seller",
        author: "Seller",
        timestamp: "10:20 AM",
      },
    ]);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages([
        ...messages,
        { content: newMessage, type: "user", author: "You", timestamp },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Left Preview Panel */}
      <div className="w-1/3 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg p-6 flex flex-col border-r border-gray-600">
        <h2 className="text-2xl font-bold text-white mb-6">Claim Summary</h2>
        <div className="text-gray-200 leading-relaxed bg-gray-800 rounded-lg p-4 shadow-inner whitespace-pre-line">
          {claimSummary || "Loading claim details..."}
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-2/3 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-md border-b border-gray-600 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">#refund-claim</h3>
            <p className="text-sm text-gray-300">Discussing claim ID #123456</p>
          </div>
          <div className="text-sm text-gray-400">
            <span className="animate-pulse">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-850">
          {messages.map((msg, index) => (
            <div
              key={index}
              className="flex gap-4 items-start fade-in"
            >
              {/* Author Avatar */}
              <div className="w-12 h-12 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
                {msg.author[0].toUpperCase()}
              </div>
              {/* Message Content */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      msg.type === "user"
                        ? "text-blue-400"
                        : msg.type === "credit-card"
                        ? "text-green-400"
                        : msg.type === "adjudicator"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {msg.author}
                  </span>
                  <span className="text-xs text-gray-400">{msg.timestamp}</span>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 rounded-xl px-5 py-3 mt-1 shadow-md">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-t from-gray-800 to-gray-700 flex items-center gap-4 border-t border-gray-600 shadow-inner">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message #refund-claim"
            className="flex-1 bg-gray-600 text-gray-200 border-none rounded-md px-4 py-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-md shadow hover:from-blue-600 hover:to-blue-700 transition"
          >
            Send
          </button>
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-blue-400 hover:underline"
          >
            Upload File
          </label>
          <input type="file" id="file-upload" className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default RefundClaimDiscussion;
