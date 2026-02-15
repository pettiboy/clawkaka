// Types for Twilio Voice API

export interface CallData {
  callSid: string;
  from: string;
  to: string;
  callStatus: string;
  direction: string;
  timestamp: string;
  transcriptions: TranscriptionSegment[];
  fullTranscript?: string;
}

export interface TranscriptionSegment {
  transcriptionSid: string;
  text: string;
  confidence: number;
  track: 'inbound_track' | 'outbound_track';
  timestamp: string;
}

export interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
  FromZip?: string;
}

export interface TwilioTranscriptionWebhook {
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: string;
  AccountSid: string;
  CallSid: string;
  Confidence?: string;
  Track?: 'inbound_track' | 'outbound_track';
}

export interface CallLog {
  callSid: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  transcriptions: TranscriptionSegment[];
  fullTranscript: string;
}
