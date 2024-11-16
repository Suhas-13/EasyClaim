import { useState, useEffect } from "react";
import RefundClaimDiscussion from "./RefundClaimDiscussion"; // Import RefundClaimDiscussion component
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CreditCompanyPage } from "./pages/creditCompany";
import { Claim } from "./components/Claim";
import PolicyView from "./PolicyView";
import BankingApp from "./components/BankingApp";
import Home from "./pages/home";

const App = () => {
  const [claimDetails, setClaimDetails] = useState<any>(null); // Update state to use claimDetails
  const [messages, setMessages] = useState<any[]>([]); // Set initial state for messages

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

    // Set demo messages
    setMessages([
      {
        content:
          "The refund has been initiated. Please wait 3-5 business days.",
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
        content:
          "The seller needs to approve the refund before we can proceed.",
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

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/creditCompany" element={<CreditCompanyPage />} />
          <Route path="/policyView" element={<PolicyView />} />

          <Route
            path="/refundClaimDiscussion/:id"
            element={
              claimDetails && (
                <RefundClaimDiscussion
                  claimDetails={claimDetails}
                  messages={messages}
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
