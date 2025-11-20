export interface Highlight {
  start_time: string; // "MM:SS"
  end_time: string;   // "MM:SS"
  description: string;
  subtitle?: string;
}

export interface ProcessedClip extends Highlight {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  CUTTING = 'CUTTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface LogMessage {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error';
}
