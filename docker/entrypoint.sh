#!/bin/sh
set -e

# Step 1: Configure OpenRouter if API key is provided
if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "[entrypoint] Configuring OpenRouter provider..."
  openclaw onboard --auth-choice openrouter-api-key \
    --openrouter-api-key "$OPENROUTER_API_KEY" \
    --non-interactive --accept-risk --skip-channels --skip-skills --skip-health || true
fi

# Step 2: Patch gateway settings and model (after onboard, which may reset config)
jq --arg t "$OPENCLAW_GATEWAY_TOKEN" \
  '.gateway.auth.token = $t | .gateway.bind = "lan" | .gateway.controlUi.dangerouslyDisableDeviceAuth = true' \
  /root/.openclaw/openclaw.json > /tmp/oc.json && mv /tmp/oc.json /root/.openclaw/openclaw.json

# Step 3: Merge heartbeat overlay into openclaw.json
if [ -f /tmp/openclaw-overlay.json ]; then
  echo "[entrypoint] Merging heartbeat overlay config..."
  jq -s '.[0] * .[1]' /root/.openclaw/openclaw.json /tmp/openclaw-overlay.json > /tmp/oc-merged.json \
    && mv /tmp/oc-merged.json /root/.openclaw/openclaw.json
fi

# Step 4: Pre-seed device as approved if CLAWKAKA_DEVICE_ID and CLAWKAKA_DEVICE_PUBKEY are set
if [ -n "$CLAWKAKA_DEVICE_ID" ] && [ -n "$CLAWKAKA_DEVICE_PUBKEY" ]; then
  mkdir -p /root/.openclaw/devices
  node -e "
    const fs = require('fs');
    const pairedPath = '/root/.openclaw/devices/paired.json';
    let paired = {};
    try { paired = JSON.parse(fs.readFileSync(pairedPath, 'utf8')); } catch {}
    const deviceId = process.env.CLAWKAKA_DEVICE_ID;
    const publicKey = process.env.CLAWKAKA_DEVICE_PUBKEY;
    paired[deviceId] = {
      requestId: deviceId,
      deviceId: deviceId,
      publicKey: publicKey,
      platform: 'linux',
      clientId: 'cli',
      clientMode: 'cli',
      role: 'operator',
      roles: ['operator'],
      scopes: ['operator.read', 'operator.write'],
      remoteIp: '0.0.0.0',
      silent: false,
      isRepair: false,
      ts: Date.now()
    };
    fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
    console.log('[entrypoint] Pre-approved device:', deviceId);
  "
fi

echo "[entrypoint] Starting gateway..."
export NODE_OPTIONS="--max-old-space-size=1536"
exec openclaw gateway
