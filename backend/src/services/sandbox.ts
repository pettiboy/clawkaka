import { PrismaClient } from "@prisma/client";
import { allocatePort } from "../lib/ports.js";
import { createContainer, removeContainer } from "./docker.js";
import { getOrCreateDeviceKey, publicKeyRawBase64Url } from "./deviceAttestation.js";
import { provisionOpenRouterKey, deleteOpenRouterKey } from "./openrouterKeys.js";
import { removeConnection, getOrCreateConnection, setOutboundCallback } from "./openclawConnectionManager.js";
import { handleOutboundMessage } from "./outboundHandler.js";
import WebSocket from "ws";

const prisma = new PrismaClient();

/** Wait for the OpenClaw gateway WS to accept connections. */
async function waitForGateway(port: number, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}/`);
        const timer = setTimeout(() => {
          ws.close();
          reject(new Error("timeout"));
        }, 3000);
        ws.on("open", () => {
          clearTimeout(timer);
          ws.close();
          resolve();
        });
        ws.on("error", () => {
          clearTimeout(timer);
          reject(new Error("not ready"));
        });
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Gateway on port ${port} did not become ready within ${timeoutMs}ms`);
}

export async function provisionSandbox(userId: string) {
  // Check existing
  const existing = await prisma.sandbox.findUnique({ where: { userId } });
  if (existing) {
    return { sandbox: existing, created: false };
  }

  const port = await allocatePort();

  const sandbox = await prisma.sandbox.create({
    data: {
      userId,
      port,
      status: "provisioning",
    },
  });

  // Start container in background, update status when ready
  (async () => {
    try {
      // Provision a per-sandbox OpenRouter API key
      let openrouterApiKey: string | undefined;
      try {
        const keyResult = await provisionOpenRouterKey({
          name: `clawkaka-sandbox-${sandbox.id}`,
          limit: 20,
          limitReset: "monthly",
        });
        openrouterApiKey = keyResult.key;
        await prisma.sandbox.update({
          where: { id: sandbox.id },
          data: { openrouterKeyHash: keyResult.data.hash },
        });
      } catch (err: any) {
        console.warn(`[Sandbox] Failed to provision OpenRouter key: ${err.message}`);
      }

      // Generate device key before starting container so we can pre-seed it as approved
      const deviceKey = getOrCreateDeviceKey(sandbox.id);
      const deviceInfo = {
        deviceId: deviceKey.deviceId,
        publicKey: publicKeyRawBase64Url(deviceKey.publicKeyPem),
      };
      const containerId = await createContainer(sandbox.id, port, deviceInfo, openrouterApiKey);
      await prisma.sandbox.update({
        where: { id: sandbox.id },
        data: { containerId },
      });

      await waitForGateway(port);

      // Establish persistent WS connection and set outbound callback for heartbeat messages
      try {
        const conn = await getOrCreateConnection(sandbox.id, port, containerId);
        setOutboundCallback(sandbox.id, (content: string) => {
          handleOutboundMessage(sandbox.id, content);
        });
        console.log(`[Sandbox] Persistent connection established for ${sandbox.id}, outbound handler wired`);
      } catch (err: any) {
        console.warn(`[Sandbox] Failed to establish persistent connection: ${err.message}`);
        // Non-fatal — connection will be established on first message
      }

      await prisma.sandbox.update({
        where: { id: sandbox.id },
        data: { status: "ready" },
      });
      console.log(`[Sandbox] ${sandbox.id} is ready on port ${port}`);
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error(`[Sandbox] Failed to provision ${sandbox.id}:`, errorMessage);
      await prisma.sandbox.update({
        where: { id: sandbox.id },
        data: { status: "error", errorMessage },
      });
    }
  })();

  return { sandbox, created: true };
}

export async function getSandboxStatus(userId: string) {
  return prisma.sandbox.findUnique({ where: { userId } });
}

export async function teardownSandbox(userId: string) {
  const sandbox = await prisma.sandbox.findUnique({ where: { userId } });
  if (!sandbox) return false;

  if (sandbox.openrouterKeyHash) {
    try {
      await deleteOpenRouterKey(sandbox.openrouterKeyHash);
      console.log(`[Sandbox] Deleted OpenRouter key for ${sandbox.id}`);
    } catch (err: any) {
      console.warn(`[Sandbox] Failed to delete OpenRouter key: ${err.message}`);
    }
  }

  removeConnection(sandbox.id);

  if (sandbox.containerId) {
    await removeContainer(sandbox.containerId);
  }

  await prisma.sandbox.delete({ where: { id: sandbox.id } });
  console.log(`[Sandbox] Torn down ${sandbox.id}`);
  return true;
}
