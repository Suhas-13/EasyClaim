import { useState, useEffect } from "react";
import RefundClaimDiscussion from "./RefundClaimDiscussion"; // Import RefundClaimDiscussion component
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CreditCompanyPage } from "./pages/creditCompany";
import { Claim } from "./components/Claim";
import PolicyView from "./PolicyView";
import BankingApp from "./components/BankingApp";
import Home from "./pages/home";
import ChargebackClient from "./FrontendIntegration"

const App = () => {
  const [claimDetails, setClaimDetails] = useState<any>(null); // Update state to use claimDetails
  const [messages, setMessages] = useState<any[]>([]); // Set initial state for messages
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<ChargebackClient | null>(null);
  const [claimId, setClaimId] = useState<number | null>(null);

  useEffect(() => {
    const chargebackClient = new ChargebackClient('http://localhost:5000');
    setClient(chargebackClient);

    const initializeClient = async () => {
      try {
        await chargebackClient.connect();
        console.log(chargebackClient)
        setConnected(true);
        console.log('Client initialized and connected.');
        setClaimId(await chargebackClient.startNewClaim());
      } catch (error) {
        console.error('Failed to connect the client:', error);
      }
    };

    initializeClient();

    // Cleanup function to disconnect the client when the component unmounts
    return () => {
      chargebackClient.disconnect();
      console.log('Client disconnected.');
    };
  }, []); // Empty dependency array ensures this runs only once on mount


  useEffect(() => {
    // Set demo claim details
    setClaimDetails({
      id: "123456",
      date: "2024-11-01",
      description: "Refund claim due to delayed shipment of product XYZ.",
      events: [
        { timestamp: "2024-11-01", description: "Claim filed by user." },
        {
          timestamp: "2024-11-01",
          description: "Refund initiation started by Credit Card Co.",
        },
        {
          timestamp: "2024-11-01",
          description: "Seller approval received for refund.",
        },
        {
          timestamp: "2024-11-02",
          description: "Adjudicator review completed. Pending refund approval.",
        },
      ],
    });
  });
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/creditCompany" element={<CreditCompanyPage />} />
          <Route path="/policyView" element={<PolicyView />} />

          <Route
            path="/refundClaimDiscussion/:id"
            element={
              (claimDetails && client && claimId) && (
                <RefundClaimDiscussion
                  claimDetails={claimDetails}
                  client={client}
                  claimId={claimId}
                />
              )
            }
          />
          <Route path="/claim/:id" element={<Claim />} />
          <Route
            path="/bankingApp"
            element={
              claimDetails && <BankingApp
              />
            }
          />
          <Route
            path="/home"
            element={
              <Home></Home>
            }>
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
