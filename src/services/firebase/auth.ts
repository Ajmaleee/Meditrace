import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { USE_DEMO_DATA, auth, db } from '@/services/firebase/config';
import { DEMO_PASSWORD, users } from '@/services/mockData';
import type { AppUser } from '@/types';

export class AuthError extends Error {}

export async function login(email: string, password: string): Promise<AppUser> {
  if (USE_DEMO_DATA) {
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) {
      throw new AuthError('The email or password you entered is incorrect.');
    }
    if (user.status !== 'active') {
      throw new AuthError('This account has been suspended. Contact your administrator.');
    }
    sessionStorage.setItem('meditrace_demo_user', user.userId);
    return user;
  }

  if (!auth || !db) throw new AuthError('Authentication is not configured.');
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
    if (!profileSnap.exists()) {
      throw new AuthError('No profile was found for this account. Contact your administrator.');
    }
    return profileSnap.data() as AppUser;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('The email or password you entered is incorrect.');
  }
}

export async function logout(): Promise<void> {
  if (USE_DEMO_DATA) {
    sessionStorage.removeItem('meditrace_demo_user');
    return;
  }
  if (auth) await firebaseSignOut(auth);
}

/** Resolves the currently signed-in user, if any, on app load. */
export function getPersistedDemoUser(): AppUser | null {
  const userId = sessionStorage.getItem('meditrace_demo_user');
  return users.find((u) => u.userId === userId) ?? null;
}

export function subscribeToAuthChanges(callback: (user: AppUser | null) => void): () => void {
  if (USE_DEMO_DATA) {
    callback(getPersistedDemoUser());
    return () => {};
  }
  if (!auth || !db) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    callback(profileSnap.exists() ? (profileSnap.data() as AppUser) : null);
  });
}
