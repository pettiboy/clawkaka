import { config } from "../config.js";

function getApiUrl(): string {
  return `${config.whatsappApiBaseUrl}/v22.0/${config.whatsappPhoneNumberId}/messages`;
}

async function postToWhatsApp(body: Record<string, any>): Promise<void> {
  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[WhatsApp API] Error ${res.status}: ${text}`);
  }
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  await postToWhatsApp({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

/**
 * Send typing indicator ("typing...") to the user.
 * This also marks the message as read. Typing indicator lasts up to 25 seconds
 * or until a response is sent, whichever comes first.
 */
export async function sendTypingIndicator(to: string, messageId: string): Promise<void> {
  await postToWhatsApp({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    status: "read",
    message_id: messageId,
    typing_indicator: {
      type: "text",
    },
  });
}

export async function markAsRead(messageId: string): Promise<void> {
  await postToWhatsApp({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

export function sendLongMessage(to: string, text: string): Promise<void[]> {
  const MAX_LEN = 4096;
  if (text.length <= MAX_LEN) {
    return Promise.all([sendWhatsAppMessage(to, text)]);
  }
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_LEN) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n\n", MAX_LEN);
    if (splitAt < MAX_LEN / 2) {
      splitAt = remaining.lastIndexOf("\n", MAX_LEN);
    }
    if (splitAt < MAX_LEN / 2) {
      splitAt = remaining.lastIndexOf(" ", MAX_LEN);
    }
    if (splitAt < 1) {
      splitAt = MAX_LEN;
    }
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return Promise.all(chunks.map((chunk) => sendWhatsAppMessage(to, chunk)));
}
