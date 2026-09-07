import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ServiceTicket, TicketMessage, TicketStatus, EscalationInfo } from '../types';
import { INITIAL_TICKETS } from '../data/sampleTickets';

const LOCAL_STORAGE_KEY = 'ai_support_tickets_v1';

// In-memory / local fallback helpers
function getLocalTickets(): ServiceTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read local tickets:', e);
  }
  // Initialize with samples
  saveLocalTickets(INITIAL_TICKETS);
  return INITIAL_TICKETS;
}

function saveLocalTickets(tickets: ServiceTicket[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Could not save local tickets:', e);
  }
}

export function subscribeTickets(
  onUpdate: (tickets: ServiceTicket[]) => void,
  onError?: (err: Error) => void
): () => void {
  let isFirestoreActive = true;
  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const ticketsCol = collection(db, 'tickets');
    unsubscribeFirestore = onSnapshot(
      ticketsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const tickets: ServiceTicket[] = [];
          snapshot.forEach((docSnap) => {
            tickets.push(docSnap.data() as ServiceTicket);
          });
          // Sort newest first
          tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          saveLocalTickets(tickets);
          onUpdate(tickets);
        } else {
          // If Firestore is empty, seed with initial sample tickets
          const local = getLocalTickets();
          onUpdate(local);
          // Seed to firestore asynchronously
          local.forEach(async (t) => {
            try {
              await setDoc(doc(db, 'tickets', t.id), t);
            } catch (err) {
              console.warn('Could not seed ticket to Firestore:', err);
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore subscription fallback to local storage:', error.message);
        isFirestoreActive = false;
        if (onError) onError(error);
        // Fallback to local storage
        const local = getLocalTickets();
        onUpdate(local);
      }
    );
  } catch (err: unknown) {
    console.warn('Failed to initialize Firestore listener, fallback to local:', err);
    isFirestoreActive = false;
    const local = getLocalTickets();
    onUpdate(local);
  }

  // Also listen for local storage events from other tabs
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && !isFirestoreActive) {
      onUpdate(getLocalTickets());
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    window.removeEventListener('storage', handleStorageChange);
  };
}

export async function createTicket(ticket: ServiceTicket): Promise<void> {
  // Update local storage first for snappy UI
  const current = getLocalTickets();
  const updated = [ticket, ...current];
  saveLocalTickets(updated);

  // Sync to Firestore
  try {
    await setDoc(doc(db, 'tickets', ticket.id), ticket);
  } catch (err) {
    console.warn('Could not save ticket to Firestore, kept in local storage:', err);
  }
}

export async function updateTicketStatus(
  ticketId: string, 
  newStatus: TicketStatus,
  note?: string
): Promise<void> {
  const current = getLocalTickets();
  const index = current.findIndex(t => t.id === ticketId);
  const now = new Date().toISOString();
  
  if (index !== -1) {
    const updatedMessages = [...current[index].messages];
    if (note) {
      updatedMessages.push({
        id: `msg-status-${Date.now()}`,
        sender: 'agent',
        senderName: 'Tier 2 Engineering',
        timestamp: now,
        text: `**Status changed to ${newStatus}**: ${note}`,
        isSolutionProposal: newStatus === 'Resolved'
      });
    }

    current[index] = {
      ...current[index],
      status: newStatus,
      updatedAt: now,
      messages: updatedMessages
    };
    saveLocalTickets(current);
  }

  try {
    const docRef = doc(db, 'tickets', ticketId);
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: now
    };
    if (index !== -1) {
      updatePayload.messages = current[index].messages;
    }
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn('Could not update ticket in Firestore:', err);
  }
}

export async function addTicketMessage(ticketId: string, message: TicketMessage): Promise<void> {
  const current = getLocalTickets();
  const index = current.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    const ticket = current[index];
    const messages = [...(ticket.messages || []), message];
    current[index] = {
      ...ticket,
      messages,
      updatedAt: new Date().toISOString()
    };
    saveLocalTickets(current);
  }

  try {
    const currentTicket = current.find(t => t.id === ticketId);
    if (currentTicket) {
      const docRef = doc(db, 'tickets', ticketId);
      await updateDoc(docRef, {
        messages: currentTicket.messages,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Could not update messages in Firestore:', err);
  }
}

export async function escalateTicket(
  ticketId: string, 
  escalationData: Partial<EscalationInfo>,
  additionalMessage?: TicketMessage
): Promise<void> {
  const current = getLocalTickets();
  const index = current.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    const ticket = current[index];
    const updatedEscalation: EscalationInfo = {
      ...ticket.escalation,
      ...escalationData,
      isEscalated: true,
      escalatedAt: escalationData.escalatedAt || new Date().toISOString()
    };
    const messages = additionalMessage ? [...(ticket.messages || []), additionalMessage] : ticket.messages;

    current[index] = {
      ...ticket,
      status: 'Escalated',
      escalation: updatedEscalation,
      messages,
      updatedAt: new Date().toISOString()
    };
    saveLocalTickets(current);
  }

  try {
    const currentTicket = current.find(t => t.id === ticketId);
    if (currentTicket) {
      const docRef = doc(db, 'tickets', ticketId);
      await updateDoc(docRef, {
        status: 'Escalated',
        escalation: currentTicket.escalation,
        messages: currentTicket.messages,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Could not update escalation in Firestore:', err);
  }
}

export async function addInternalNote(ticketId: string, note: string): Promise<void> {
  const current = getLocalTickets();
  const index = current.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    const ticket = current[index];
    const internalNotes = [...(ticket.escalation.internalNotes || []), note];
    current[index] = {
      ...ticket,
      escalation: {
        ...ticket.escalation,
        internalNotes
      },
      updatedAt: new Date().toISOString()
    };
    saveLocalTickets(current);
  }

  try {
    const currentTicket = current.find(t => t.id === ticketId);
    if (currentTicket) {
      const docRef = doc(db, 'tickets', ticketId);
      await updateDoc(docRef, {
        'escalation.internalNotes': currentTicket.escalation.internalNotes,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Could not save note to Firestore:', err);
  }
}

export async function resetToSampleTickets(): Promise<void> {
  saveLocalTickets(INITIAL_TICKETS);
  for (const t of INITIAL_TICKETS) {
    try {
      await setDoc(doc(db, 'tickets', t.id), t);
    } catch {
      // ignore
    }
  }
}
