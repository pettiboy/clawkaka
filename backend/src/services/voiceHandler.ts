import { provisionSandbox } from "./sandbox.js";
import { prisma } from "../lib/prisma.js";
import {
  getOrCreateConnection,
  setCallbacks,
  sendChatMessage,
} from "./openclawConnectionManager.js";
import {
  generateInitialTwiML,
  generateResponseTwiML,
  generateWaitTwiML,
  generateErrorTwiML,
} from "./twilioService.js";
import { config } from "../config.js";

/**
 * Handle incoming voice call - lookup/create user and provision sandbox if needed
 */
export async function handleIncomingCall(
  from: string,
  to: string
): Promise<string> {
  try {
    console.log(`[Voice] Incoming call from ${from} to ${to}`);

    // 1. Find or create user by phone
    const user = await prisma.user.upsert({
      where: { phone: from },
      update: {},
      create: { phone: from },
    });

    console.log(`[Voice] User: ${user.id}`);

    // 2. Check sandbox
    let sandbox = await prisma.sandbox.findUnique({
      where: { userId: user.id },
    });

    if (!sandbox) {
      console.log(`[Voice] No sandbox found, provisioning new one...`);
      const result = await provisionSandbox(user.id);
      sandbox = result.sandbox;
    }

    // 3. Handle provisioning state
    if (sandbox.status === "provisioning") {
      console.log(`[Voice] Sandbox is provisioning, returning wait TwiML`);
      return generateWaitTwiML(config.baseUrl);
    }

    if (sandbox.status === "error") {
      console.log(`[Voice] Sandbox has error: ${sandbox.errorMessage}`);
      return generateErrorTwiML(
        "Your account has an error. Please contact support."
      );
    }

    if (sandbox.status !== "ready") {
      console.log(`[Voice] Sandbox not ready, status: ${sandbox.status}`);
      return generateWaitTwiML(config.baseUrl);
    }

    // 4. Sandbox is ready, return initial greeting
    console.log(`[Voice] Sandbox ready, returning initial TwiML`);
    return generateInitialTwiML(config.baseUrl);
  } catch (err: any) {
    console.error(`[Voice] Error handling incoming call:`, err);
    return generateErrorTwiML(
      "Sorry, something went wrong. Please try again later."
    );
  }
}

/**
 * Handle transcription and respond - send to OpenClaw, wait for response, return TwiML
 */
export async function handleTranscriptionAndRespond(
  transcriptionText: string,
  from: string
): Promise<string> {
  try {
    console.log(`[Voice] Transcription from ${from}: "${transcriptionText}"`);

    // Skip if transcription is empty
    if (!transcriptionText || transcriptionText.trim() === "") {
      console.log(`[Voice] Empty transcription, ignoring`);
      return generateResponseTwiML(
        config.baseUrl,
        "I didn't catch that, could you repeat?"
      );
    }

    // 1. Get user by phone
    const user = await prisma.user.findUnique({ where: { phone: from } });
    if (!user) {
      console.error(`[Voice] User not found for phone ${from}`);
      return generateErrorTwiML("User not found. Please call again.");
    }

    // 2. Get sandbox
    const sandbox = await prisma.sandbox.findUnique({
      where: { userId: user.id },
    });
    if (!sandbox || sandbox.status !== "ready") {
      console.error(
        `[Voice] Sandbox not ready for user ${user.id}, status: ${sandbox?.status}`
      );
      return generateErrorTwiML(
        "Your account is not ready. Please call again."
      );
    }

    console.log(
      `[Voice] Sending to OpenClaw sandbox ${sandbox.id} on port ${sandbox.port}`
    );

    // 3. Send to OpenClaw and wait for response
    const response = await sendToOpenClawAndWait(
      sandbox.id,
      sandbox.port,
      sandbox.containerId,
      transcriptionText
    );

    console.log(`[Voice] OpenClaw response: "${response.substring(0, 100)}..."`);

    // 4. Generate TwiML with response
    return generateResponseTwiML(config.baseUrl, response);
  } catch (err: any) {
    console.error(`[Voice] Error handling transcription:`, err);
    return generateResponseTwiML(
      config.baseUrl,
      "I'm having trouble right now, please try again."
    );
  }
}

/**
 * Send message to OpenClaw and wait for final response
 */
async function sendToOpenClawAndWait(
  sandboxId: string,
  port: number,
  containerId: string | null,
  text: string
): Promise<string> {
  // Get or create connection
  const conn = await getOrCreateConnection(sandboxId, port, containerId);

  // Wait for response with timeout
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      setCallbacks(sandboxId, {});
      reject(new Error("Response timeout after 30s"));
    }, 30_000);

    let accumulated = "";

    setCallbacks(sandboxId, {
      onDelta: (content) => {
        accumulated += content;
      },
      onFinal: (content) => {
        clearTimeout(timeout);
        setCallbacks(sandboxId, {});
        resolve(content || accumulated);
      },
      onError: (message) => {
        clearTimeout(timeout);
        setCallbacks(sandboxId, {});
        reject(new Error(message));
      },
    });

    // Send message to OpenClaw
    const chatId = sendChatMessage(sandboxId, text);
    if (!chatId) {
      clearTimeout(timeout);
      setCallbacks(sandboxId, {});
      reject(new Error("Failed to send message to OpenClaw"));
    }
  });
}

/**
 * Notify OpenClaw when call ends so it can decide what to send via WhatsApp
 */
export async function notifyCallEnded(
  sandboxId: string,
  duration: number
): Promise<void> {
  try {
    console.log(
      `[Voice] Notifying OpenClaw that call ended. Duration: ${duration}s`
    );

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedDuration =
      minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const systemMessage = `[SYSTEM] Voice call completed. Duration: ${formattedDuration}. You may want to send a follow-up message via WhatsApp with a summary, action items, or confirmation of what was discussed.`;

    // Send system message to OpenClaw - it will decide what to do
    sendChatMessage(sandboxId, systemMessage);

    console.log(`[Voice] Call-ended notification sent to OpenClaw`);
  } catch (err: any) {
    console.error(`[Voice] Error notifying call ended:`, err);
    // Don't throw - this is non-critical
  }
}
