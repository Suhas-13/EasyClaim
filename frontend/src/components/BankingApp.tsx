import React, { useState } from 'react';
import { Bell, Settings, ChevronRight, Send, Phone, CreditCard, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  icon: React.ReactNode;
  label: string;
  color: string;
}

interface BankingAppProps {
  client: any;
}

const BankingApp: React.FC<BankingAppProps> = ({ client }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const navigate = useNavigate();

  const accounts: Account[] = [
    { id: 1, name: 'Main Checking Account', number: '****4321', balance: 5234.01 },
    { id: 2, name: 'Savings Account', number: '****8765', balance: 12750.00 },
    { id: 3, name: 'Investment Account', number: '****9876', balance: 45680.50 }
  ];

  const quickActions: QuickAction[] = [
    { icon: <Send className="h-5 w-5" />, label: 'Send Money', color: 'bg-blue-500' },
    { icon: <Phone className="h-5 w-5" />, label: 'Mobile Top-up', color: 'bg-green-500' },
    { icon: <CreditCard className="h-5 w-5" />, label: 'Cards', color: 'bg-purple-500' },
    { icon: <RefreshCw className="h-5 w-5" />, label: 'Exchange', color: 'bg-orange-500' }
  ];

  const transactions: Transaction[] = [
    { id: 1, date: '2024-10-13', description: 'Payment to Apple', amount: -600.00, status: 'Completed', category: 'Shopping' },
    { id: 2, date: '2024-10-14', description: 'Salary Deposit', amount: 3000.00, status: 'Completed', category: 'Income' },
    { id: 3, date: '2024-10-10', description: 'Subscription: Netflix', amount: -15.99, status: 'Completed', category: 'Entertainment' },
    { id: 4, date: '2024-10-09', description: 'Payment to XYZ Corp', amount: -500.00, status: 'Completed', category: 'Bills' },
    { id: 5, date: '2024-10-08', description: 'Refund from Store', amount: 50.00, status: 'Completed', category: 'Shopping' }
  ];

  const handleDisputeTransaction = async () => {
    if (selectedTransaction) {
      try {
        const id = await client.startNewClaim();
        navigate(`/refundClaimDiscussion/${id}`);
      } catch (error) {
        console.error('Error initiating dispute:', error);
      }
      setSelectedTransaction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-red-600 w-full p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="text-red-600 font-black text-2xl">H</div>
            </div>
            <div className="text-2xl font-bold text-white">HSBC</div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="p-2 hover:bg-red-500 rounded-full transition-colors">
              <Bell className="h-6 w-6 text-white" />
            </button>
            <button className="p-2 hover:bg-red-500 rounded-full transition-colors">
              <Settings className="h-6 w-6 text-white" />
            </button>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-semibold">JD</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Accounts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500">{account.number}</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">View Details</button>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">Transfer</button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <div className={`${action.color} p-2 rounded-lg text-white`}>
                  {action.icon}
                </div>
                <span className="font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <button
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="w-full flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : '-'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-medium ${
                      selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(selectedTransaction.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{selectedTransaction.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{selectedTransaction.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{selectedTransaction.status}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDisputeTransaction}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Dispute Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankingApp;