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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentModalOpen(true); // Open the payment modal when a transaction is clicked
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false); // Close the modal
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center mb-12">My Dark-Themed Banking App</h1>
      
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-semibold text-gray-100 text-center mb-8">Recent Transactions</h2>
        <div className="space-y-4">
          {dummyTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`flex justify-between items-center p-4 bg-gray-800 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-700 ${selectedTransaction?.id === transaction.id ? 'bg-blue-600' : ''}`}
              onClick={() => handleTransactionClick(transaction)}
            >
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">{transaction.date}</span>
                <span className="text-lg font-medium text-gray-100">{transaction.description}</span>
              </div>
              <div className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            <div className="flex justify-end mt-4">
              <button
                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                onClick={handleClosePaymentModal}
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
