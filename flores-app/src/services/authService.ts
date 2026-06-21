// Authentication service. Backed by Firebase Auth when configured, otherwise a
// permissive in-memory mock so the login flow is exercisable in development.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import type { AppUser, Unsubscribe } from '../types';

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

  async signUp(email: string, password: string): Promise<AppUser> {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName };
    }
    mockUser = { uid: MOCK_KEY, email, displayName: email.split('@')[0] };
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
};
