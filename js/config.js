/* =========================================================================
   FIREBASE CONFIG — fill this in when the Firestore project is ready.
   Until then, MediTrace runs entirely on localStorage (see database.js)
   so the whole app works today. Nothing else needs to change: as soon as
   valid keys are pasted in below, database.js will detect them and switch
   to real Firestore reads/writes automatically.

   Where to get these values:
   Firebase Console -> Project settings -> General -> "Your apps" -> SDK setup
   ========================================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyB8DmKfOsKNceS5v7GjNs6qkl5nHkJG498",
  authDomain: "meditrace-ac26d.firebaseapp.com",
  projectId: "meditrace-ac26d",
  storageBucket: "meditrace-ac26d.firebasestorage.app",
  messagingSenderId: "35095887936",
  appId: "1:35095887936:web:a612bca8ddb8ec25415fa5"
};

// Detected automatically by database.js — do not edit.
const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !!firebaseConfig.apiKey;
