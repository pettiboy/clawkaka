import fs from "fs/promises";
import path from "path";
import { CallLog, TranscriptionSegment } from "../types/call.js";

// In-memory storage for call data
const callStore = new Map<string, CallLog>();

// Directory to store call logs
const CALL_LOGS_DIR = path.join(process.cwd(), "call-logs");

// Ensure call logs directory exists
async function ensureCallLogsDir() {
  try {
    await fs.mkdir(CALL_LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating call logs directory:", error);
  }
}

// Initialize a new call
export async function initializeCall(
  callSid: string,
  from: string,
  to: string,
  direction: string,
  status: string
): Promise<void> {
  const callLog: CallLog = {
    callSid,
    from,
    to,
    direction,
    status,
    startTime: new Date().toISOString(),
    transcriptions: [],
    fullTranscript: "",
  };

  callStore.set(callSid, callLog);
  console.log(`[CallStorage] Initialized call ${callSid} from ${from}`);
}

// Add transcription segment to a call
export async function addTranscription(
  callSid: string,
  transcription: TranscriptionSegment
): Promise<void> {
  const callLog = callStore.get(callSid);

  if (!callLog) {
    console.warn(`[CallStorage] Call ${callSid} not found for transcription`);
    return;
  }

  callLog.transcriptions.push(transcription);

  // Update full transcript
  callLog.fullTranscript = callLog.transcriptions
    .map((t) => `[${t.track === "inbound_track" ? "Caller" : "System"}]: ${t.text}`)
    .join("\n");

  callStore.set(callSid, callLog);

  console.log(
    `[CallStorage] Added transcription to call ${callSid}: "${transcription.text}"`
  );
}

// End a call and save to file
export async function endCall(
  callSid: string,
  status: string,
  duration?: number
): Promise<void> {
  const callLog = callStore.get(callSid);

  if (!callLog) {
    console.warn(`[CallStorage] Call ${callSid} not found to end`);
    return;
  }

  callLog.endTime = new Date().toISOString();
  callLog.status = status;
  callLog.duration = duration;

  // Save to file
  await ensureCallLogsDir();
  const filename = `${callSid}_${Date.now()}.json`;
  const filepath = path.join(CALL_LOGS_DIR, filename);

  try {
    await fs.writeFile(filepath, JSON.stringify(callLog, null, 2), "utf-8");
    console.log(`[CallStorage] Saved call log to ${filepath}`);
  } catch (error) {
    console.error(`[CallStorage] Error saving call log:`, error);
  }

  // Keep in memory for a while in case late transcriptions arrive
  setTimeout(() => {
    callStore.delete(callSid);
    console.log(`[CallStorage] Removed call ${callSid} from memory`);
  }, 60000); // 1 minute
}

// Get call data
export function getCall(callSid: string): CallLog | undefined {
  return callStore.get(callSid);
}

// Get all active calls
export function getAllCalls(): CallLog[] {
  return Array.from(callStore.values());
}

// Get recent call logs from files
export async function getRecentCallLogs(limit: number = 10): Promise<CallLog[]> {
  await ensureCallLogsDir();

  try {
    const files = await fs.readdir(CALL_LOGS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    // Sort by filename (which includes timestamp)
    jsonFiles.sort().reverse();

    const logs: CallLog[] = [];

    for (const file of jsonFiles.slice(0, limit)) {
      try {
        const filepath = path.join(CALL_LOGS_DIR, file);
        const content = await fs.readFile(filepath, "utf-8");
        logs.push(JSON.parse(content));
      } catch (error) {
        console.error(`Error reading call log ${file}:`, error);
      }
    }

    return logs;
  } catch (error) {
    console.error("Error getting recent call logs:", error);
    return [];
  }
}
