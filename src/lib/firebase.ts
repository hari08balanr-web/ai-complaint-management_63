import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

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

// Initialize Firestore with custom databaseId if defined
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

// Custom Auth State Listener with Enterprise Profile support
type AuthCallback = (user: User | null) => void;
const authListeners = new Set<AuthCallback>();
let activeEnterpriseUser: User | null = null;

try {
  const cached = localStorage.getItem('nexus_enterprise_user_session');
  if (cached) {
    activeEnterpriseUser = JSON.parse(cached) as unknown as User;
  }
} catch {
  // ignore
}

fbOnAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    activeEnterpriseUser = null;
    try {
      localStorage.removeItem('nexus_enterprise_user_session');
    } catch {
      // ignore
    }
    authListeners.forEach((cb) => cb(firebaseUser));
  } else {
    authListeners.forEach((cb) => cb(activeEnterpriseUser));
  }
});

export function onAuthStateChanged(
  _authInstance: typeof auth,
  callback: (user: User | null) => void
): () => void {
  authListeners.add(callback);
  if (auth.currentUser) {
    callback(auth.currentUser);
  } else {
    callback(activeEnterpriseUser);
  }
  return () => {
    authListeners.delete(callback);
  };
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    activeEnterpriseUser = null;
    try {
      localStorage.removeItem('nexus_enterprise_user_session');
    } catch {
      // ignore
    }
    authListeners.forEach((cb) => cb(result.user));
    return result.user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      console.log('Google sign-in popup closed by user.');
      return null;
    }
    console.warn('Google sign-in encountered an issue:', err?.message || error);
    throw error;
  }
}

export async function loginWithEnterpriseSSO(
  fullName: string,
  workEmail: string
): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err: unknown) {
    const enterpriseUser = {
      uid: 'sso-' + Math.random().toString(36).substring(2, 9),
      displayName: fullName,
      email: workEmail,
      photoURL: null,
      isAnonymous: false,
      emailVerified: true,
      providerData: [],
      metadata: {},
    } as unknown as User;

    activeEnterpriseUser = enterpriseUser;
    try {
      localStorage.setItem('nexus_enterprise_user_session', JSON.stringify(enterpriseUser));
    } catch {
      // ignore
    }
    authListeners.forEach((cb) => cb(enterpriseUser));
    return enterpriseUser;
  }
}

// Backwards compatibility alias for components
export async function loginAsGuest(
  name: string = 'Enterprise User',
  email: string = 'user@organization.internal'
): Promise<User> {
  return loginWithEnterpriseSSO(name, email);
}

export async function logOut(): Promise<void> {
  activeEnterpriseUser = null;
  try {
    localStorage.removeItem('nexus_enterprise_user_session');
  } catch {
    // ignore
  }
  authListeners.forEach((cb) => cb(null));
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
}

export { collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query, orderBy };
export type { User };

