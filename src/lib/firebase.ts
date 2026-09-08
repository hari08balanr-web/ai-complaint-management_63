import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { AppUser, Ticket, TicketMessage, EscalationLogEntry, UserRole, TicketStatus, TicketPriority } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
let firestoreDb: Firestore;
try {
  if (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)') {
    firestoreDb = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(app);
  }
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// ==========================================
// Standardized Firestore Error Handler
// ==========================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test required by Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network disconnected.');
    }
    return false;
  }
}

// Run connection check
testFirestoreConnection().catch(() => {});

// ==========================================
// Authentication & User Profile Management
// ==========================================

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as AppUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function syncUserProfile(firebaseUser: User, desiredRole?: UserRole): Promise<AppUser> {
  const path = `users/${firebaseUser.uid}`;
  try {
    const existing = await getUserProfile(firebaseUser.uid);
    if (existing) {
      // If user is bootstrap admin email, ensure admin role
      if (firebaseUser.email === 'hari08balanr@gmail.com' && existing.role !== 'admin') {
        const updated: AppUser = { ...existing, role: 'admin' };
        await setDoc(doc(db, 'users', firebaseUser.uid), updated, { merge: true });
        return updated;
      }
      return existing;
    }

    // Determine initial role
    let role: UserRole = desiredRole || 'user';
    if (firebaseUser.email === 'hari08balanr@gmail.com') {
      role = 'admin';
    }

    const newUser: AppUser = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Support User',
      email: firebaseUser.email || 'user@internal.io',
      role,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(res.user);
    return res.user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(res.user);
  return res.user;
}

export async function signupWithEmail(email: string, pass: string, name: string, role: UserRole = 'user'): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  const user = res.user;
  const path = `users/${user.uid}`;
  const newUser: AppUser = {
    uid: user.uid,
    name: name || email.split('@')[0],
    email,
    role: email === 'hari08balanr@gmail.com' ? 'admin' : role,
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'users', user.uid), newUser);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
  return user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ==========================================
// Ticket Management & Real-time Listeners
// ==========================================

export function subscribeToTickets(
  user: AppUser | null,
  callback: (tickets: Ticket[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!user) {
    callback([]);
    return () => {};
  }

  const path = 'tickets';
  try {
    let q;
    if (user.role === 'admin' || user.role === 'agent') {
      // Agents and Admins see all tickets
      q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    } else {
      // End users see only their own tickets
      q = query(
        collection(db, 'tickets'), 
        where('userId', '==', user.uid), 
        orderBy('createdAt', 'desc')
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const tickets: Ticket[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Ticket, 'id'>)
        }));
        callback(tickets);
      },
      (error) => {
        console.error('Snapshot tickets error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToTicket(
  ticketId: string,
  callback: (ticket: Ticket | null) => void
): Unsubscribe {
  const path = `tickets/${ticketId}`;
  return onSnapshot(
    doc(db, 'tickets', ticketId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...(docSnap.data() as Omit<Ticket, 'id'>) });
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToTicketMessages(
  ticketId: string,
  callback: (messages: TicketMessage[]) => void
): Unsubscribe {
  const path = `tickets/${ticketId}/messages`;
  const q = query(collection(db, 'tickets', ticketId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: TicketMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TicketMessage, 'id'>)
      }));
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToEscalationLogs(
  ticketId: string,
  callback: (logs: EscalationLogEntry[]) => void
): Unsubscribe {
  const path = `tickets/${ticketId}/escalationLog`;
  const q = query(collection(db, 'tickets', ticketId, 'escalationLog'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: EscalationLogEntry[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EscalationLogEntry, 'id'>)
      }));
      callback(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToAllUsers(callback: (users: AppUser[]) => void): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const users: AppUser[] = snap.docs.map((d) => d.data() as AppUser);
      callback(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Write Operations

export async function createTicketWithAiFirstResponse(params: {
  userId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  slaHours: number;
  aiSuggestedResponse: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}): Promise<string> {
  const now = Date.now();
  const slaDeadline = now + params.slaHours * 60 * 60 * 1000;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const formattedTicketId = `TSC-${new Date().getFullYear()}-${randomSuffix}`;
  
  const ticketDocRef = doc(collection(db, 'tickets'));
  const ticketId = ticketDocRef.id;
  const path = `tickets/${ticketId}`;

  const ticketData: Omit<Ticket, 'id'> = {
    ticketId: formattedTicketId,
    userId: params.userId,
    requesterName: params.requesterName,
    requesterEmail: params.requesterEmail,
    title: params.title,
    description: params.description,
    category: params.category,
    priority: params.priority,
    status: 'Open',
    assignedAgentId: null,
    assignedAgentName: null,
    slaDeadline,
    escalationLevel: 0,
    attachmentUrl: params.attachmentUrl || null,
    attachmentName: params.attachmentName || null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // 1. Create ticket doc
    await setDoc(ticketDocRef, ticketData);

    // 2. Add AI Assistant's first response instantly to messages subcollection
    const msgRef = doc(collection(db, 'tickets', ticketId, 'messages'));
    const firstAiMessage: Omit<TicketMessage, 'id'> = {
      senderId: 'ai-assistant',
      senderName: 'ResolveDesk AI Assistant',
      senderType: 'AI',
      content: params.aiSuggestedResponse,
      timestamp: now + 500,
    };
    await setDoc(msgRef, firstAiMessage);

    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addTicketMessage(
  ticketId: string, 
  senderId: string, 
  senderName: string, 
  senderType: 'user' | 'agent' | 'AI', 
  content: string
): Promise<void> {
  const path = `tickets/${ticketId}/messages`;
  try {
    const msgRef = doc(collection(db, 'tickets', ticketId, 'messages'));
    const messageData: Omit<TicketMessage, 'id'> = {
      senderId,
      senderName,
      senderType,
      content,
      timestamp: Date.now(),
    };
    await setDoc(msgRef, messageData);
    await updateDoc(doc(db, 'tickets', ticketId), { updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): Promise<void> {
  const path = `tickets/${ticketId}`;
  try {
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: newStatus,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function assignTicketAgent(
  ticketId: string,
  agentId: string,
  agentName: string
): Promise<void> {
  const path = `tickets/${ticketId}`;
  try {
    await updateDoc(doc(db, 'tickets', ticketId), {
      assignedAgentId: agentId,
      assignedAgentName: agentName,
      status: 'In Progress',
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function escalateTicket(
  ticketId: string,
  currentLevel: number,
  reason: string,
  triggeredBy: string
): Promise<void> {
  const path = `tickets/${ticketId}`;
  try {
    const nextLevel = Math.min(3, currentLevel + 1);
    const now = Date.now();

    // 1. Update ticket doc
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: 'Escalated',
      escalationLevel: nextLevel,
      updatedAt: now,
    });

    // 2. Add log in escalationLog subcollection
    const logRef = doc(collection(db, 'tickets', ticketId, 'escalationLog'));
    const logData: Omit<EscalationLogEntry, 'id'> = {
      fromLevel: currentLevel,
      toLevel: nextLevel,
      reason,
      triggeredBy,
      timestamp: now,
    };
    await setDoc(logRef, logData);

    // 3. Add system notification message in thread
    const msgRef = doc(collection(db, 'tickets', ticketId, 'messages'));
    await setDoc(msgRef, {
      senderId: 'system',
      senderName: 'System Escalation Engine',
      senderType: 'AI',
      content: `⚠️ **Ticket Escalated to Tier ${nextLevel}**\n**Reason:** ${reason}\n**Triggered by:** ${triggeredBy}`,
      timestamp: now + 200,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
