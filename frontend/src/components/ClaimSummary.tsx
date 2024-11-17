import React, { useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface TransactionDetails {
  transaction_name: string | null | undefined;
  date_of_transaction: string | null | undefined;
  amount: string | null | undefined;
  merchant_name: string | null | undefined;
  merchant_email: string | null | undefined;
  transaction_id: string | null | undefined;
  user_id: string | null | undefined;
  issue_description: string | null | undefined;
  dispute_category: string | null | undefined;
  item_or_service: string | null | undefined;
  item_name: string | null | undefined;
  have_contacted_seller: string | null | undefined;
  tracking_information: string | null | undefined;
  attachment_summary: string | null | undefined;
  additional_notes: string | null | undefined;
  additional_info_requests: string | null | undefined;
}

interface TrackingInfo {
  error?: string | null | undefined;
}

interface ClaimSummaryData {
  transaction_details: TransactionDetails;
  tracking_info: TrackingInfo;
}

interface Props {
  data: {
    claim_summary: ClaimSummaryData;
  };
}

interface Event {
  id: number;
  timestamp: string;
  description: string;
  isNew?: boolean;
}

const ClaimSummary: React.FC<Props> = ({ data }) => {
  const { transaction_details, tracking_info } = data.claim_summary;
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [latestEventId, setLatestEventId] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const addNewEvent = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newEventId = latestEventId + 1;
    setLatestEventId(newEventId);

    const newEvent: Event = {
      timestamp: new Date().toLocaleString(),
      description: `Event update #${events.length + 1}`,
      id: newEventId,
      isNew: true,
    };

    setEvents(prev => [...prev, newEvent]);

    setTimeout(() => {
      setIsAnimating(false);
      setEvents(prev => prev.map(event => ({ ...event, isNew: false })));
    }, 1000);
  };

  const isEmpty = (value: string | null | undefined): boolean => {
    return value === null || value === undefined || value.trim() === '';
  };

  const formatField = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return <span className="text-slate-500 italic text-sm">Not provided</span>;
    }
    return value;
  };

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string | null | undefined }) => (
    <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/40 transition-all duration-200">
      <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-400">{label}</div>
        <div className="text-slate-200 mt-1 break-words">{formatField(value)}</div>
      </div>
    </div>
  );

  const additionalContentCount = [
    transaction_details.item_or_service,
    transaction_details.item_name,
    transaction_details.have_contacted_seller,
    transaction_details.attachment_summary,
    transaction_details.additional_notes
  ].filter(value => !isEmpty(value)).length;

  return (
    <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl mx-auto overflow-hidden border border-slate-800 h-full flex flex-col">
      <div className="border-b border-slate-800 p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">Claim Details</h2>
            {!isEmpty(transaction_details.transaction_id) && (
              <p className="text-sm text-slate-400 mt-2">
                ID: {transaction_details.transaction_id}
              </p>
            )}
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${tracking_info.error ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
            {tracking_info.error ? <AlertCircle size={16} /> : <Check size={16} />}
            <span className="text-sm font-medium">
              {tracking_info.error ? 'Pending' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {tracking_info.error && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-yellow-500" size={16} />
              <p className="text-yellow-500 text-sm">{tracking_info.error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow icon="💰" label="Amount" value={transaction_details.amount} />
          <DetailRow icon="🏪" label="Merchant" value={transaction_details.merchant_name} />
        </div>

        <DetailRow icon="📝" label="Issue Description" value={transaction_details.issue_description} />

        {isExpanded && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
            <DetailRow icon="📦" label="Item/Service" value={transaction_details.item_or_service} />
            <DetailRow icon="🏷️" label="Item Name" value={transaction_details.item_name} />
            <DetailRow icon="💬" label="Contacted Seller" value={transaction_details.have_contacted_seller} />
            <DetailRow icon="📎" label="Attachments" value={transaction_details.attachment_summary} />
            <DetailRow icon="📌" label="Additional Notes" value={transaction_details.additional_notes} />
          </div>
        )}

        {additionalContentCount > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>{isExpanded ? 'Show Less' : `Show ${additionalContentCount} More Details`}</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-300">Timeline</h3>
            <button
              onClick={addNewEvent}
              className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-pink-500 hover:bg-pink-600 text-white transition-colors duration-200"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          </div>

          <div className="relative space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-6">
                {index !== events.length - 1 && (
                  <div className="absolute left-2.5 top-[1.65rem] w-0.5 h-full -ml-px bg-pink-500/60" />
                )}
                <div className={`
                  pl-6 py-3 bg-slate-800/50 rounded-lg backdrop-blur-sm 
                  transition-all duration-200 
                  ${event.isNew ? 'ring-4 ring-pink-600 ring-opacity-60' : 'border-4 border-pink-600'}
                `}>
                  <div className="text-sm text-pink-600">{event.timestamp}</div>
                  <p className="text-slate-200 mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimSummary;
