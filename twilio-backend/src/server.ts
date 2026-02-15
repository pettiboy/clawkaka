import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { config } from "./config.js";
import webhookRoutes from "./routes/webhooks.js";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Twilio Voice Backend",
    timestamp: new Date().toISOString(),
  });
});

// Welcome route
app.get("/", (_req, res) => {
  res.json({
    message: "Twilio Voice Backend with Real-Time Transcription",
    endpoints: {
      health: "/health",
      incomingCall: "/webhook/voice",
      realtimeTranscription: "/webhook/realtime-transcription",
      recordingTranscription: "/webhook/transcription",
      recordingStatus: "/webhook/recording-status",
      callStatus: "/webhook/call-status",
      getCall: "/api/calls/:callSid",
      getAllCalls: "/api/calls",
      getCallLogs: "/api/call-logs",
    },
    twilio: {
      phoneNumber: config.twilio.phoneNumber,
      accountSid: config.twilio.accountSid,
    },
    setup: {
      step1: "Make sure this server is accessible via HTTPS (use ngrok for testing)",
      step2: `Configure your Twilio phone number to point to: ${config.baseUrl}/webhook/voice`,
      step3: "Make a call to your Twilio number and speak",
      step4: "Check the console logs for real-time transcriptions",
      step5: `View call data at: ${config.baseUrl}/api/calls`,
    },
  });
});

// Routes
app.use("/", webhookRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(config.port, () => {
  console.log("\n==============================================");
  console.log("🎙️  TWILIO VOICE BACKEND WITH TRANSCRIPTION");
  console.log("==============================================");
  console.log(`✅ Server running at: http://localhost:${config.port}`);
  console.log(`📞 Twilio Phone Number: ${config.twilio.phoneNumber}`);
  console.log(`🔑 Twilio Account SID: ${config.twilio.accountSid}`);
  console.log("\n📋 SETUP INSTRUCTIONS:");
  console.log("1. Run ngrok: ngrok http " + config.port);
  console.log("2. Copy your ngrok HTTPS URL");
  console.log("3. Update BASE_URL in .env with your ngrok URL");
  console.log("4. Go to Twilio Console: https://console.twilio.com/");
  console.log("5. Configure your phone number's Voice webhook:");
  console.log(`   - Webhook URL: [YOUR_NGROK_URL]/webhook/voice`);
  console.log("   - HTTP Method: POST");
  console.log("6. Call your Twilio number and speak!");
  console.log("7. Watch transcriptions appear in console");
  console.log(`8. View call data: http://localhost:${config.port}/api/calls`);
  console.log("==============================================\n");
});

export default app;
