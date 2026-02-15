# Twilio Webhook URLs — Copy These

**Base URL:** `https://5cf6-14-143-179-90.ngrok-free.app`

---

## 1. A CALL COMES IN (required)

**URL:**
```
https://5cf6-14-143-179-90.ngrok-free.app/voice/webhook/voice
```

**HTTP Method:** POST

---

## 2. Call status changes (optional but recommended)

**URL:**
```
https://5cf6-14-143-179-90.ngrok-free.app/voice/webhook/call-status
```

**HTTP Method:** POST

---

## Where to add them

1. Open: **https://console.twilio.com/us1/develop/phone-numbers/manage/incoming**
2. Click your number: **+1 (830) 465-3031**
3. Under **"A CALL COMES IN"** → Webhook → paste the first URL above → POST
4. Under **"Call status changes"** → Webhook → paste the second URL above → POST
5. Click **Save configuration**

---

**Note:** If you restart ngrok, the URL will change. Update this file and Twilio console with the new URL.
