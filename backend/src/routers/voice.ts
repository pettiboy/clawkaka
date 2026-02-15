import { Router, Request, Response } from "express";
import {
  handleIncomingCall,
  handleTranscriptionAndRespond,
  notifyCallEnded,
} from "../services/voiceHandler.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Incoming voice call webhook
 * Called by Twilio when a call comes in
 */
router.post("/webhook/voice", async (req: Request, res: Response) => {
  console.log("\n=== Incoming Voice Call ===");
  console.log("From:", req.body.From);
  console.log("To:", req.body.To);
  console.log("CallSid:", req.body.CallSid);
  console.log("==========================\n");

  try {
    const { From, To } = req.body;
    const twiml = await handleIncomingCall(From, To);

    res.type("text/xml");
    res.send(twiml);
  } catch (err: any) {
    console.error("[Voice Router] Error in /webhook/voice:", err);
    res.status(500).send("Error processing call");
  }
});

/**
 * Recording transcription webhook
 * Called by Twilio when a recording is transcribed
 */
router.post("/webhook/transcription", async (req: Request, res: Response) => {
  console.log("\n=== Recording Transcription ===");
  console.log("CallSid:", req.body.CallSid);
  console.log("TranscriptionText:", req.body.TranscriptionText);
  console.log("From:", req.body.From);
  console.log("==============================\n");

  try {
    const transcriptionText =
      req.body.TranscriptionText || req.body.transcription_text || "";
    const from = req.body.From;

    if (!transcriptionText || transcriptionText.trim() === "") {
      console.log("[Voice Router] Empty transcription, skipping");
      res.status(200).send("OK");
      return;
    }

    const twiml = await handleTranscriptionAndRespond(transcriptionText, from);

    res.type("text/xml");
    res.send(twiml);
  } catch (err: any) {
    console.error("[Voice Router] Error in /webhook/transcription:", err);
    res.status(500).send("Error processing transcription");
  }
});

/**
 * Call status webhook
 * Called by Twilio when call status changes (e.g., completed, failed)
 */
router.post("/webhook/call-status", async (req: Request, res: Response) => {
  console.log("\n=== Call Status Update ===");
  console.log("CallSid:", req.body.CallSid);
  console.log("CallStatus:", req.body.CallStatus);
  console.log("CallDuration:", req.body.CallDuration);
  console.log("From:", req.body.From);
  console.log("=========================\n");

  try {
    const { CallStatus, CallDuration, From } = req.body;

    if (CallStatus === "completed" && From) {
      const duration = parseInt(CallDuration || "0", 10);

      // Get user and sandbox
      const user = await prisma.user.findUnique({ where: { phone: From } });
      if (user) {
        const sandbox = await prisma.sandbox.findUnique({
          where: { userId: user.id },
        });
        if (sandbox && sandbox.status === "ready") {
          // Notify OpenClaw - it decides what to send
          await notifyCallEnded(sandbox.id, duration);
        }
      }
    }

    res.status(200).send("OK");
  } catch (err: any) {
    console.error("[Voice Router] Error in /webhook/call-status:", err);
    res.status(200).send("OK"); // Still return 200 to Twilio
  }
});

/**
 * Health check endpoint
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "Voice Service",
    timestamp: new Date().toISOString(),
  });
});

export default router;
