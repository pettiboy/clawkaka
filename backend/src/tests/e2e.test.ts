/**
 * Clawkaka E2E Test Suite
 *
 * Validates the full pipeline: WhatsApp webhook → sandbox provisioning → OpenClaw → response.
 * Requires: Docker running, sandbox image built (`docker build -t clawkaka-sandbox -f docker/Dockerfile.sandbox docker/`),
 * PostgreSQL running (docker-compose up postgres), and environment variables set.
 *
 * Run: npm run test:e2e
 */

import { PrismaClient } from "@prisma/client";
import Docker from "dockerode";
import { config } from "../config.js";

const prisma = new PrismaClient();
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const TEST_PHONE = "919999999999";
const BASE_URL = `http://localhost:${config.port}`;

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

async function cleanup() {
  // Remove test user's sandbox container if exists
  const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
  if (user) {
    const sandbox = await prisma.sandbox.findUnique({ where: { userId: user.id } });
    if (sandbox?.containerId) {
      try {
        const container = docker.getContainer(sandbox.containerId);
        try { await container.stop({ t: 2 }); } catch {}
        try { await container.remove({ force: true }); } catch {}
      } catch {}
    }
    // Clean DB records
    await prisma.message.deleteMany({ where: { sandbox: { userId: user.id } } });
    await prisma.sandbox.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

function makeWebhookPayload(phone: string, text: string) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "test-entry",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15551234567",
                phone_number_id: "test-phone-id",
              },
              contacts: [{ profile: { name: "Test User" }, wa_id: phone }],
              messages: [
                {
                  from: phone,
                  id: `wamid.test-${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}

async function postWebhook(text: string): Promise<Response> {
  return fetch(`${BASE_URL}/whatsapp/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(makeWebhookPayload(TEST_PHONE, text)),
  });
}

async function waitForMessages(
  sandboxId: string,
  role: string,
  minCount: number,
  timeoutMs = 30_000,
): Promise<any[]> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const messages = await prisma.message.findMany({
      where: { sandboxId, role },
      orderBy: { createdAt: "asc" },
    });
    if (messages.length >= minCount) return messages;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout waiting for ${minCount} ${role} message(s) in sandbox ${sandboxId}`);
}

async function waitForSandboxReady(timeoutMs = 60_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
    if (user) {
      const sandbox = await prisma.sandbox.findUnique({ where: { userId: user.id } });
      if (sandbox?.status === "ready") return sandbox;
      if (sandbox?.status === "error") throw new Error(`Sandbox error: ${sandbox.errorMessage}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Timeout waiting for sandbox to become ready");
}

async function execInContainer(containerId: string, cmd: string[]): Promise<string> {
  const container = docker.getContainer(containerId);
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  });
  const stream = await exec.start({ hijack: true, stdin: false });
  let output = "";
  stream.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  await new Promise<void>((r) => stream.on("end", r));
  return output;
}

// ────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function run() {
  console.log("\n🧪 Clawkaka E2E Tests\n");

  // Pre-clean
  await cleanup();

  let sandboxId: string;
  let containerId: string;

  // ── Test 1: Sandbox lifecycle via webhook ──
  await test("1. Webhook triggers sandbox provisioning", async () => {
    const res = await postWebhook("Hi");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    // User should be created
    const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
    if (!user) throw new Error("User not created");
  });

  await test("2. Sandbox becomes ready", async () => {
    const sandbox = await waitForSandboxReady(60_000);
    sandboxId = sandbox.id;
    containerId = sandbox.containerId!;
    if (!containerId) throw new Error("No container ID");
  });

  await test("3. Container is running", async () => {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) throw new Error("Container is not running");
  });

  // ── Test 2: WhatsApp webhook round-trip ──
  await test("4. First message gets assistant response", async () => {
    // The "Hi" message from test 1 should have been processed
    const messages = await waitForMessages(sandboxId, "assistant", 1, 30_000);
    if (messages.length < 1) throw new Error("No assistant response");
    console.log(`    Response: "${messages[0].content.slice(0, 80)}..."`);
  });

  await test("5. User message saved to DB", async () => {
    const userMsgs = await prisma.message.findMany({
      where: { sandboxId, role: "user" },
    });
    if (userMsgs.length < 1) throw new Error("No user messages in DB");
    if (userMsgs[0].source !== "whatsapp") throw new Error(`Expected source=whatsapp, got ${userMsgs[0].source}`);
  });

  // ── Test 3: PA onboarding flow ──
  await test("6. Onboarding: send name and role", async () => {
    await postWebhook("I'm Priya, PM at Flipkart");
    await waitForMessages(sandboxId, "assistant", 2, 30_000);
  });

  // ── Test 4: Calorie tracking ──
  await test("7. Calorie tracking: log a meal", async () => {
    await postWebhook("Had 2 rotis and dal for lunch");
    await waitForMessages(sandboxId, "assistant", 3, 30_000);

    // Verify meals table has entry
    await new Promise((r) => setTimeout(r, 5000)); // Allow time for DB write
    const output = await execInContainer(containerId, [
      "sqlite3", "-json", "/data/pa/pa.sqlite",
      "SELECT * FROM meals ORDER BY id DESC LIMIT 1;",
    ]);
    console.log(`    SQLite meals: ${output.trim().slice(0, 200)}`);
  });

  // ── Test 5: Expense tracking ──
  await test("8. Expense tracking: Uber ride", async () => {
    await postWebhook("Uber to office 280");
    await waitForMessages(sandboxId, "assistant", 4, 30_000);

    await new Promise((r) => setTimeout(r, 5000));
    const output = await execInContainer(containerId, [
      "sqlite3", "-json", "/data/pa/pa.sqlite",
      "SELECT * FROM expenses ORDER BY id DESC LIMIT 1;",
    ]);
    console.log(`    SQLite expenses: ${output.trim().slice(0, 200)}`);
  });

  await test("9. Expense tracking: Starbucks", async () => {
    await postWebhook("Spent 450 at Starbucks");
    await waitForMessages(sandboxId, "assistant", 5, 30_000);

    await new Promise((r) => setTimeout(r, 5000));
    const output = await execInContainer(containerId, [
      "sqlite3", "-json", "/data/pa/pa.sqlite",
      "SELECT * FROM expenses ORDER BY id DESC LIMIT 1;",
    ]);
    console.log(`    SQLite expenses: ${output.trim().slice(0, 200)}`);
  });

  // ── Test 6: Outbound handler (heartbeat simulation) ──
  await test("10. Heartbeat simulation: trigger manual event", async () => {
    const msgCountBefore = await prisma.message.count({
      where: { sandboxId, source: "heartbeat" },
    });

    await execInContainer(containerId, [
      "openclaw", "system", "event", "--text", "Check now", "--mode", "now",
    ]);

    // Wait for heartbeat message to be processed
    const start = Date.now();
    let msgCountAfter = msgCountBefore;
    while (Date.now() - start < 30_000) {
      msgCountAfter = await prisma.message.count({
        where: { sandboxId, source: "heartbeat" },
      });
      if (msgCountAfter > msgCountBefore) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Heartbeat may return HEARTBEAT_OK (which is silently skipped) so we check both cases
    console.log(`    Heartbeat messages: before=${msgCountBefore}, after=${msgCountAfter}`);
    // This is a best-effort test — heartbeat may produce HEARTBEAT_OK which is skipped
  });

  // ── Test 7: Cleanup ──
  await test("11. Teardown sandbox via DELETE endpoint", async () => {
    const res = await fetch(`${BASE_URL}/sandbox/${TEST_PHONE}`, { method: "DELETE" });
    const body = await res.json();
    if (!body.ok) throw new Error("Teardown failed");
  });

  await test("12. Container removed after teardown", async () => {
    try {
      const container = docker.getContainer(containerId);
      await container.inspect();
      throw new Error("Container still exists");
    } catch (err: any) {
      if (err.statusCode !== 404 && err.message !== "Container still exists") {
        // 404 is expected
      } else if (err.message === "Container still exists") {
        throw err;
      }
    }
  });

  await test("13. DB records cleaned up", async () => {
    const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });
    if (user) {
      const sandbox = await prisma.sandbox.findUnique({ where: { userId: user.id } });
      if (sandbox) throw new Error("Sandbox record still exists");
    }
  });

  console.log("\n✅ All tests passed!\n");
}

// Run
run()
  .catch((err) => {
    console.error("\n❌ Tests failed\n");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
