import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
} from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
  chmodSync,
} from "node:fs";
import path from "node:path";

const KEYS_DIR = "./data/device-keys";
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export type DeviceKey = {
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
};

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function derivePublicKeyRaw(publicKeyPem: string): Buffer {
  const key = createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }
  return spki;
}

function fingerprintPublicKey(publicKeyPem: string): string {
  const raw = derivePublicKeyRaw(publicKeyPem);
  return createHash("sha256").update(raw).digest("hex");
}

export function publicKeyRawBase64Url(publicKeyPem: string): string {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}

function validateDeviceKey(data: DeviceKey): boolean {
  try {
    const key = createPrivateKey({ key: data.privateKeyPem, format: "pem" });
    const testSig = cryptoSign(null, Buffer.from("test", "utf-8"), key);
    return testSig.length > 0;
  } catch {
    return false;
  }
}

export function getOrCreateDeviceKey(sandboxId: string): DeviceKey {
  const keyPath = path.join(KEYS_DIR, `${sandboxId}.json`);

  if (existsSync(keyPath)) {
    try {
      const raw = readFileSync(keyPath, "utf-8");
      const data = JSON.parse(raw) as DeviceKey;
      if (data.publicKeyPem && data.privateKeyPem) {
        const derivedId = fingerprintPublicKey(data.publicKeyPem);
        if (validateDeviceKey({ ...data, deviceId: derivedId })) {
          if (data.deviceId !== derivedId) {
            const updated = { ...data, deviceId: derivedId };
            try {
              writeFileSync(keyPath, JSON.stringify(updated, null, 2), { mode: 0o600 });
            } catch { /* best-effort */ }
          }
          return { deviceId: derivedId, publicKeyPem: data.publicKeyPem, privateKeyPem: data.privateKeyPem };
        }
      }
    } catch { /* corrupted, regenerate */ }
    try { unlinkSync(keyPath); } catch { /* best-effort */ }
  }

  console.log(`[deviceAttestation] Generating new Ed25519 keypair for sandbox ${sandboxId}...`);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = (publicKey.export({ type: "spki", format: "pem" }) as string | Buffer).toString();
  const privateKeyPem = (privateKey.export({ type: "pkcs8", format: "pem" }) as string | Buffer).toString();
  const deviceId = fingerprintPublicKey(publicKeyPem);

  const deviceKey: DeviceKey = { deviceId, publicKeyPem, privateKeyPem };

  try {
    mkdirSync(KEYS_DIR, { recursive: true });
    writeFileSync(keyPath, JSON.stringify(deviceKey, null, 2), { mode: 0o600 });
    try { chmodSync(keyPath, 0o600); } catch { /* best-effort */ }
    console.log(`[deviceAttestation] Device key persisted: ${keyPath}`);
  } catch (e) {
    console.warn("[deviceAttestation] Could not persist device key:", e);
  }

  return deviceKey;
}

export type SignChallengeParams = {
  nonce: string;
  privateKeyPem: string;
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  token?: string | null;
};

export function signChallenge(params: SignChallengeParams): { signature: string; signedAt: number } {
  const signedAt = Date.now();
  const compoundPayload = [
    "v2",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(","),
    String(signedAt),
    params.token ?? "",
    params.nonce,
  ].join("|");

  const key = createPrivateKey({ key: params.privateKeyPem, format: "pem" });
  const sig = cryptoSign(null, Buffer.from(compoundPayload, "utf-8"), key);

  return { signature: base64UrlEncode(sig as Buffer), signedAt };
}
