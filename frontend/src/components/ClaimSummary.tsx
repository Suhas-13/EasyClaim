import React, { useState } from "react";
import { Claim, Event } from "../types";

type EventWithIsNew = Event & {
  isNew?: boolean; // Optional property to track new events
}

const ClaimSummary: React.FC<{ claim: Claim }> = ({ claim }) => {
  // Explicitly typing the event and index parameters
  const initialEvents: EventWithIsNew[] = claim.events.map((event: Event, index: number) => ({
    ...event,
    isNew: false
  }));

  const [events, setEvents] = useState<EventWithIsNew[]>(initialEvents);
  const [latestEventId, setLatestEventId] = useState(events.length);
  const [isAnimating, setIsAnimating] = useState(false);

  const addNewEvent = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newEventId = latestEventId + 1;
    setLatestEventId(newEventId);

    const newEvent: EventWithIsNew = {
      timestamp: new Date().toLocaleString(),
      description: `New Event #${events.length + 1}`,
      id: newEventId,
      isNew: true, // Mark the new event as `isNew`
    };

    setEvents((prev) => [...prev, newEvent]);

    setTimeout(() => {
      setIsAnimating(false);
      setEvents((prev) =>
        prev.map((event) => ({
          ...event,
          isNew: false, // Reset `isNew` for all events after animation
        }))
      );
    }, 1000);
  };

  return (
    <div className="bg-slate-900 shadow-xl h-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">{claim.name}</h2>
        <p className="text-sm text-slate-400 mb-2">{claim.description}</p>
        <span className="block text-sm text-slate-400 mb-2">
          Submission Date: {new Date(claim.submissionDate).toLocaleDateString()}
        </span>
        <span className="block text-sm text-slate-400 mb-6">
          Status: <span className="text-indigo-500">{claim.status}</span>
        </span>
      </div>

      <div className="p-6">
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
                    height: "26px",
                    animation: "growLine 0.5s ease-out forwards",
                    transformOrigin: "top",
                    opacity: 1,
                  }}
                />
              )}

              <div
                className={`
                  absolute left-0 top-2 w-4 h-4 rounded-full border-2 bg-slate-900 border-indigo-500
                  ${event.isNew ? "animate-fade-in" : ""}
                `}
                style={{
                  opacity: event.isNew ? 0 : 1,
                  animation: event.isNew
                    ? "fadeIn 0.3s ease-out 0.5s forwards"
                    : "none",
                }}
              />

              <div
                className="ml-6"
                style={{
                  opacity: event.isNew ? 0 : 1,
                  animation: event.isNew
                    ? "fadeIn 0.3s ease-out 0.5s forwards"
                    : "none",
                }}
              >
                <span className="block text-sm font-medium text-slate-400 mb-1">
                  {event.timestamp}
                </span>
                <span className="block text-slate-200">{event.description}</span>
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
