import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001"),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    apiKeySid: process.env.TWILIO_API_KEY_SID!,
    apiKeySecret: process.env.TWILIO_API_KEY_SECRET!,
  },
  baseUrl: process.env.BASE_URL || "http://localhost:3001",
  greetingName: process.env.GREETING_NAME || "there",
};

// Validate required environment variables
const requiredVars = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
