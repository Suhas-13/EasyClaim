import React from "react";
import { Status } from "./Graph";

export interface Claim {
  id: number;
  name: string;
  description: string;
  documentFiles: string[];
  status: Status;
  submissionDate: Date;
}

export const CreditCompanyUi = ({
  claims,
  setClaimStatus,
}: {
  claims: Claim[];
  setClaimStatus: (id: number, status: Status) => void;
}) => {
  const viewClaim = React.useCallback((id: number) => null, []);

  return (
    <div className="min-h-screen w-full p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">{`${claims.length} claim(s) found`}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {claims.map((claim) => (
          <div key={claim.id} className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{claim.name}</h2>
              <p className="text-gray-600 mb-4">{claim.description}</p>
              <p className="text-gray-800 mb-2">
                <strong>Status:</strong> {claim.status}
              </p>
              <p className="text-gray-800 mb-4">
                <strong>Submission Date:</strong>{" "}
                {claim.submissionDate.toDateString()}
              </p>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Documents:</h3>
                <ul className="list-disc list-inside">
                  {claim.documentFiles.map((file, index) => (
                    <li key={index} className="text-gray-700">
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => viewClaim(claim.id)}
              >
                View
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={() => setClaimStatus(claim.id, Status.ClaimApproved)}
              >
                Approve
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => setClaimStatus(claim.id, Status.ClaimRejected)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};