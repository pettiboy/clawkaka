import { Router, Request, Response } from "express";
import {
  generateRealtimeTranscriptionTwiML,
} from "../services/twilioService.js";
import {
  initializeCall,
  addTranscription,
  endCall,
  getCall,
  getAllCalls,
  getRecentCallLogs,
} from "../services/callStorage.js";
import { TranscriptionSegment, TwilioVoiceWebhook } from "../types/call.js";
import { config } from "../config.js";

const router = Router();

// Incoming voice call webhook
router.post("/webhook/voice", async (req: Request, res: Response) => {
  console.log("\n=== Incoming Call ===");
  console.log("Request body:", req.body);

  const {
    CallSid,
    From,
    To,
    CallStatus,
    Direction,
    FromCity,
    FromState,
    FromCountry,
  } = req.body as TwilioVoiceWebhook;

  console.log(`Call SID: ${CallSid}`);
  console.log(`📞 CALLER PHONE NUMBER: ${From}`);
  console.log(`   Location: ${FromCity}, ${FromState}, ${FromCountry}`);
  console.log(`To (your Twilio number): ${To}`);
  console.log(`Status: ${CallStatus}`);
  console.log(`Direction: ${Direction}`);

  // Initialize call in storage (caller number is stored in "from")
  await initializeCall(CallSid, From, To, Direction, CallStatus);

  // Generate TwiML response with personalized greeting + real-time transcription
  const twiml = generateRealtimeTranscriptionTwiML(config.baseUrl, config.greetingName);

  console.log("Generated TwiML:", twiml);
  console.log("===================\n");

  res.type("text/xml");
  res.send(twiml);
});

// Real-time transcription webhook
router.post(
  "/webhook/realtime-transcription",
  async (req: Request, res: Response) => {
    console.log("\n=== Real-Time Transcription ===");
    console.log("Request body:", req.body);

    const {
      CallSid,
      TranscriptionSid,
      TranscriptionText,
      TranscriptionStatus,
      Confidence,
      Track,
    } = req.body;

    console.log(`Call SID: ${CallSid}`);
    console.log(`Transcription SID: ${TranscriptionSid}`);
    console.log(`Text: "${TranscriptionText}"`);
    console.log(`Confidence: ${Confidence}`);
    console.log(`Track: ${Track}`);
    console.log(`Status: ${TranscriptionStatus}`);

    if (TranscriptionText && TranscriptionText.trim() !== "") {
      const transcription: TranscriptionSegment = {
        transcriptionSid: TranscriptionSid,
        text: TranscriptionText,
        confidence: parseFloat(Confidence || "0"),
        track: Track || "inbound_track",
        timestamp: new Date().toISOString(),
      };

      await addTranscription(CallSid, transcription);
    }

    console.log("===============================\n");

    res.status(200).send("OK");
  }
);

// Recording transcription webhook (backup method)
router.post("/webhook/transcription", async (req: Request, res: Response) => {
  console.log("\n=== Recording Transcription ===");
  console.log("Request body:", req.body);

  const {
    CallSid,
    TranscriptionSid,
    TranscriptionText,
    TranscriptionStatus,
    RecordingSid,
  } = req.body;

  console.log(`Call SID: ${CallSid}`);
  console.log(`Recording SID: ${RecordingSid}`);
  console.log(`Transcription SID: ${TranscriptionSid}`);
  console.log(`Full Transcription: "${TranscriptionText}"`);
  console.log(`Status: ${TranscriptionStatus}`);

  if (TranscriptionText && TranscriptionText.trim() !== "") {
    const transcription: TranscriptionSegment = {
      transcriptionSid: TranscriptionSid,
      text: TranscriptionText,
      confidence: 1.0,
      track: "inbound_track",
      timestamp: new Date().toISOString(),
    };

    await addTranscription(CallSid, transcription);
  }

  console.log("===============================\n");

  res.status(200).send("OK");
});

// Recording status webhook
router.post(
  "/webhook/recording-status",
  async (req: Request, res: Response) => {
    console.log("\n=== Recording Status ===");
    console.log("Request body:", req.body);

    const { CallSid, RecordingStatus, RecordingDuration, RecordingUrl } =
      req.body;

    console.log(`Call SID: ${CallSid}`);
    console.log(`Status: ${RecordingStatus}`);
    console.log(`Duration: ${RecordingDuration} seconds`);
    console.log(`Recording URL: ${RecordingUrl}`);
    console.log("========================\n");

    res.status(200).send("OK");
  }
);

// Call status callback webhook
router.post("/webhook/call-status", async (req: Request, res: Response) => {
  console.log("\n=== Call Status Update ===");
  console.log("Request body:", req.body);

  const { CallSid, CallStatus, CallDuration } = req.body;

  console.log(`Call SID: ${CallSid}`);
  console.log(`Status: ${CallStatus}`);
  console.log(`Duration: ${CallDuration} seconds`);

  if (CallStatus === "completed" || CallStatus === "failed") {
    await endCall(CallSid, CallStatus, parseInt(CallDuration || "0"));
  }

  console.log("==========================\n");

  res.status(200).send("OK");
});

// API endpoint to get call details
router.get("/api/calls/:callSid", async (req: Request, res: Response) => {
  const callSid = Array.isArray(req.params.callSid)
    ? req.params.callSid[0]
    : req.params.callSid;

  const callData = getCall(callSid);

  if (!callData) {
    return res.status(404).json({ error: "Call not found" });
  }

  res.json(callData);
});

// API endpoint to get all active calls
router.get("/api/calls", async (req: Request, res: Response) => {
  const calls = getAllCalls();
  res.json({ calls, count: calls.length });
});

// API endpoint to get recent call logs
router.get("/api/call-logs", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const logs = await getRecentCallLogs(limit);
  res.json({ logs, count: logs.length });
});

export default router;
