import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase is only initialized when VITE_USE_DEMO_DATA is not "true" AND a
 * project id has been supplied. This lets the prototype run entirely on the
 * in-memory demo dataset (src/services/mockData.ts) for local development
 * and hackathon judging, without requiring real Firebase credentials.
 *
 * To connect a real Firebase project:
 *   1. Copy .env.example to .env.local and fill in your project's config.
 *   2. Set VITE_USE_DEMO_DATA=false
 *   3. Deploy firestore.rules to your project (see README.md).
 */
export const USE_DEMO_DATA =
  import.meta.env.VITE_USE_DEMO_DATA !== 'false' || !import.meta.env.VITE_FIREBASE_PROJECT_ID;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (!USE_DEMO_DATA) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;
