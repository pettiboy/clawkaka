#!/bin/sh
set -e

# Step 1: Configure OpenRouter if API key is provided
if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "[entrypoint] Configuring OpenRouter provider..."
  openclaw onboard --auth-choice openrouter-api-key \
    --openrouter-api-key "$OPENROUTER_API_KEY" \
    --non-interactive --accept-risk --skip-channels --skip-skills --skip-health || true
fi

# Step 2: Patch gateway settings (after onboard, which may reset config)
jq --arg t "$OPENCLAW_GATEWAY_TOKEN" \
  '.gateway.auth.token = $t | .gateway.bind = "lan" | .gateway.controlUi.dangerouslyDisableDeviceAuth = true' \
  /root/.openclaw/openclaw.json > /tmp/oc.json && mv /tmp/oc.json /root/.openclaw/openclaw.json

# Step 3: Merge heartbeat overlay into openclaw.json
if [ -f /tmp/openclaw-overlay.json ]; then
  echo "[entrypoint] Merging heartbeat overlay config..."
  jq -s '.[0] * .[1]' /root/.openclaw/openclaw.json /tmp/openclaw-overlay.json > /tmp/oc-merged.json \
    && mv /tmp/oc-merged.json /root/.openclaw/openclaw.json
fi

# Step 4: Pre-seed ALL devices into paired.json BEFORE starting the gateway.
#
# The gateway caches paired.json at startup. Any entry NOT in paired.json at
# gateway start time will be rejected with "pairing required" and there is no
# way to hot-reload devices without restarting the gateway.
#
# Two devices need pre-approval:
# 1. The local CLI (identity/device.json) — so the agent can run openclaw cron,
#    openclaw system event, etc. inside the container
# 2. The external backend device (CLAWKAKA_DEVICE_ID) — so our Express backend
#    can connect via WebSocket from the host
mkdir -p /root/.openclaw/devices
node -e "
  const fs = require('fs');
  const crypto = require('crypto');
  const pairedPath = '/root/.openclaw/devices/paired.json';
  let paired = {};
  try { paired = JSON.parse(fs.readFileSync(pairedPath, 'utf8')); } catch {}

  const ALL_SCOPES = [
    'operator.read', 'operator.write',
    'operator.admin', 'operator.approvals', 'operator.pairing'
  ];

  function addDevice(deviceId, publicKey, label) {
    if (!deviceId || !publicKey) return;
    paired[deviceId] = {
      requestId: deviceId,
      deviceId: deviceId,
      publicKey: publicKey,
      platform: 'linux',
      clientId: 'cli',
      clientMode: 'cli',
      role: 'operator',
      roles: ['operator'],
      scopes: ALL_SCOPES,
      remoteIp: '0.0.0.0',
      silent: false,
      isRepair: false,
      ts: Date.now()
    };
    console.log('[entrypoint] Pre-approved ' + label + ': ' + deviceId.slice(0, 16) + '...');
  }

  // 1. Local CLI device (from identity/device.json created during openclaw onboard)
  try {
    const identity = JSON.parse(fs.readFileSync('/root/.openclaw/identity/device.json', 'utf8'));
    if (identity.publicKeyPem) {
      const pubKey = crypto.createPublicKey(identity.publicKeyPem);
      const der = pubKey.export({ type: 'spki', format: 'der' });
      const raw = der.subarray(der.length - 32);
      const b64url = raw.toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+\$/g, '');
      const deviceId = crypto.createHash('sha256').update(raw).digest('hex');
      addDevice(deviceId, b64url, 'local CLI');
    }
  } catch (err) {
    console.warn('[entrypoint] WARNING: Could not read identity/device.json:', err.message);
  }

  // 2. External backend device (passed via env by our Express backend)
  if (process.env.CLAWKAKA_DEVICE_ID && process.env.CLAWKAKA_DEVICE_PUBKEY) {
    addDevice(process.env.CLAWKAKA_DEVICE_ID, process.env.CLAWKAKA_DEVICE_PUBKEY, 'backend');
  }

  fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
  // Ensure pending.json exists
  try { fs.readFileSync('/root/.openclaw/devices/pending.json', 'utf8'); } catch {
    fs.writeFileSync('/root/.openclaw/devices/pending.json', '{}');
  }
"

# Step 5: Start gateway — paired.json is ready, both devices pre-approved
echo "[entrypoint] Starting gateway..."
export NODE_OPTIONS="--max-old-space-size=1536"
exec openclaw gateway
