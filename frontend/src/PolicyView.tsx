import React, { useState } from "react";
import { Upload } from "lucide-react";
import Navbar from "./components/Navbar";

interface Policy {
  id: number;
  title: string;
  description: string;
  date: string;
}

const PolicyView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractPoliciesFromPDF = () => {
    const mockPolicies: Policy[] = [
      {
        id: 1,
        title: "Policy 1: Data Privacy",
        description: "This policy covers the data privacy measures implemented by the company.",
        date: "2024-01-01",
      },
      {
        id: 2,
        title: "Policy 2: Refund Process",
        description: "Details the process for customers to request refunds on products.",
        date: "2024-03-15",
      },
      {
        id: 3,
        title: "Policy 3: Terms of Service",
        description: "Outlines the terms and conditions under which services are provided to customers.",
        date: "2024-05-10",
      },
    ];
    setPolicies(mockPolicies);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);

      setTimeout(() => {
        extractPoliciesFromPDF();
        setIsProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-slate-100">Policy View</h3>
          <p className="text-slate-400 mt-2">Upload a PDF to extract and view policies</p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-slate-800/50 text-slate-300 rounded-lg px-4 py-3 flex items-center gap-2">
                  <Upload size={20} className="text-slate-400" />
                  <span>{selectedFile ? selectedFile.name : "Choose PDF file..."}</span>
                </div>
              </div>
              <button
                disabled={isProcessing}
                className={`bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? "Processing..." : "Extract Policies"}
              </button>
            </div>
          </div>
        </div>

        {/* Policy List */}
        <div className="space-y-4">
          {isProcessing ? (
            <div className="text-center py-12 text-slate-400">
              <div className="animate-pulse">Processing PDF...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No policies extracted yet. Upload a PDF to begin.
                </div>
              ) : (
                policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="group bg-slate-800/30 hover:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 text-slate-200 border border-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200">
                        {policy.title}
                      </h4>
                      <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
                        {policy.date}
                      </span>
                    </div>
                    <p className="text-slate-300">{policy.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyView;
