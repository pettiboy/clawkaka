import { config } from "../config.js";

interface ProvisionKeyOptions {
  name: string;
  limit: number;
  limitReset?: "daily" | "monthly";
}

interface CreateKeyResponse {
  key: string;
  data: { hash: string };
}

const OPENROUTER_API = "https://openrouter.ai/api/v1";

export async function provisionOpenRouterKey(
  options: ProvisionKeyOptions,
): Promise<CreateKeyResponse> {
  const res = await fetch(`${OPENROUTER_API}/keys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openrouterProvisioningKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: options.name,
      limit: options.limit,
      limitReset: options.limitReset ?? "daily",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to provision OpenRouter key: ${res.status} ${body}`);
  }

  return res.json();
}

export async function deleteOpenRouterKey(keyHash: string): Promise<void> {
  const res = await fetch(`${OPENROUTER_API}/keys/${keyHash}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.openrouterProvisioningKey}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Failed to delete OpenRouter key: ${res.status} ${body}`);
  }
}
