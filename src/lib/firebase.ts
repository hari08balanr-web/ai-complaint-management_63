import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  onAuthStateChanged,
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

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.warn('Google popup sign-in encountered an issue (likely iframe popup restriction), trying anonymous/guest auth:', error);
    const guestResult = await signInAnonymously(auth);
    return guestResult.user;
  }
}

export async function loginAsGuest(name: string = 'Demo User'): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query, orderBy };
export type { User };
