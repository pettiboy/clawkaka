import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  openclawGatewayToken: required("OPENCLAW_GATEWAY_TOKEN"),
  openrouterProvisioningKey: required("OPENROUTER_PROVISIONING_KEY"),
  openclawSandboxImage: optional("OPENCLAW_SANDBOX_IMAGE", "clawkaka-sandbox"),
  portRangeStart: parseInt(optional("PORT_RANGE_START", "30000"), 10),
  portRangeEnd: parseInt(optional("PORT_RANGE_END", "35000"), 10),
  port: parseInt(optional("PORT", "3000"), 10),
  whatsappVerifyToken: optional("WHATSAPP_VERIFICATION_TOKEN", ""),
  whatsappAccessToken: optional("WHATSAPP_ACCESS_TOKEN", ""),
  whatsappPhoneNumberId: optional("WHATSAPP_SENDER_PHONE_NUMBER_ID", ""),
  whatsappApiBaseUrl: optional("WHATSAPP_API_BASE_URL", "https://graph.facebook.com"),
};
