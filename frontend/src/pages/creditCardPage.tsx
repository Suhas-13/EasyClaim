import React, { useState } from "react";
import { Claim, CreditCompanyUi } from "../components/CreditCompanyUi";
import { Status, Graph } from "../components/Graph";

export const CreditCardCompanyPage = () => {
  const [selectedClaimState, setSelectedClaimState] = useState<
    string | undefined
  >(undefined);

  const handleStateClaimChange = React.useCallback((claimState: string) => {
    setSelectedClaimState(claimState);
  }, []);

  const [claims, setClaims] = useState<Claim[]>(mockClaims);

  const filteredClaims = React.useMemo(
    () => claims.filter((claim) => claim.status === selectedClaimState),
    [claims, selectedClaimState]
  );

  const setClaimStatus = React.useCallback((id: number, status: Status) => {
    setClaims((claims) =>
      claims.map((claim) => (claim.id === id ? { ...claim, status } : claim))
    );
  }, []);
  return (
    <div className="flex flex-row min-h-5">
      <CreditCompanyUi
        claims={filteredClaims}
        setClaimStatus={setClaimStatus}
      />
      <Graph handleStateClaimChange={handleStateClaimChange} />
    </div>
  );
};

const mockClaims: Claim[] = [
  {
    id: 1,
    name: "Claim 1",
    description: "Description for claim 1",
    documentFiles: ["file1.pdf", "file2.pdf"],
    status: Status.ClaimSubmitted,
    submissionDate: new Date("2023-01-01"),
  },
  {
    id: 2,
    name: "Claim 2",
    description: "Description for claim 2",
    documentFiles: ["file3.pdf", "file4.pdf"],
    status: Status.ClaimApproved,
    submissionDate: new Date("2023-02-01"),
  },
  {
    id: 3,
    name: "Claim 3",
    description: "Description for claim 3",
    documentFiles: ["file5.pdf", "file6.pdf"],
    status: Status.AwaitingReview,
    submissionDate: new Date("2023-03-01"),
  },
  {
    id: 4,
    name: "Claim 4",
    description: "Description for claim 4",
    documentFiles: ["file7.pdf", "file8.pdf"],
    status: Status.AwaitingCustomerDocuments,
    submissionDate: new Date("2023-04-01"),
  },
  {
    id: 5,
    name: "Claim 5",
    description: "Description for claim 5",
    documentFiles: ["file9.pdf", "file10.pdf"],
    status: Status.AwaitingSellerDocuments,
    submissionDate: new Date("2023-05-01"),
  },
  {
    id: 6,
    name: "Claim 6",
    description: "Description for claim 6",
    documentFiles: ["file11.pdf", "file12.pdf"],
    status: Status.AwaitingLLMScreening,
    submissionDate: new Date("2023-06-01"),
  },
  {
    id: 7,
    name: "Claim 7",
    description: "Description for claim 7",
    documentFiles: ["file13.pdf", "file14.pdf"],
    status: Status.ClaimRejected,
    submissionDate: new Date("2023-07-01"),
  },
  {
    id: 8,
    name: "Claim 8",
    description: "Description for claim 8",
    documentFiles: ["file15.pdf", "file16.pdf"],
    status: Status.ClaimSubmitted,
    submissionDate: new Date("2023-08-01"),
  },
  {
    id: 9,
    name: "Claim 9",
    description: "Description for claim 9",
    documentFiles: ["file17.pdf", "file18.pdf"],
    status: Status.AwaitingReview,
    submissionDate: new Date("2023-09-01"),
  },
  {
    id: 10,
    name: "Claim 10",
    description: "Description for claim 10",
    documentFiles: ["file19.pdf", "file20.pdf"],
    status: Status.ClaimApproved,
    submissionDate: new Date("2023-10-01"),
  },
];
