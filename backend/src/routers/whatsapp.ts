import { Router } from "express";
import { config } from "../config.js";
import type { WhatsAppWebhookBody } from "../types/whatsapp.js";
import { handleIncomingMessage } from "../services/whatsappHandler.js";

export const whatsappRouter = Router();

// GET /whatsapp/webhook — Meta verification
whatsappRouter.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsappVerifyToken) {
    console.log("[WhatsApp] Webhook verified");
    return res.status(200).send(challenge);
  }

  console.warn("[WhatsApp] Webhook verification failed");
  return res.sendStatus(403);
});

// POST /whatsapp/webhook — Receive messages
whatsappRouter.post("/webhook", (req, res) => {
  // Always respond 200 immediately to prevent Meta retries
  res.sendStatus(200);

  try {
    const body = req.body as WhatsAppWebhookBody;
    if (!body?.entry) return;

    for (const entry of body.entry) {
      if (!entry.changes) continue;
      for (const change of entry.changes) {
        // Only accept messages sent to our configured WhatsApp number
        const recipientPhoneId = change.value?.metadata?.phone_number_id;
        if (recipientPhoneId !== config.whatsappPhoneNumberId) {
          console.warn(
            `[WhatsApp] Ignoring message for phone_number_id=${recipientPhoneId} (expected ${config.whatsappPhoneNumberId})`
          );
          continue;
        }

        const messages = change.value?.messages;
        if (!messages) continue;

        for (const message of messages) {
          if (message.type !== "text" || !message.text?.body) continue;

          const phone = message.from;
          const text = message.text.body;
          const waMessageId = message.id;

          console.log(
            `[WhatsApp] Incoming from ${phone}: "${text.slice(0, 50)}"`
          );

          handleIncomingMessage(phone, text, waMessageId).catch((err) => {
            console.error(`[WhatsApp] handleIncomingMessage error:`, err);
          });
        }
      }
    }
  } catch (err) {
    console.error("[WhatsApp] Error parsing webhook body:", err);
  }
});
