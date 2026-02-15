import { PrismaClient } from "@prisma/client";
import net from "net";
import { config } from "../config.js";

const prisma = new PrismaClient();

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

export async function allocatePort(): Promise<number> {
  const usedPorts = await prisma.sandbox.findMany({
    select: { port: true },
  });
  const usedSet = new Set(usedPorts.map((s) => s.port));

  for (let port = config.portRangeStart; port <= config.portRangeEnd; port++) {
    if (usedSet.has(port)) continue;
    const available = await isPortAvailable(port);
    if (!available) continue;
    return port;
  }

  throw new Error("No available ports in range");
}
