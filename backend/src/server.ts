import express from "express";
import cors from "cors";
import { createServer } from "http";
import { config } from "./config.js";
import { whatsappRouter } from "./routers/whatsapp.js";
import { sandboxRouter } from "./routers/sandbox.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// WhatsApp webhook routes (public, no auth)
app.use("/whatsapp", whatsappRouter);

// Sandbox routes (admin/debug, no auth)
app.use("/sandbox", sandboxRouter);

const server = createServer(app);

server.listen(config.port, () => {
  console.log(`[Clawkaka] Server listening on port ${config.port}`);
});
