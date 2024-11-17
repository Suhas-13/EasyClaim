import React, { useState } from 'react';

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

  // Event-related state
  const [events, setEvents] = useState<Event[]>([]);
  const [latestEventId, setLatestEventId] = useState(events.length);
  const [isAnimating, setIsAnimating] = useState(false);

  const addNewEvent = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newEventId = latestEventId + 1;
    setLatestEventId(newEventId);

    const newEvent: Event = {
      timestamp: new Date().toLocaleString(),
      description: `New Event #${events.length + 1}`,
      id: newEventId,
      isNew: true,
    };

    setEvents((prev) => [...prev, newEvent]);

    setTimeout(() => {
      setIsAnimating(false);
      setEvents((prev) =>
        prev.map((event) => ({
          ...event,
          isNew: false,
        }))
      );
    }, 1000);
  };

  const isEmpty = (value: string | null | undefined): boolean => {
    return value === null || value === undefined || value.trim() === '';
  };

  const formatField = (value: string | null | undefined) => {
    if (isEmpty(value)) {
      return (
        <span className="text-slate-500 italic text-sm">
          No information provided
        </span>
      );
    }
    return value;
  };

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string | null | undefined }) => (
    <div className={`flex items-start space-x-3 p-4 rounded-lg transition-colors ${!isEmpty(value) ? 'bg-slate-800/50 hover:bg-slate-800/70' : 'bg-slate-800/30'}`}>
      <div className="text-indigo-400 mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-400">{label}</div>
        <div className="text-slate-200 mt-1 break-words">{formatField(value)}</div>
      </div>
    </div>
  );

  // Count how many additional fields have content
  const additionalContentCount = [
    transaction_details.item_or_service,
    transaction_details.item_name,
    transaction_details.have_contacted_seller,
    transaction_details.attachment_summary,
    transaction_details.additional_notes
  ].filter(value => !isEmpty(value)).length;

  return (
    <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden">
      <div className="border-b border-slate-800 p-6">
        <h2 className="text-xl font-semibold text-slate-200">Claim Details</h2>
        {!isEmpty(transaction_details.transaction_id) && (
          <p className="text-sm text-slate-400 mt-2">
            Transaction ID: {transaction_details.transaction_id}
          </p>
        )}
      </div>

      <div className="p-6">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div className={`p-2 rounded-full ${tracking_info.error ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
            <div className={`w-5 h-5 ${tracking_info.error ? 'text-yellow-500' : 'text-green-500'}`}>
              {tracking_info.error ? '⏳' : '✓'}
            </div>
          </div>
          <span className={`font-medium ${tracking_info.error ? 'text-yellow-500' : 'text-green-500'}`}>
            {tracking_info.error ? 'Pending Tracking' : 'Tracking Available'}
          </span>
        </div>

        {/* Error Alert */}
        {!isEmpty(tracking_info.error) && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500">⚠️</span>
              <p className="text-yellow-500 text-sm">{tracking_info.error}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow
              icon="💰"
              label="Amount"
              value={transaction_details.amount}
            />
            <DetailRow
              icon="🏪"
              label="Merchant Name"
              value={transaction_details.merchant_name}
            />
            <DetailRow
              icon="📧"
              label="Merchant Email"
              value={transaction_details.merchant_email}
            />
            <DetailRow
              icon="👤"
              label="User ID"
              value={transaction_details.user_id}
            />
          </div>

          <div className="mt-6">
            <DetailRow
              icon="📝"
              label="Issue Description"
              value={transaction_details.issue_description}
            />
          </div>

          {isExpanded && (
            <div className="space-y-4 mt-4 animate-[fadeIn_0.2s_ease-in-out]">
              <DetailRow
                icon="📦"
                label="Item/Service"
                value={transaction_details.item_or_service}
              />
              <DetailRow
                icon="🏷️"
                label="Item Name"
                value={transaction_details.item_name}
              />
              <DetailRow
                icon="💬"
                label="Contacted Seller"
                value={transaction_details.have_contacted_seller}
              />
              <DetailRow
                icon="📎"
                label="Attachments"
                value={transaction_details.attachment_summary}
              />
              <DetailRow
                icon="📌"
                label="Additional Notes"
                value={transaction_details.additional_notes}
              />
            </div>
          )}

          {additionalContentCount > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center space-x-2"
            >
              <span>{isExpanded ? 'Show Less' : `Show ${additionalContentCount} More Details`}</span>
              <span className="text-slate-400">
                {isExpanded ? '↑' : '↓'}
              </span>
            </button>
          )}
        </div>

        {/* Event Timeline */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-slate-300 mb-6">Event Timeline</h3>
          <div className="relative space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-4">
                {index !== events.length - 1 && (
                  <div className="absolute left-2 top-6 w-0.5 h-full -ml-px bg-indigo-500" />
                )}

                {event.isNew && index === events.length - 1 && (
                  <div
                    className="absolute left-2 top-[-16px] w-0.5 -ml-px bg-indigo-500"
                    style={{
                      height: '26px',
                      animation: 'growLine 0.5s ease-out forwards',
                      transformOrigin: 'top',
                      opacity: 1,
                    }}
                  />
                )}

                <div
                  className={`
                    absolute left-0 top-2 w-4 h-4 rounded-full 
                    ${event.isNew ? 'bg-indigo-500 animate-ping' : 'bg-slate-400'}
                  `}
                />
                <div className="pl-8 py-2 bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-400">{event.timestamp}</div>
                  <p className="text-slate-200 mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addNewEvent}
            className="mt-6 py-2 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-slate-200"
          >
            Add New Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimSummary;
