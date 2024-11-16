import React from "react";
import { Status } from "./Graph";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Claim } from "../types";

export const CreditCompanyUi = ({
  claims,
  setClaimStatus,
}: {
  claims: Claim[];
  setClaimStatus: (id: number, status: Status) => void;
}) => {
  const navigate = useNavigate(); // Initialize navigate

  // Modify the viewClaim function to navigate to /policyView with the claim's ID
  const viewClaim = React.useCallback((id: number) => {
    navigate(`/refundClaimDiscussion/${id}`); // Redirect to /policyView with claim id
  }, [navigate]);

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 font-sans p-8 min-w-[300px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-slate-100">Claims</h3>
            <p className="text-slate-400 mt-2">{`${claims.length} claim(s) found`}</p>
          </div>

          {/* Claims Table */}
          <div className="overflow-x-auto bg-slate-800/30 rounded-xl shadow-lg">
            <table className="min-w-full table-auto text-left text-slate-200">
              <thead>
                <tr className="bg-slate-700/50 text-sm font-semibold text-slate-100">
                  <th className="px-6 py-3">Claim Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Submission Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <td className="px-6 py-4">{claim.name}</td>
                    <td className="px-6 py-4 text-slate-300">{claim.description}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 bg-slate-800/50">
                      {claim.submissionDate.toDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* View Button */}
                        <button
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md"
                          onClick={() => viewClaim(claim.id)} // This now navigates
                        >
                          View
                        </button>

                        {/* Approve Button */}
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                          onClick={() => setClaimStatus(claim.id, Status.ClaimApproved)}
                        >
                          Approve
                        </button>

                        {/* Reject Button */}
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                          onClick={() => setClaimStatus(claim.id, Status.ClaimRejected)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
