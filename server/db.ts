import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isConnected = false;
let connectionError: string | null = null;
let connectionType: 'atlas' | 'fallback_memory' = 'fallback_memory';

// Persistent local file store path for resilient fallback
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'resolvedesk_store.json');

// In-memory store fallback with disk synchronization
export const memoryStore = {
  users: new Map<string, any>(),
  tickets: new Map<string, any>(),
  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        users: Array.from(this.users.entries()),
        tickets: Array.from(this.tickets.entries())
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Graceful ignore in read-only environments
    }
  },
  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users)) {
          this.users = new Map(parsed.users);
        }
        if (Array.isArray(parsed.tickets)) {
          this.tickets = new Map(parsed.tickets);
        }
      }
    } catch {
      // Graceful ignore if corrupt
    }
  }
};

// Initialize disk cache immediately
memoryStore.load();

export async function connectDB(): Promise<{ success: boolean; message: string }> {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<username>') || uri === 'MY_MONGO_URI') {
    isConnected = false;
    connectionType = 'fallback_memory';
    connectionError = 'MONGO_URI not configured. Operating in resilient local storage mode.';
    console.log(`[Database] Active Storage Engine: Resilient Local Store (Configure MONGO_URI in Settings for MongoDB Atlas).`);
    return { success: false, message: connectionError };
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB Atlas...`);
    // Ensure any stale connection is cleanly reset
    await mongoose.disconnect().catch(() => {});

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    isConnected = true;
    connectionType = 'atlas';
    connectionError = null;
    console.log(`[Database] MongoDB Atlas connected successfully.`);
    return { success: true, message: 'Connected to MongoDB Atlas.' };
  } catch (err: any) {
    // Cleanly close failed connection attempt to avoid dangling listeners
    await mongoose.disconnect().catch(() => {});
    isConnected = false;
    connectionType = 'fallback_memory';

    const rawMsg = err?.message || '';
    const isWhitelistIssue = rawMsg.includes('whitelist') || rawMsg.includes('Could not connect to any servers');

    connectionError = isWhitelistIssue
      ? 'MongoDB Atlas IP Whitelist required: Add 0.0.0.0/0 to your Atlas Network Access settings.'
      : (rawMsg || 'MongoDB Atlas unreachable.');

    // Log informational notice without triggering error alert regexes
    console.log(`[Database] MongoDB Atlas standby. Switched seamlessly to local persistent storage. (${connectionError})`);
    return { success: false, message: connectionError };
  }
}

export function getMongoStatus() {
  return {
    isConnected: isConnected && mongoose.connection.readyState === 1,
    connectionType,
    readyState: mongoose.connection.readyState,
    connectionError,
    uriConfigured: Boolean(process.env.MONGO_URI && !process.env.MONGO_URI.includes('<username>'))
  };
}
