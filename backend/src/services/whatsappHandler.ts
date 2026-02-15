import { PrismaClient } from "@prisma/client";
import { provisionSandbox } from "./sandbox.js";
import {
  sendWhatsAppMessage,
  sendTypingIndicator,
  markAsRead,
  sendLongMessage,
} from "./whatsappApi.js";
import {
  getOrCreateConnection,
  setCallbacks,
  sendChatMessage,
} from "./openclawConnectionManager.js";

const prisma = new PrismaClient();

interface QueueEntry {
  text: string;
  waMessageId: string;
}

interface UserQueue {
  queue: QueueEntry[];
  processing: boolean;
}

const userQueues = new Map<string, UserQueue>();

export async function handleIncomingMessage(
  phone: string,
  text: string,
  waMessageId: string
): Promise<void> {
  try {
    // 1. Mark as read immediately
    await markAsRead(waMessageId).catch((err) =>
      console.warn(`[WhatsApp] Failed to mark as read:`, err.message)
    );

    // 2. Find or create user by phone
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    // 3. Check sandbox
    let sandbox = await prisma.sandbox.findUnique({ where: { userId: user.id } });

    if (!sandbox) {
      await sendWhatsAppMessage(phone, "Setting up your environment... This may take a minute.");
      const result = await provisionSandbox(user.id);
      sandbox = result.sandbox;
    }

    if (sandbox.status === "provisioning") {
      await sendTypingIndicator(phone, waMessageId).catch(() => {});
      const pollStart = Date.now();
      while (Date.now() - pollStart < 90_000) {
        await new Promise((r) => setTimeout(r, 2000));
        sandbox = await prisma.sandbox.findUnique({ where: { userId: user.id } });
        if (!sandbox) {
          await sendWhatsAppMessage(phone, "Something went wrong setting up your environment. Please try again.");
          return;
        }
        if (sandbox.status === "ready") break;
        if (sandbox.status === "error") {
          await sendWhatsAppMessage(
            phone,
            `Setup failed: ${sandbox.errorMessage || "Unknown error"}. Please try again later.`
          );
          return;
        }
      }
      if (sandbox?.status !== "ready") {
        await sendWhatsAppMessage(phone, "Setup is taking too long. Please try again later.");
        return;
      }
    }

    if (sandbox.status === "error") {
      await sendWhatsAppMessage(
        phone,
        `Your environment has an error: ${sandbox.errorMessage || "Unknown"}. Please try again later.`
      );
      return;
    }

    if (sandbox.status !== "ready") {
      await sendWhatsAppMessage(phone, "Your environment is not ready yet. Please wait a moment and try again.");
      return;
    }

    // 4. Enqueue message
    enqueueMessage(user.id, sandbox.id, sandbox.port, sandbox.containerId, phone, {
      text,
      waMessageId,
    });
  } catch (err: any) {
    console.error(`[WhatsApp] Error handling message from ${phone}:`, err);
    await sendWhatsAppMessage(phone, "Sorry, something went wrong. Please try again.").catch(() => {});
  }
}

function enqueueMessage(
  userId: string,
  sandboxId: string,
  port: number,
  containerId: string | null,
  phone: string,
  entry: QueueEntry
): void {
  let uq = userQueues.get(userId);
  if (!uq) {
    uq = { queue: [], processing: false };
    userQueues.set(userId, uq);
  }

  if (uq.processing) {
    if (uq.queue.length >= 3) {
      sendWhatsAppMessage(phone, "You have too many messages queued. Please wait for a response.").catch(() => {});
      return;
    }
    uq.queue.push(entry);
    sendWhatsAppMessage(phone, "Your message is queued and will be processed shortly.").catch(() => {});
    return;
  }

  uq.processing = true;
  processMessage(userId, sandboxId, port, containerId, phone, entry).finally(() => {
    processNextInQueue(userId, sandboxId, port, containerId, phone);
  });
}

async function processNextInQueue(
  userId: string,
  sandboxId: string,
  port: number,
  containerId: string | null,
  phone: string
): Promise<void> {
  const uq = userQueues.get(userId);
  if (!uq) return;

  const next = uq.queue.shift();
  if (!next) {
    uq.processing = false;
    return;
  }

  processMessage(userId, sandboxId, port, containerId, phone, next).finally(() => {
    processNextInQueue(userId, sandboxId, port, containerId, phone);
  });
}

async function processMessage(
  userId: string,
  sandboxId: string,
  port: number,
  containerId: string | null,
  phone: string,
  entry: QueueEntry
): Promise<void> {
  try {
    // 1. Get or create connection
    const conn = await getOrCreateConnection(sandboxId, port, containerId);

    // 2. Start typing indicator (refresh every 20s)
    const typingInterval = setInterval(() => {
      sendTypingIndicator(phone, entry.waMessageId).catch(() => {});
    }, 20_000);
    sendTypingIndicator(phone, entry.waMessageId).catch(() => {});

    // 3. Save user message to DB
    await prisma.message.create({
      data: {
        sandboxId,
        role: "user",
        content: entry.text,
        status: "sent",
        source: "whatsapp",
      },
    });

    // 4. Set callbacks and wait for response
    const response = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        setCallbacks(sandboxId, {});
        reject(new Error("Response timeout"));
      }, 120_000);

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

      // 5. Send message to OpenClaw
      const chatId = sendChatMessage(sandboxId, entry.text);
      if (!chatId) {
        clearTimeout(timeout);
        setCallbacks(sandboxId, {});
        reject(new Error("Failed to send message to OpenClaw"));
      }
    });

    clearInterval(typingInterval);

    // 6. Save assistant message to DB
    await prisma.message.create({
      data: {
        sandboxId,
        role: "assistant",
        content: response,
        status: "complete",
        source: "whatsapp",
      },
    });

    // 7. Send response to user
    await sendLongMessage(phone, response);
  } catch (err: any) {
    console.error(`[WhatsApp] Error processing message for user ${userId}:`, err.message);
    await sendWhatsAppMessage(phone, `Sorry, I encountered an error: ${err.message}`).catch(() => {});
  }
}
