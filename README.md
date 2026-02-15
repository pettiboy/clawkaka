# Clawkaka

Your PA on WhatsApp. Not a chatbot — a personal assistant that remembers, reminds, and acts.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Node.js 22+
- A WhatsApp Business API account (Meta developer portal)
- An [OpenRouter](https://openrouter.ai/) API key

## Local Setup

### 1. Start Postgres

```bash
cd infra
docker compose up postgres -d
```

Wait a few seconds for it to be healthy. Postgres will be on `localhost:5468`.

### 2. Build the sandbox image

```bash
docker build -t clawkaka-sandbox -f docker/Dockerfile.sandbox docker/
```

This builds the OpenClaw container that runs one PA per user.

### 3. Set up the backend

```bash
cd backend
npm install
```

### 4. Configure environment

Copy and edit the `.env` file:

```bash
cp backend/.env.example backend/.env
```

Or just edit `backend/.env` directly. You need to set:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Already set to `postgresql://clawkaka:clawkaka@localhost:5468/clawkaka` |
| `OPENCLAW_GATEWAY_TOKEN` | Any string — used to auth with sandbox containers |
| `OPENROUTER_PROVISIONING_KEY` | Your OpenRouter provisioning API key |
| `WHATSAPP_VERIFICATION_TOKEN` | Any string — you set the same one in Meta dashboard |
| `WHATSAPP_ACCESS_TOKEN` | From Meta WhatsApp Business API |
| `WHATSAPP_SENDER_PHONE_NUMBER_ID` | Your WhatsApp phone number ID from Meta |

### 5. Create the database tables

```bash
cd backend
npm run db:push
```

This pushes the Prisma schema to Postgres. For migration-based workflow use `npm run db:migrate` instead.

### 6. Start the backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3001`.

### 7. Expose to the internet (for WhatsApp webhooks)

You need a public URL for Meta to send webhooks to. Options:

- **ngrok**: `ngrok http 3001` then use the URL in Meta dashboard
- **Caddy (production)**: edit `infra/Caddyfile` with your domain, then `cd infra && docker compose up caddy -d`

Set the webhook URL in Meta dashboard to: `https://your-domain.com/whatsapp/webhook`

## Useful Commands

```bash
# Reset everything (containers, DB, volumes)
./infra/nuke.sh

# Regenerate Prisma client after schema changes
npm run db:generate

# Reset DB (drops all data, re-creates tables)
npm run db:reset

# Push schema changes without migrations
npm run db:push

# Run e2e tests
npm run test:e2e
```

## Project Structure

```
clawkaka/
  backend/          Express server — WhatsApp webhook, sandbox management, OpenClaw bridge
  docker/           Sandbox container — Dockerfile, SOUL.md, workspace files, seed schema
  infra/            Docker Compose (Postgres, Caddy), Caddyfile, nuke script
```

## How It Works

1. User sends a WhatsApp message
2. Meta webhook hits `backend/`
3. Backend provisions a Docker sandbox (OpenClaw container) for that user if one doesn't exist
4. Message is forwarded to the OpenClaw agent inside the sandbox via WebSocket
5. Agent processes the message, logs data to its SQLite DB, and responds
6. Backend sends the response back to WhatsApp via Meta API
7. Agent's heartbeat checks in every 30 min and proactively messages the user if needed
