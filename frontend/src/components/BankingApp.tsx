import React, { useState } from 'react';

// Define the type for a transaction
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: string;
}

// Dummy transaction data
const dummyTransactions: Transaction[] = [
  { id: 1, date: '2024-11-15', description: 'Payment to John Doe', amount: -100.00, status: 'Completed' },
  { id: 2, date: '2024-11-14', description: 'Salary Deposit', amount: 3000.00, status: 'Completed' },
  { id: 3, date: '2024-11-10', description: 'Subscription Charge: Netflix', amount: -15.99, status: 'Completed' },
  { id: 4, date: '2024-11-09', description: 'Payment to XYZ Corp', amount: -500.00, status: 'Completed' },
  { id: 5, date: '2024-11-08', description: 'Refund from Store', amount: 50.00, status: 'Completed' }
];

const BankingApp: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleClosePaymentModal = () => {
    setSelectedTransaction(null); // Close the modal by resetting the selected transaction
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-800 w-full p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-500">MyBank</div>
          <div className="flex items-center space-x-6">
            {/* Settings Icon (SVG) */}
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-settings"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19 12h-1.42a7.978 7.978 0 0 0-.58-1.61l.99-.99a1 1 0 0 0 0-1.42l-1.41-1.41a1 1 0 0 0-1.42 0l-.99.99a7.978 7.978 0 0 0-1.61-.58V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.42a7.978 7.978 0 0 0-1.61.58l-.99-.99a1 1 0 0 0-1.42 0L4.7 7.6a1 1 0 0 0 0 1.42l.99.99a7.978 7.978 0 0 0-.58 1.61H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.42a7.978 7.978 0 0 0 .58 1.61l-.99.99a1 1 0 0 0 0 1.42l1.41 1.41a1 1 0 0 0 1.42 0l.99-.99a7.978 7.978 0 0 0 1.61.58V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1.42a7.978 7.978 0 0 0 1.61-.58l.99.99a1 1 0 0 0 1.42 0l1.41-1.41a1 1 0 0 0 0-1.42l-.99-.99a7.978 7.978 0 0 0 .58-1.61H19a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z"></path>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-lg mt-8">
        <h2 className="text-3xl font-semibold text-gray-100 text-center mb-8">Recent Transactions</h2>
        <div className="space-y-4">
          {dummyTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`flex justify-between items-center p-4 bg-gray-800 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-700 ${selectedTransaction?.id === transaction.id ? 'bg-blue-600' : ''}`}
              onClick={() => handleTransactionClick(transaction)}
            >
              <div className="flex flex-grow flex-col">
                <span className="text-sm text-gray-400 text-left">{transaction.date}</span>
                <span className="text-lg font-medium text-gray-100 text-left">{transaction.description}</span>
              </div>
              <div className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Transaction Details */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-gray-900 w-[400px] p-6 shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">Payment Details</h2>
            <div className="space-y-4">
              <p><strong>Description:</strong> {selectedTransaction.description}</p>
              <p><strong>Amount:</strong> ${Math.abs(selectedTransaction.amount).toFixed(2)}</p>
              <p><strong>Date:</strong> {selectedTransaction.date}</p>
              <p><strong>Status:</strong> {selectedTransaction.status}</p>
            </div>
            <div className="space-y-4 mt-4">
              <button
                className="w-full px-6 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-500"
                onClick={() => alert('Opening claim form for ' + selectedTransaction?.description)}
              >
                Request Reversal
              </button>
              <button
                className="w-full px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                onClick={handleClosePaymentModal} // Close the modal
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingApp;
