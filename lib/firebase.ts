import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { FoodLogItem, WeightEntry } from '../context/AppContext';
import { UserProfile } from './calorieEngine';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyALoHIxxPQ6BVAsP7oXI9NcLUrj1BMzSVs",
  authDomain: "fitbite-7b28e.firebaseapp.com",
  projectId: "fitbite-7b28e",
  storageBucket: "fitbite-7b28e.firebasestorage.app",
  messagingSenderId: "394255997633",
  appId: "1:394255997633:web:7d77a935b10effdea51240",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getActiveFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return DEFAULT_FIREBASE_CONFIG;

  // 1. Check localStorage for custom pasted config
  const customConfig = localStorage.getItem('fitbite_firebase_config');
  if (customConfig) {
    try {
      return JSON.parse(customConfig);
    } catch {
      // ignore
    }
  }

  // 2. Check environment variables
  if (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
  }

  // 3. Built-in default configuration
  return DEFAULT_FIREBASE_CONFIG;
}

export function initFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return { app, db };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { app: null, db: null };
  }
}

export function isFirebaseConnected(): boolean {
  const { db } = initFirebase();
  return db !== null;
}

export function saveCustomFirebaseConfig(config: FirebaseConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fitbite_firebase_config', JSON.stringify(config));
    // Reset instance so next call initializes fresh
    app = null;
    db = null;
    initFirebase();
  }
}

export function clearCustomFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fitbite_firebase_config');
    app = null;
    db = null;
  }
}

// --- CLOUD SYNC OPERATIONS ---

export async function syncLogToFirestore(userId: string, item: FoodLogItem) {
  const { db } = initFirebase();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'food_logs', item.id);
    await setDoc(docRef, item);
  } catch (err) {
    console.error('Failed to sync log to Firestore:', err);
  }
}

export async function deleteLogFromFirestore(userId: string, logId: string) {
  const { db } = initFirebase();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'food_logs', logId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete log from Firestore:', err);
  }
}

export async function syncProfileToFirestore(userId: string, profile: UserProfile) {
  const { db } = initFirebase();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    await setDoc(docRef, profile);
  } catch (err) {
    console.error('Failed to sync profile to Firestore:', err);
  }
}

export async function syncWeightToFirestore(userId: string, weightEntry: WeightEntry) {
  const { db } = initFirebase();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'weights', weightEntry.date);
    await setDoc(docRef, weightEntry);
  } catch (err) {
    console.error('Failed to sync weight to Firestore:', err);
  }
}

export function subscribeToUserData(
  userId: string,
  callbacks: {
    onLogsUpdate: (logs: FoodLogItem[]) => void;
    onProfileUpdate: (profile: UserProfile) => void;
    onWeightsUpdate: (weights: WeightEntry[]) => void;
  }
): () => void {
  const { db } = initFirebase();
  if (!db) return () => {};

  // Listen to Food Logs collection
  const logsCol = collection(db, 'users', userId, 'food_logs');
  const unsubLogs = onSnapshot(
    logsCol,
    (snapshot) => {
      const items: FoodLogItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as FoodLogItem);
      });
      // Sort newest first
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callbacks.onLogsUpdate(items);
    },
    (err) => console.error('Firestore logs sync error:', err)
  );

  // Listen to Profile doc
  const profileDoc = doc(db, 'users', userId, 'profile', 'data');
  const unsubProfile = onSnapshot(
    profileDoc,
    (docSnap) => {
      if (docSnap.exists()) {
        callbacks.onProfileUpdate(docSnap.data() as UserProfile);
      }
    },
    (err) => console.error('Firestore profile sync error:', err)
  );

  // Listen to Weights collection
  const weightsCol = collection(db, 'users', userId, 'weights');
  const unsubWeights = onSnapshot(
    weightsCol,
    (snapshot) => {
      const items: WeightEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as WeightEntry);
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      if (items.length > 0) {
        callbacks.onWeightsUpdate(items);
      }
    },
    (err) => console.error('Firestore weights sync error:', err)
  );

  return () => {
    unsubLogs();
    unsubProfile();
    unsubWeights();
  };
}

export async function saveCustomFoodToFirestore(userId: string, food: any) {
  const { db } = initFirebase();
  if (!db) return;

  try {
    const docRef = doc(db, 'users', userId, 'custom_foods', food.id);
    await setDoc(docRef, food);
  } catch (err) {
    console.error('Failed to save custom food to Firestore:', err);
  }
}

export async function fetchCustomFoodsFromFirestore(userId: string): Promise<any[]> {
  const { db } = initFirebase();
  if (!db) return [];

  try {
    const { getDocs } = await import('firebase/firestore');
    const colRef = collection(db, 'users', userId, 'custom_foods');
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((d) => items.push(d.data()));
    return items;
  } catch (err) {
    console.error('Failed to fetch custom foods from Firestore:', err);
    return [];
  }
}

