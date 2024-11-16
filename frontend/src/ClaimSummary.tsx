import React, { useState } from 'react';

interface ClaimEvent {
  timestamp: string;
  description: string;
  id: number;
  isNew?: boolean; // Add isNew property, which is optional for old events
}

const ClaimSummary = () => {
  const initialEvents: ClaimEvent[] = [
    { timestamp: "2024-03-15 09:00", description: "Claim Filed", id: 1 },
    { timestamp: "2024-03-16 14:30", description: "Initial Review Complete", id: 2 }
  ];

  const [events, setEvents] = useState<ClaimEvent[]>(initialEvents);
  const [latestEventId, setLatestEventId] = useState(2);
  const [isAnimating, setIsAnimating] = useState(false);

  const addNewEvent = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newEventId = latestEventId + 1;
    setLatestEventId(newEventId);

    const newEvent: ClaimEvent = {
      timestamp: new Date().toLocaleString(),
      description: `New Event #${events.length + 1}`,
      id: newEventId,
      isNew: true // Mark the new event as `isNew`
    };

    setEvents(prev => [...prev, newEvent]);

    setTimeout(() => {
      setIsAnimating(false);
      setEvents(prev => 
        prev.map(event => ({
          ...event,
          isNew: false // Reset `isNew` for all events after animation
        }))
      );
    }, 1000);
  };

  return (
    <div className="bg-slate-900 shadow-xl h-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
            Claim Overview
          </h2>
          <button 
            onClick={addNewEvent}
            disabled={isAnimating}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-medium text-slate-300 mb-6">
          Event Timeline
        </h3>
        <div className="relative space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="relative pl-4"
            >
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
                    opacity: 1
                  }}
                />
              )}

              <div 
                className={`
                  absolute left-0 top-2 w-4 h-4 rounded-full border-2 bg-slate-900 border-indigo-500
                  ${event.isNew ? 'animate-fade-in' : ''}
                `}
                style={{
                  opacity: event.isNew ? 0 : 1,
                  animation: event.isNew ? 'fadeIn 0.3s ease-out 0.5s forwards' : 'none'
                }}
              />
              
              <div 
                className="ml-6"
                style={{
                  opacity: event.isNew ? 0 : 1,
                  animation: event.isNew ? 'fadeIn 0.3s ease-out 0.5s forwards' : 'none'
                }}
              >
                <span className="block text-sm font-medium text-slate-400 mb-1">
                  {event.timestamp}
                </span>
                <span className="block text-slate-200">
                  {event.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes growLine {
          0% {
            transform: scaleY(0);
            opacity: 0;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ClaimSummary;
