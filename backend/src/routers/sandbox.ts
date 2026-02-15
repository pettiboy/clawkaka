import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  getSandboxStatus,
  teardownSandbox,
} from "../services/sandbox.js";
export const sandboxRouter = Router();

// GET /sandbox/status/:phone — Get sandbox status by phone number
sandboxRouter.get("/status/:phone", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { phone: req.params.phone } });
  if (!user) {
    return res.status(404).json({ error: "No user found" });
  }
  const sandbox = await getSandboxStatus(user.id);
  if (!sandbox) {
    return res.status(404).json({ error: "No sandbox found" });
  }
  return res.json({
    id: sandbox.id,
    status: sandbox.status,
    errorMessage: sandbox.errorMessage,
    model: sandbox.model,
    createdAt: sandbox.createdAt,
  });
});

// DELETE /sandbox/:phone — Teardown sandbox by phone number
sandboxRouter.delete("/:phone", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { phone: req.params.phone } });
  if (!user) {
    return res.status(404).json({ error: "No user found" });
  }
  const deleted = await teardownSandbox(user.id);
  if (!deleted) {
    return res.status(404).json({ error: "No sandbox found" });
  }
  return res.json({ ok: true });
});
