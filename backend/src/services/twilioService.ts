import twilio from "twilio";
import { config } from "../config.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Create Twilio client for API calls
export const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

// Generate initial greeting TwiML for incoming call
export function generateInitialTwiML(baseUrl: string): string {
  const twiml = new VoiceResponse();

  // Greet the caller
  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Hi! I'm your personal assistant. What can I help you with?"
  );

  // Start recording with transcription
  twiml.record({
    maxLength: 15, // 15 seconds per turn
    transcribe: true,
    transcribeCallback: `${baseUrl}/voice/webhook/transcription`,
    playBeep: false,
  });

  return twiml.toString();
}

// Generate response TwiML with OpenClaw's response
export function generateResponseTwiML(
  baseUrl: string,
  response: string
): string {
  const twiml = new VoiceResponse();

  // Speak OpenClaw's response
  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    response
  );

  // Continue recording for next user input
  twiml.record({
    maxLength: 15,
    transcribe: true,
    transcribeCallback: `${baseUrl}/voice/webhook/transcription`,
    playBeep: false,
  });

  return twiml.toString();
}

// Generate "please wait" TwiML for sandbox provisioning
export function generateWaitTwiML(baseUrl: string): string {
  const twiml = new VoiceResponse();

  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Setting up your account, please wait a moment..."
  );

  // Pause for a bit
  twiml.pause({ length: 3 });

  // Redirect back to main webhook to check again
  twiml.redirect(`${baseUrl}/voice/webhook/voice`);

  return twiml.toString();
}

// Generate error TwiML
export function generateErrorTwiML(errorMessage: string): string {
  const twiml = new VoiceResponse();

  twiml.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    errorMessage
  );

  twiml.hangup();

  return twiml.toString();
}

// Validate Twilio webhook signature (optional, for security)
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
