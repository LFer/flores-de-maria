// Orders service. Firestore-backed when configured; in-memory mock otherwise.
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { MemoryCollection, genId } from './mock/store';
import { seedOrders } from './mock/seed';
import type { Order, NewOrderInput, Unsubscribe } from '../types';

const COL = 'orders';
const mock = new MemoryCollection<Order>(seedOrders);

export const orderService = {
  /** Realtime list of orders, newest first. */
  subscribe(cb: (orders: Order[]) => void): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
      });
    }
    return mock.subscribe(cb);
  },

  async add(input: NewOrderInput): Promise<void> {
    const payload = { ...input, createdAt: Date.now() };
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, COL), payload);
      return;
    }
    mock.add({ id: genId('o'), ...payload });
  },

  async update(id: string, patch: Partial<Order>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COL, id), patch);
      return;
    }
    mock.update(id, patch);
  },

  /** Convenience toggler for the entrega/cobro chips. */
  async toggle(id: string, field: 'entregado' | 'cobrado', value: boolean): Promise<void> {
    return this.update(id, { [field]: value } as Partial<Order>);
  },
};
