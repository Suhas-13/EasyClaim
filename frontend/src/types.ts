// Define the structure of the event
export interface Event {
  timestamp: string;
  description: string;
}

// Define the structure of the claim details
export interface ClaimDetails {
  date: string;
  description: string;
  id: string;
  events: Event[];
}
