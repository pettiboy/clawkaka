import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { config } from "./config.js";
import { whatsappRouter } from "./routers/whatsapp.js";
import { sandboxRouter } from "./routers/sandbox.js";
import voiceRouter from "./routers/voice.js";

const app = express();
app.use(cors());
app.use(express.json());
// Add body-parser for Twilio webhooks (they send application/x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: false }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// WhatsApp webhook routes (public, no auth)
app.use("/whatsapp", whatsappRouter);

// Sandbox routes (admin/debug, no auth)
app.use("/sandbox", sandboxRouter);

// Voice/Twilio webhook routes (public, no auth)
app.use("/voice", voiceRouter);

const server = createServer(app);

server.listen(config.port, () => {
  console.log(`[Clawkaka] Server listening on port ${config.port}`);
  console.log(`[Clawkaka] Voice webhook: ${config.baseUrl}/voice/webhook/voice`);
  console.log(`[Clawkaka] WhatsApp webhook: ${config.baseUrl}/whatsapp/webhook`);
});
