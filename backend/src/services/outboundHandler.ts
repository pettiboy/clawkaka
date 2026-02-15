import { sendLongMessage } from "./whatsappApi.js";
import { prisma } from "../lib/prisma.js";

/**
 * Handles outbound messages from OpenClaw heartbeat/cron that need to reach WhatsApp.
 * Called when a chat.final event arrives with no active per-request callback.
 */
export async function handleOutboundMessage(
  sandboxId: string,
  content: string,
): Promise<void> {
  // Skip HEARTBEAT_OK — this means nothing needs attention
  if (content.trim() === "HEARTBEAT_OK") {
    console.log(`[Outbound] Heartbeat OK for sandbox ${sandboxId}, no action needed`);
    return;
  }

  try {
    // Look up the user's phone from the sandbox
    const sandbox = await prisma.sandbox.findUnique({
      where: { id: sandboxId },
      include: { user: true },
    });

    if (!sandbox || !sandbox.user) {
      console.error(`[Outbound] No sandbox/user found for ${sandboxId}`);
      return;
    }

    const phone = sandbox.user.phone;
    console.log(`[Outbound] Sending heartbeat message to ${phone}: "${content.slice(0, 80)}..."`);

    // Send to WhatsApp
    await sendLongMessage(phone, content);

    // Save to Message table with source "heartbeat"
    await prisma.message.create({
      data: {
        sandboxId,
        role: "assistant",
        content,
        status: "complete",
        source: "heartbeat",
      },
    });

    console.log(`[Outbound] Heartbeat message delivered to ${phone}`);
  } catch (err: any) {
    console.error(`[Outbound] Failed to handle outbound message:`, err.message);
  }
}
