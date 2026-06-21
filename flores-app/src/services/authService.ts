// Authentication service. Backed by Firebase Auth when configured, otherwise a
// permissive in-memory mock so the login flow is exercisable in development.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseService';
import type { AppUser, UserProfile, Unsubscribe } from '../types';

const MOCK_KEY = 'mock-user';
let mockUser: AppUser | null = null;
const mockListeners = new Set<(u: AppUser | null) => void>();

function emitMock() {
  mockListeners.forEach((cb) => cb(mockUser));
}

export const authService = {
  /** Subscribe to auth state. Fires immediately with the current user. */
  onAuthChange(cb: (user: AppUser | null) => void): Unsubscribe {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, (u) =>
        cb(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null),
      );
    }
    mockListeners.add(cb);
    cb(mockUser);
    return () => mockListeners.delete(cb);
  },

  async signIn(email: string, password: string): Promise<AppUser> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
    }
    // Mock: accept any non-empty credentials.
    if (!email || !password) throw new Error('Ingresá email y contraseña.');
    mockUser = { uid: MOCK_KEY, email, displayName: email.split('@')[0] };
    emitMock();
    return mockUser;
  },

  /**
   * Self-service signup: creates the Auth user, sets the displayName, and writes
   * a `users/{uid}` profile document (role "user", active true).
   */
  async signUp(email: string, password: string, displayName: string): Promise<AppUser> {
    const name = displayName.trim();
    if (isFirebaseConfigured && auth && db) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name || null,
        role: 'user',
        active: true,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      return { uid: cred.user.uid, email: cred.user.email, displayName: name || null };
    }
    if (!email || !password) throw new Error('Completá email y contraseña.');
    mockUser = { uid: MOCK_KEY, email, displayName: name || email.split('@')[0] };
    emitMock();
    return mockUser;
  },

  async signOut(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
      return;
    }
    mockUser = null;
    emitMock();
  },

  /** Current user's uid, if any (sync). Used to stamp createdBy on writes. */
  currentUserId(): string | undefined {
    if (isFirebaseConfigured && auth) return auth.currentUser?.uid ?? undefined;
    return mockUser?.uid;
  },

  /** Current user's display name, if any (sync). */
  currentUserName(): string | undefined {
    if (isFirebaseConfigured && auth) return auth.currentUser?.displayName ?? undefined;
    return mockUser?.displayName ?? undefined;
  },
};
