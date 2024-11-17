import { useState, useEffect } from "react";
import RefundClaimDiscussion from "./RefundClaimDiscussion";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import { CreditCompanyPage } from "./pages/creditCompany";
import { Claim } from "./components/Claim";
import PolicyView from "./PolicyView";
import BankingApp from "./components/BankingApp";
import Home from "./pages/home";
import ChargebackClient from "./FrontendIntegration";
import { Claim as ClaimType } from "./types"; // Assuming the interface is in types.ts
import { Status } from "./components/Graph";

const App = () => {
  const [claimDetails, setClaimDetails] = useState<ClaimType | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<ChargebackClient | null>(null);

  // Initialize the client
  useEffect(() => {
    const chargebackClient = new ChargebackClient("http://localhost:5001");
    setClient(chargebackClient);

    const initializeClient = async () => {
      try {
        setConnected(true);
        console.log(chargebackClient);
        console.log("Client initialized and connected.");
      } catch (error) {
        console.error("Failed to connect the client:", error);
      }
    };

    initializeClient();

    return () => {
      chargebackClient.disconnect();
      console.log("Client disconnected.");
    };
  }, []);

  // Initialize claim details with proper type
  useEffect(() => {
    const demoClaimDetails: ClaimType = {
      id: 123456,
      name: "Product Shipment Delay Claim",
      description: "Refund claim due to delayed shipment of product XYZ.",
      documentFiles: ["invoice.pdf", "shipping_label.pdf"],
      events: [
        {
          id: 1,
          timestamp: "2024-11-01T10:00:00Z",
          description: "Claim filed by user.",
        },
        {
          id: 2,
          timestamp: "2024-11-01T11:30:00Z",
          description: "Refund initiation started by Credit Card Co.",
        },
        {
          id: 3,
          timestamp: "2024-11-01T14:15:00Z",
          description: "Seller approval received for refund.",
        },
        {
          id: 4,
          timestamp: "2024-11-02T09:00:00Z",
          description: "Adjudicator review completed. Pending refund approval.",
        },
      ],
      status: Status.ClaimSubmitted, // Assuming Status is an enum from Graph component
      submissionDate: new Date("2024-11-01T10:00:00Z"),
    };

    setClaimDetails(demoClaimDetails);
  }, []);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/creditCompany" element={<CreditCompanyPage />} />
          <Route path="/policyView" element={<PolicyView />} />
          <Route
            path="/refundClaimDiscussion/:id"
            element={<RefundClaimDiscussionWrapper claimDetails={claimDetails} client={client} />}
          />
          <Route path="/claim/:id" element={<Claim />} />
          <Route
            path="/bankingApp"
            element={(claimDetails && client) ? <BankingApp client={client}/> : <div>Loading...</div>}
          />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;

// Component to handle dynamic claimId from URL
const RefundClaimDiscussionWrapper = ({ claimDetails, client }: { claimDetails: ClaimType | null; client: ChargebackClient | null }) => {
  const { id: claimId } = useParams();

  if (!claimDetails || !client || !claimId) {
    return <div>Loading...</div>;
  }

  return <RefundClaimDiscussion claimDetails={claimDetails} client={client} claimId={Number(claimId)} />;
};
