import { Status } from "./components/Graph";

// Define the structure of the event
export interface Event {
  timestamp: string;
  description: string;
}

export interface Claim {
  id: number;
  name: string;
  description: string;
  documentFiles: string[];
  events: Event[];
  status: Status;
  submissionDate: Date;
}
