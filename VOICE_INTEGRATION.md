# Voice Integration Testing Guide

## Overview

The voice integration is now complete! Users can call your Twilio number and have a conversation with their personal assistant (OpenClaw). After the call, OpenClaw can optionally send a summary via WhatsApp.

## Architecture

```
Caller → Twilio → Backend → OpenClaw → Backend → Twilio → Caller
                                ↓
                            WhatsApp (after call ends)
```

- **Stateless Backend**: Backend is a proxy between Twilio and OpenClaw
- **OpenClaw Memory**: All conversation history lives in OpenClaw's memory
- **Intelligent Follow-up**: OpenClaw decides what (if anything) to send via WhatsApp

## Setup Instructions

### 1. Add Twilio Configuration to `.env`

Copy the Twilio credentials from `twilio-backend/.env` or create new ones:

```bash
cd backend
cp .env.example .env
# Then edit .env and add:
```

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=
BASE_URL=http://localhost:3000  # Will update with ngrok URL
```

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
[Clawkaka] Server listening on port 3000
[Clawkaka] Voice webhook: http://localhost:3000/voice/webhook/voice
[Clawkaka] WhatsApp webhook: http://localhost:3000/whatsapp/webhook
```

### 3. Start ngrok

In a separate terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 4. Update BASE_URL in `.env`

```env
BASE_URL=https://abc123.ngrok-free.app
```

Restart the backend server.

### 5. Configure Twilio Console

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your phone number: **+1 (830) 465-3031**
3. Under **"A CALL COMES IN"**:
   - URL: `https://abc123.ngrok-free.app/voice/webhook/voice`
   - Method: **HTTP POST**
4. Under **"Call Status Changes"** (optional):
   - URL: `https://abc123.ngrok-free.app/voice/webhook/call-status`
   - Method: **HTTP POST**
5. Click **Save**

## Testing the Integration

### Test 1: Basic Voice Call

1. **Call the Twilio number**: +1 (830) 465-3031
2. **Expected behavior**:
   - You hear: "Hi! I'm your personal assistant. What can I help you with?"
   - You speak (e.g., "What's the weather today?")
   - After ~2 seconds, you hear OpenClaw's response
   - The system continues listening for your next input
   - Repeat until you hang up

3. **Check backend logs**:
```
=== Incoming Voice Call ===
From: +1234567890
To: +18304653031
CallSid: CA...
==========================

[Voice] Incoming call from +1234567890
[Voice] User: user_xyz
[Voice] Sandbox ready, returning initial TwiML

=== Recording Transcription ===
TranscriptionText: "What's the weather today?"
==============================

[Voice] Transcription: "What's the weather today?"
[Voice] Sending to OpenClaw sandbox...
[Voice] OpenClaw response: "I don't have access to weather..."
```

### Test 2: New User Provisioning

1. **Call from a new phone number** (not registered before)
2. **Expected behavior**:
   - First call: "Setting up your account, please wait a moment..."
   - System provisions OpenClaw sandbox (takes ~30-60s)
   - Then: "Hi! I'm your personal assistant..."
   - Continue conversation normally

### Test 3: Action Items & WhatsApp Follow-up

1. **Call and log something actionable**:
   - "Log 2 rotis and dal for lunch"
   - "Remind me to call John at 3pm"
   - "Spent 500 rupees on Uber"

2. **Expected behavior during call**:
   - OpenClaw confirms: "Got it, logged 2 rotis and dal. That's about 450 calories."

3. **After hanging up**:
   - **Check backend logs**:
   ```
   === Call Status Update ===
   CallStatus: completed
   CallDuration: 85
   =========================
   
   [Voice] Notifying OpenClaw that call ended. Duration: 85s
   [Voice] Call-ended notification sent to OpenClaw
   ```

4. **Check WhatsApp** (within ~30 seconds):
   - You should receive: "✓ Logged 450 cal lunch (dal, roti). Daily total: 850 cal."
   - This comes from OpenClaw's heartbeat/outbound system

### Test 4: Informational Query (No WhatsApp Follow-up)

1. **Call and ask a question**:
   - "What's 25 times 4?"
   - "Tell me a joke"

2. **Expected behavior**:
   - OpenClaw answers during the call
   - **No WhatsApp message** after call ends (OpenClaw decides it's not needed)

## Troubleshooting

### Issue: "User not found" or "Sandbox not ready"

**Cause**: Race condition - transcription webhook arrives before initial call setup completes.

**Fix**: This should be rare. If it happens, call again.

### Issue: No response after speaking

**Possible causes**:
1. **Empty transcription**: Twilio didn't transcribe anything
   - Speak more clearly
   - Check Twilio logs: https://console.twilio.com/

2. **OpenClaw timeout**: Took >30s to respond
   - Check OpenClaw sandbox health
   - Check backend logs for errors

### Issue: No WhatsApp follow-up after call

**This is expected behavior!** OpenClaw only sends a WhatsApp message if:
- Action items were created (tasks, reminders, expenses, meals)
- Confirmation would be helpful

For purely informational calls, OpenClaw intentionally doesn't send anything.

**To test follow-up**, make sure to:
- Log something (meal, expense, task)
- Ask OpenClaw to set a reminder
- Wait 30-60 seconds after hanging up (heartbeat cycle)

### Issue: OpenClaw doesn't remember the call

**Check**: OpenClaw's memory files in the sandbox container:
```bash
docker exec <container_id> cat /root/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
```

You should see entries like:
```
[Voice Call] User said: "Log 2 rotis for lunch"
[Voice Call] Logged meal: 2 rotis, dal (450 cal)
```

## API Endpoints

### Voice Webhooks (for Twilio)

- `POST /voice/webhook/voice` - Incoming call
- `POST /voice/webhook/transcription` - Recording transcribed
- `POST /voice/webhook/call-status` - Call status changes

### Health Check

- `GET /voice/health` - Voice service health

## Flow Diagram

```
┌─────────┐
│  Caller │
└────┬────┘
     │ Dials Twilio number
     ▼
┌─────────────┐
│   Twilio    │
└─────┬───────┘
      │ POST /voice/webhook/voice
      ▼
┌──────────────┐
│   Backend    │──────────┐
└──────┬───────┘          │ Lookup/create user
       │                  │ Provision sandbox if needed
       │◄─────────────────┘
       │ Return TwiML (greeting + record)
       ▼
┌─────────────┐
│   Twilio    │
└─────┬───────┘
      │ Play greeting, start recording
      ▼
┌─────────┐
│  Caller │ Speaks: "Log lunch"
└────┬────┘
     │
     ▼
┌─────────────┐
│   Twilio    │ Transcribes speech
└─────┬───────┘
      │ POST /voice/webhook/transcription
      ▼
┌──────────────┐
│   Backend    │────────┐
└──────┬───────┘        │ Send to OpenClaw WS
       │                │ Wait for response
       │◄───────────────┘
       │ Return TwiML (<Say> + <Record>)
       ▼
┌─────────────┐
│   Twilio    │ Speaks: "Got it, logged..."
└─────┬───────┘
      │
      ▼
┌─────────┐
│  Caller │ (conversation continues...)
└────┬────┘
     │ Hangs up
     ▼
┌─────────────┐
│   Twilio    │
└─────┬───────┘
      │ POST /voice/webhook/call-status (completed)
      ▼
┌──────────────┐
│   Backend    │────────┐
└──────────────┘        │ Send system message to OpenClaw
                        │ "[SYSTEM] Call completed, duration: 1m 25s"
                        ▼
                  ┌──────────┐
                  │ OpenClaw │ Decides: "User logged a meal, send confirmation"
                  └─────┬────┘
                        │ Outbound message
                        ▼
                  ┌──────────────┐
                  │   Backend    │ (outbound handler)
                  └──────┬───────┘
                         │ Meta API
                         ▼
                   ┌──────────┐
                   │ WhatsApp │ "✓ Logged 450 cal lunch"
                   └─────┬────┘
                         ▼
                   ┌─────────┐
                   │  Caller │
                   └─────────┘
```

## Success Criteria Checklist

- ✅ User can call Twilio number
- ✅ System identifies user by phone number
- ✅ User speaks, transcription sent to OpenClaw
- ✅ OpenClaw responds intelligently based on SOUL.md & memory
- ✅ Response played back as speech to caller
- ✅ Conversation continues until user hangs up
- ✅ Backend is stateless (no conversation storage)
- ✅ OpenClaw maintains conversation memory
- ✅ When call ends, OpenClaw receives notification
- ✅ OpenClaw decides whether to send WhatsApp follow-up
- ✅ Follow-up is intelligent and action-oriented
- ✅ Cross-channel continuity (voice + WhatsApp share same sandbox)

## Next Steps

### Recommended SOUL.md Updates

Add to OpenClaw's SOUL.md in each sandbox:

```markdown
### Voice Communication
- Keep responses under 3 sentences when speaking
- Speak naturally, avoid reading lists aloud
- Confirm actions verbally: "Got it, I've logged that"
- For complex info (expense summaries), offer to send via WhatsApp

### After Voice Calls
- When you receive [SYSTEM] message about call completion, review the conversation
- Send a WhatsApp follow-up ONLY if action items were created or confirmation is helpful
- Keep follow-ups under 2-3 sentences
- Format: "✓ [Action taken]. [Clarification if needed]."
- Examples:
  - "✓ Logged 450 cal lunch. Daily total: 850 cal."
  - "✓ Reminder set for 3pm sprint review."
  - "✓ ₹280 Uber logged (Transport)."
- Do NOT send follow-up if call was purely informational or question-answering
```

### Optional Enhancements

1. **Multi-language support**: Detect language from transcription, use appropriate Polly voice
2. **Call analytics**: Track call duration, response times, user satisfaction
3. **DTMF navigation**: Allow users to press digits for menu options
4. **Outbound calls**: Let OpenClaw initiate calls for reminders

## Debugging Commands

```bash
# Watch backend logs
cd backend && npm run dev

# Watch ngrok logs
ngrok http 3000 --log=stdout

# Check Twilio call logs
open https://console.twilio.com/us1/monitor/logs/calls

# List active sandboxes
curl http://localhost:3000/sandbox/list

# Check OpenClaw sandbox logs
docker logs <container_id> --tail 50 --follow
```

## Done! 🎉

The voice integration is complete and ready for testing. Call the Twilio number and start talking to your personal assistant!
