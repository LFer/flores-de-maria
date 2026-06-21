// Cash (Caja) service — recent collections (cobros) plus aggregate balance.
// Firestore-backed when configured; in-memory mock otherwise.
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { MemoryCollection, genId } from './mock/store';
import { seedIncomes } from './mock/seed';
import type { Income, NewIncomeInput, Unsubscribe } from '../types';

const COL = 'incomes';
const mock = new MemoryCollection<Income>(seedIncomes);

export const cashService = {
  /** Realtime list of recent collections (cobros). */
  subscribeIncomes(cb: (incomes: Income[]) => void): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Income, 'id'>) })));
      });
    }
    return mock.subscribe(cb);
  },

  async addIncome(input: NewIncomeInput): Promise<void> {
    const payload = { ...input, createdAt: Date.now() };
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, COL), payload);
      return;
    }
    mock.add({ id: genId('i'), ...payload });
  },
};
