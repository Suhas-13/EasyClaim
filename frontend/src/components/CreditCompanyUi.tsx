import React, { useState, useCallback } from "react";
import { Status } from "./Graph";
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
  const [filter, setFilter] = useState<string>(""); // Add a state for filtering

  // Modify the viewClaim function to navigate to /claim with the claim's ID
  const viewClaim = useCallback((id: number) => {
    navigate(`/claim/${id}`); // Redirect to /claim with claim id
  }, [navigate]);

  // Filter claims based on the filter state

  const filteredClaims = filter
    ? claims.filter((claim) => claim.name.toLowerCase().includes(filter.toLowerCase()))
    : claims;

  console.log('....');
  console.log(filter);
  console.log(filteredClaims);
  console.log(claims);

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 font-sans p-8 min-w-[300px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-slate-100">Claims</h3>
            {/* Display claims count dynamically */}
            <p className="text-slate-400 mt-2">{`${filteredClaims.length} claim(s) found`}</p>
            {/* Filter Input */}
            <input
              type="text"
              placeholder="Search by name..."
              className="mt-4 p-2 rounded-md bg-slate-700 text-slate-200"
              value={filter}
              onChange={(e) => setFilter(e.target.value)} // Handle input change
            />
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
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                      No claims found.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
