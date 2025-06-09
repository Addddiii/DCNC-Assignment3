export interface GroundingSource {
  web?: {
    uri?: string;    // Made optional to match API
    title?: string;  // Made optional to match API
  };
  [key: string]: any; // To accommodate other potential grounding source types
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
  sources?: GroundingSource[];
  isStreaming?: boolean;
}

export interface PolicyDocument {
  title: string;
  content: string;
}