import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase modular SDK
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific provisioned database with persistent local caching
let dbInstance: Firestore;

try {
  if (firebaseConfig.firestoreDatabaseId) {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } else {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
} catch {
  // Fallback to getFirestore if initializeFirestore was already called
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

// Request persistent storage permission for IndexedDB & PWA cache
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('Browser persistent storage granted for JanmaSaathi PWA.');
    }
  }).catch(() => {
    // Ignore storage permission prompt errors
  });
}

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Cloud Storage
export const storage = getStorage(app);

// Connectivity validation mandated by architecture
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client is offline or disconnected.');
    }
    return false;
  }
}

validateFirestoreConnection();
