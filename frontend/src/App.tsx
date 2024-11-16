import { useState, useEffect } from "react";
import RefundClaimDiscussion from "./RefundClaimDiscussion"; // Import RefundClaimDiscussion component
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CreditCardCompanyPage } from "./pages/creditCardPage";

const App = () => {
  const [claimSummary, setClaimSummary] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]); // Set initial state for messages

  useEffect(() => {
    setClaimSummary(
      "Claim ID: #123456\nStatus: Awaiting adjudicator decision\nTotal Amount: $120.99\nDate Filed: 2024-11-01"
    );

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
          <Route
            path="/creditCardCompany"
            element={<CreditCardCompanyPage />}
          />
          <Route
            path="/refundClaimDiscussion"
            element={
              <RefundClaimDiscussion
                claimSummary={claimSummary}
                messages={messages}
              />
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
