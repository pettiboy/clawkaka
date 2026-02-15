import WebSocket from "ws";
import Docker from "dockerode";
import { config } from "../config.js";
import {
  getOrCreateDeviceKey,
  signChallenge,
  publicKeyRawBase64Url,
} from "./deviceAttestation.js";
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

interface OpenClawConnection {
  ws: WebSocket;
  sandboxId: string;
  port: number;
  authenticated: boolean;
  tickInterval: ReturnType<typeof setInterval> | null;
  lastActivityAt: number;
  onChatDelta?: (content: string, runId: string) => void;
  onChatFinal?: (content: string, runId: string) => void;
  onChatError?: (message: string) => void;
  onOutboundMessage?: (content: string) => void;
}

const connections = new Map<string, OpenClawConnection>();

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Periodic idle sweep
setInterval(() => {
  const now = Date.now();
  for (const [sandboxId, conn] of connections) {
    if (now - conn.lastActivityAt > IDLE_TIMEOUT_MS) {
      console.log(`[ConnMgr] Closing idle connection for sandbox ${sandboxId}`);
      removeConnection(sandboxId);
    }
  }
}, 60_000);

export function removeConnection(sandboxId: string): void {
  const conn = connections.get(sandboxId);
  if (!conn) return;
  if (conn.tickInterval) clearInterval(conn.tickInterval);
  if (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING) {
    conn.ws.close();
  }
  connections.delete(sandboxId);
  console.log(`[ConnMgr] Removed connection for sandbox ${sandboxId}`);
}

export function setCallbacks(
  sandboxId: string,
  callbacks: {
    onDelta?: (content: string, runId: string) => void;
    onFinal?: (content: string, runId: string) => void;
    onError?: (message: string) => void;
  }
): void {
  const conn = connections.get(sandboxId);
  if (!conn) return;
  conn.onChatDelta = callbacks.onDelta;
  conn.onChatFinal = callbacks.onFinal;
  conn.onChatError = callbacks.onError;
}

export function setOutboundCallback(
  sandboxId: string,
  callback: (content: string) => void,
): void {
  const conn = connections.get(sandboxId);
  if (!conn) return;
  conn.onOutboundMessage = callback;
}

export function sendChatMessage(sandboxId: string, message: string): string | null {
  const conn = connections.get(sandboxId);
  if (!conn || !conn.authenticated || conn.ws.readyState !== WebSocket.OPEN) {
    return null;
  }
  conn.lastActivityAt = Date.now();
  const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  conn.ws.send(
    JSON.stringify({
      type: "req",
      id,
      method: "chat.send",
      params: {
        sessionKey: "main",
        message,
        idempotencyKey: `clawkaka-${id}`,
      },
    })
  );
  console.log(`[ConnMgr] → OpenClaw chat.send id=${id} msg="${message.slice(0, 50)}"`);
  return id;
}

export function getOrCreateConnection(sandboxId: string, port: number, containerId: string | null): Promise<OpenClawConnection> {
  const existing = connections.get(sandboxId);
  if (existing && existing.authenticated && existing.ws.readyState === WebSocket.OPEN) {
    existing.lastActivityAt = Date.now();
    return Promise.resolve(existing);
  }
  if (existing) {
    removeConnection(sandboxId);
  }
  return connectToOpenClaw(sandboxId, port, containerId, 0);
}

function connectToOpenClaw(
  sandboxId: string,
  port: number,
  containerId: string | null,
  attempt: number
): Promise<OpenClawConnection> {
  return new Promise((resolve, reject) => {
    if (attempt > 2) {
      reject(new Error("Failed to connect to OpenClaw after retries"));
      return;
    }

    const ws = new WebSocket(`ws://localhost:${port}/`);
    const conn: OpenClawConnection = {
      ws,
      sandboxId,
      port,
      authenticated: false,
      tickInterval: null,
      lastActivityAt: Date.now(),
    };
    connections.set(sandboxId, conn);

    let pendingConnectId: string | null = null;
    let settled = false;

    const connectionTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        removeConnection(sandboxId);
        reject(new Error("Connection timeout"));
      }
    }, 30_000);

    ws.on("error", (err) => {
      console.error(`[ConnMgr] WS error for sandbox ${sandboxId}:`, err.message);
      if (!settled) {
        settled = true;
        clearTimeout(connectionTimeout);
        removeConnection(sandboxId);
        reject(new Error(`WS error: ${err.message}`));
      }
    });

    ws.on("close", () => {
      console.log(`[ConnMgr] WS closed for sandbox ${sandboxId}`);
      if (settled && conn.authenticated) {
        removeConnection(sandboxId);
      }
    });

    ws.on("message", async (data) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (msg.event !== "agent" && msg.event !== "health") {
        console.log(
          `[ConnMgr] ← OpenClaw: type=${msg.type} event=${msg.event || ""} id=${msg.id || ""} ok=${msg.ok ?? ""}`
        );
      }

      // Handle connect.challenge
      if (msg.type === "event" && msg.event === "connect.challenge") {
        try {
          const nonce = String(msg.payload?.nonce ?? "");
          const deviceKey = getOrCreateDeviceKey(sandboxId);
          const clientId = "cli";
          const clientMode = "cli";
          const role = "operator";
          const scopes = ["operator.read", "operator.write"];

          const { signature, signedAt } = signChallenge({
            nonce,
            privateKeyPem: deviceKey.privateKeyPem,
            deviceId: deviceKey.deviceId,
            clientId,
            clientMode,
            role,
            scopes,
            token: config.openclawGatewayToken,
          });

          const connectReqId = `connect-${Date.now()}`;
          pendingConnectId = connectReqId;

          ws.send(
            JSON.stringify({
              type: "req",
              id: connectReqId,
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: clientId,
                  version: "1.0.0",
                  platform: "linux",
                  mode: clientMode,
                },
                role,
                scopes,
                caps: ["voice"],
                auth: { token: config.openclawGatewayToken },
                device: {
                  id: deviceKey.deviceId,
                  publicKey: publicKeyRawBase64Url(deviceKey.publicKeyPem),
                  signature,
                  signedAt,
                  nonce,
                },
              },
            })
          );
        } catch (err: any) {
          console.error(`[ConnMgr] Device attestation failed:`, err);
          if (!settled) {
            settled = true;
            clearTimeout(connectionTimeout);
            removeConnection(sandboxId);
            reject(new Error("Device attestation failed"));
          }
        }
        return;
      }

      // Handle connect response
      if (msg.type === "res" && msg.id === pendingConnectId) {
        pendingConnectId = null;
        if (msg.ok) {
          conn.authenticated = true;
          const tickMs = msg.payload?.policy?.tickIntervalMs ?? 15_000;
          conn.tickInterval = setInterval(() => {
            if (conn.ws.readyState === WebSocket.OPEN) {
              conn.ws.send(
                JSON.stringify({
                  type: "req",
                  id: `tick-${Date.now()}`,
                  method: "status",
                  params: {},
                })
              );
            }
          }, tickMs);

          if (!settled) {
            settled = true;
            clearTimeout(connectionTimeout);
            resolve(conn);
          }
        } else {
          const errCode = (msg.error as any)?.code;
          const requestId = (msg.error as any)?.details?.requestId;

          // NOT_PAIRED: auto-approve
          if (errCode === "NOT_PAIRED" && requestId && containerId) {
            console.log(`[ConnMgr] NOT_PAIRED, auto-approving device ${requestId}...`);
            try {
              const container = docker.getContainer(containerId);
              const approveScript = [
                "sh",
                "-c",
                `cd /root/.openclaw/devices && ` +
                  `node -e "` +
                  `const fs = require('fs');` +
                  `const pending = JSON.parse(fs.readFileSync('pending.json','utf8'));` +
                  `const paired = JSON.parse(fs.readFileSync('paired.json','utf8'));` +
                  `const rid = '${requestId}';` +
                  `if (pending[rid]) { paired[rid] = pending[rid]; delete pending[rid]; ` +
                  `fs.writeFileSync('paired.json', JSON.stringify(paired, null, 2)); ` +
                  `fs.writeFileSync('pending.json', JSON.stringify(pending, null, 2)); ` +
                  `console.log('approved'); } else { console.log('not found'); }` +
                  `"`,
              ];
              const exec = await container.exec({
                Cmd: approveScript,
                AttachStdout: true,
                AttachStderr: true,
              });
              const stream = await exec.start({ hijack: true, stdin: false });
              let output = "";
              stream.on("data", (chunk: Buffer) => {
                output += chunk.toString();
              });
              await new Promise<void>((r) => stream.on("end", r));
              console.log(`[ConnMgr] Device approval result: ${output.trim()}`);
              console.log(`[ConnMgr] Reconnecting (attempt ${attempt + 1})...`);
              ws.removeAllListeners();
              ws.close();
              clearTimeout(connectionTimeout);
              setTimeout(() => {
                connectToOpenClaw(sandboxId, port, containerId, attempt + 1)
                  .then((c) => {
                    if (!settled) {
                      settled = true;
                      resolve(c);
                    }
                  })
                  .catch((err) => {
                    if (!settled) {
                      settled = true;
                      reject(err);
                    }
                  });
              }, 1500);
            } catch (err: any) {
              console.error(`[ConnMgr] Auto-approve failed:`, err.message);
              if (!settled) {
                settled = true;
                clearTimeout(connectionTimeout);
                removeConnection(sandboxId);
                reject(new Error("Device approval failed"));
              }
            }
            return;
          }

          const errMsg = (msg.error as any)?.message ?? "Gateway authentication failed";
          console.error(`[ConnMgr] Connect failed:`, JSON.stringify(msg.error));
          if (!settled) {
            settled = true;
            clearTimeout(connectionTimeout);
            removeConnection(sandboxId);
            reject(new Error(errMsg));
          }
        }
        return;
      }

      // Handle chat events
      if (msg.type === "event" && msg.event === "chat") {
        const p = msg.payload;
        if (!p) return;
        conn.lastActivityAt = Date.now();

        const rawContent = p.message?.content;
        const content = Array.isArray(rawContent)
          ? rawContent.map((b: any) => b.text ?? "").join("")
          : rawContent ?? "";

        if (p.state === "delta") {
          conn.onChatDelta?.(content, p.runId);
        } else if (p.state === "final") {
          // If there's a per-request callback, use it; otherwise route to outbound handler
          if (conn.onChatFinal) {
            conn.onChatFinal(content, p.runId);
          } else if (conn.onOutboundMessage && content) {
            conn.onOutboundMessage(content);
          }
        } else if (p.state === "error") {
          conn.onChatError?.(content || "OpenClaw error");
        }
        return;
      }

      // Handle failed chat.send responses
      if (msg.type === "res" && msg.id?.startsWith("chat-") && msg.ok === false) {
        const errMsg = (msg.error as any)?.message ?? "Chat request rejected";
        console.error(`[ConnMgr] chat.send rejected:`, JSON.stringify(msg.error));
        conn.onChatError?.(errMsg);
      }
    });
  });
}
