// Expenses service. Firestore-backed when configured; in-memory mock otherwise.
// Receipt/comprobante images are uploaded to Firebase Storage and the resulting
// download URL is stored on the expense document.
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './firebase';
import { MemoryCollection, genId } from './mock/store';
import { seedExpenses } from './mock/seed';
import type { Expense, NewExpenseInput, Unsubscribe } from '../types';

const COL = 'expenses';
const mock = new MemoryCollection<Expense>(seedExpenses);

export const expenseService = {
  subscribe(cb: (expenses: Expense[]) => void): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) })));
      });
    }
    return mock.subscribe(cb);
  },

  async add(input: NewExpenseInput): Promise<void> {
    const payload = { ...input, createdAt: Date.now() };
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, COL), payload);
      return;
    }
    mock.add({ id: genId('e'), ...payload });
  },

  /** Upload a comprobante image and return its download URL. */
  async uploadComprobante(localUri: string): Promise<string> {
    if (isFirebaseConfigured && storage) {
      const res = await fetch(localUri);
      const blob = await res.blob();
      const path = `comprobantes/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, blob);
      return getDownloadURL(r);
    }
    // Mock: just echo the local URI back so the UI can preview it.
    return localUri;
  },
};
