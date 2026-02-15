import Docker from "dockerode";
import { config } from "../config.js";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const OPENCLAW_INTERNAL_PORT = 18789;

export async function createContainer(
  sandboxId: string,
  hostPort: number,
  deviceInfo?: { deviceId: string; publicKey: string },
  openrouterApiKey?: string,
): Promise<string> {
  const env = [`OPENCLAW_GATEWAY_TOKEN=${config.openclawGatewayToken}`];
  if (openrouterApiKey) {
    env.push(`OPENROUTER_API_KEY=${openrouterApiKey}`);
  }
  if (deviceInfo) {
    env.push(`CLAWKAKA_DEVICE_ID=${deviceInfo.deviceId}`);
    env.push(`CLAWKAKA_DEVICE_PUBKEY=${deviceInfo.publicKey}`);
  }

  const container = await docker.createContainer({
    Image: config.openclawSandboxImage,
    name: `clawkaka-sandbox-${sandboxId}`,
    ExposedPorts: { [`${OPENCLAW_INTERNAL_PORT}/tcp`]: {} },
    HostConfig: {
      PortBindings: {
        [`${OPENCLAW_INTERNAL_PORT}/tcp`]: [
          { HostPort: String(hostPort) },
        ],
      },
      Memory: 2048 * 1024 * 1024, // 2GB
      NanoCpus: 1_000_000_000, // 1 CPU
    },
    Env: env,
  });

  await container.start();
  console.log(
    `[Docker] Started container ${container.id} for sandbox ${sandboxId} on port ${hostPort}`,
  );
  return container.id;
}

export async function removeContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    try {
      await container.stop({ t: 5 });
    } catch (err: any) {
      if (err.statusCode !== 304) throw err;
    }
    await container.remove({ force: true });
    console.log(`[Docker] Removed container ${containerId}`);
  } catch (err: any) {
    if (err.statusCode === 404) return;
    throw err;
  }
}

export async function getContainerStatus(
  containerId: string,
): Promise<"running" | "stopped" | "unknown"> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Running ? "running" : "stopped";
  } catch {
    return "unknown";
  }
}
