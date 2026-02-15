import twilio from "twilio";
import { config } from "../config.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Create Twilio client for API calls
export const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

// Generate TwiML with real-time streaming transcription
export function generateRealtimeTranscriptionTwiML(baseUrl: string): string {
  const twiml = new VoiceResponse();

  // Greet the caller
  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Hello! This call will be transcribed in real-time. Please speak now."
  );

  // Start real-time transcription using the new TwiML
  const start = twiml.start();
  start.transcription({
    name: "Real-time Call Transcription",
    track: "both_tracks", // Transcribe both caller and system
    statusCallbackUrl: `${baseUrl}/webhook/realtime-transcription`,
    languageCode: "en-US",
  });

  // Keep the call open for a long time to allow speaking
  twiml.pause({ length: 300 }); // 5 minutes

  // Say goodbye
  twiml.say("Thank you for calling. Your conversation has been transcribed. Goodbye!");

  return twiml.toString();
}

// Validate Twilio webhook signature
export function validateTwilioRequest(
  url: string,
  params: Record<string, any>,
  signature: string
): boolean {
  return twilio.validateRequest(
    config.twilio.authToken,
    signature,
    url,
    params
  );
}

// Get call details from Twilio API
export async function getCallDetails(callSid: string) {
  try {
    const call = await twilioClient.calls(callSid).fetch();
    return call;
  } catch (error) {
    console.error(`Error fetching call ${callSid}:`, error);
    return null;
  }
}
