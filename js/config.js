/* =========================================================================
   FIREBASE CONFIG — fill this in when the Firestore project is ready.
   Until then, CareContinuum runs entirely on localStorage (see database.js)
   so the whole app works today. Nothing else needs to change: as soon as
   valid keys are pasted in below, database.js will detect them and switch
   to real Firestore reads/writes automatically.

   Where to get these values:
   Firebase Console -> Project settings -> General -> "Your apps" -> SDK setup
   ========================================================================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Detected automatically by database.js — do not edit.
const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !!firebaseConfig.apiKey;
