import React, { useState } from 'react';

// Define interfaces for our data structures
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: string;
  category: string;
}

interface Account {
  id: number;
  name: string;
  number: string;
  balance: number;
}

interface QuickAction {
  icon: string;
  label: string;
}

const BankingApp: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<string>('transactions');

  const accounts: Account[] = [
    { id: 1, name: 'Main Checking Account', number: '****4321', balance: 5234.01 },
    { id: 2, name: 'Savings Account', number: '****8765', balance: 12750.00 },
    { id: 3, name: 'Investment Account', number: '****9876', balance: 45680.50 }
  ];

  const quickActions: QuickAction[] = [
    { icon: '💸', label: 'Send Money' },
    { icon: '📱', label: 'Mobile Top-up' },
    { icon: '💳', label: 'Cards' },
    { icon: '🔄', label: 'Exchange' }
  ];

  const dummyTransactions: Transaction[] = [
    { id: 1, date: '2024-11-15', description: 'Payment to John Doe', amount: -100.00, status: 'Completed', category: 'Transfer' },
    { id: 2, date: '2024-11-14', description: 'Salary Deposit', amount: 3000.00, status: 'Completed', category: 'Income' },
    { id: 3, date: '2024-11-10', description: 'Subscription: Netflix', amount: -15.99, status: 'Completed', category: 'Entertainment' },
    { id: 4, date: '2024-11-09', description: 'Payment to XYZ Corp', amount: -500.00, status: 'Completed', category: 'Bills' },
    { id: 5, date: '2024-11-08', description: 'Refund from Store', amount: 50.00, status: 'Completed', category: 'Shopping' }
  ];

  const handleTransactionClick = (transaction: Transaction): void => {
    setSelectedTransaction(transaction);
  };

  const handleClosePaymentModal = (): void => {
    setSelectedTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navbar */}
      <nav className="bg-red-600 w-full p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <div className="text-red-600 font-black text-xl">H</div>
            </div>
            <div className="text-2xl font-bold text-white">HSBC</div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="text-white hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="text-white hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-800 font-semibold">JD</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Sub Navigation */}
      <div className="bg-white text-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto flex space-x-8 px-4">
          {['Overview', 'Payments', 'Cards', 'Investments', 'Insurance'].map((item) => (
            <button key={item} className="py-4 px-2 border-b-2 border-transparent hover:border-red-600 transition-colors">
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {accounts.map((account) => (
            <div key={account.id} className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-300">{account.name}</h3>
                  <p className="text-sm text-gray-400">{account.number}</p>
                </div>
                <div className="text-2xl font-bold">${account.balance.toLocaleString()}</div>
              </div>
              <div className="flex justify-between mt-4">
                <button className="text-sm text-blue-400 hover:text-blue-300">View Details</button>
                <button className="text-sm text-blue-400 hover:text-blue-300">Transfer</button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <button key={action.label} className="bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition-colors">
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-medium">{action.label}</div>
            </button>
          ))}
        </div>

        {/* Transactions Section */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Recent Transactions</h2>
            <button className="text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="space-y-4">
            {dummyTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 bg-gray-700 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-600"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-lg">
                      {transaction.category === 'Transfer' ? '↗️' : 
                       transaction.category === 'Income' ? '💰' :
                       transaction.category === 'Entertainment' ? '🎬' :
                       transaction.category === 'Bills' ? '📄' : '🛍️'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{transaction.description}</span>
                    <span className="text-sm text-gray-400">{transaction.date}</span>
                  </div>
                </div>
                <div className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 w-full max-w-md p-6 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Transaction Details</h2>
              <button onClick={handleClosePaymentModal} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Description</span>
                <span className="font-medium">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Amount</span>
                <span className={`font-medium ${selectedTransaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {selectedTransaction.amount < 0 ? '-' : '+'}${Math.abs(selectedTransaction.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Date</span>
                <span className="font-medium">{selectedTransaction.date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Status</span>
                <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-sm">
                  {selectedTransaction.status}
                </span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                Dispute Transaction
              </button>
              <button className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingApp;