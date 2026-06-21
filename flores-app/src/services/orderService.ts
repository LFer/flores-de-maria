// Orders service. Firestore-backed when configured; in-memory mock otherwise.
// Marking an order as cobrado records an `order_payment` cash movement (and
// un-marking reverses it). The movement id is stored on the order as
// `paymentMovementId` so a payment is never recorded twice.
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { cashService } from './cashService';
import { MemoryCollection, genId } from './mock/store';
import { seedOrders } from './mock/seed';
import type { Order, NewOrderInput, Unsubscribe } from '../types';

const COL = 'orders';
const mock = new MemoryCollection<Order>(seedOrders);

async function readOrder(id: string): Promise<Order | undefined> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) }) : undefined;
  }
  return mock.get(id);
}

async function patchOrder(id: string, patch: Partial<Order>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COL, id), patch);
    return;
  }
  mock.update(id, patch);
}

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
    const payload: Record<string, unknown> = {
      name: input.name,
      chica: input.chica,
      grande: input.grande,
      assignee: input.assignee,
      entregado: input.entregado,
      cobrado: input.cobrado,
      paymentMovementId: null,
      createdAt: Date.now(),
    };
    if (input.entrega) payload.entrega = input.entrega;
    if (input.nota) payload.nota = input.nota;
    if (input.amount != null) payload.amount = input.amount;

    let id: string;
    if (isFirebaseConfigured && db) {
      const ref = await addDoc(collection(db, COL), payload);
      id = ref.id;
    } else {
      id = genId('o');
      mock.add({ id, ...(payload as Omit<Order, 'id'>) });
    }

    // An order created already cobrado records its payment movement.
    if (input.cobrado) {
      const order = { id, ...(payload as Omit<Order, 'id'>) } as Order;
      const movementId = await cashService.createOrderPaymentMovement(order);
      await patchOrder(id, { paymentMovementId: movementId });
    }
  },

  /** Toggle the delivery flag (no cash impact). */
  async setEntrega(id: string, value: boolean): Promise<void> {
    await patchOrder(id, { entregado: value });
  },

  /**
   * Set the payment flag, keeping the cash ledger in sync:
   * - false → true: create an order_payment movement, store its id
   * - true → false: delete the movement, clear the id
   * No-op if already in the target state (prevents duplicate movements).
   */
  async setCobro(id: string, value: boolean): Promise<void> {
    const order = await readOrder(id);
    if (!order || order.cobrado === value) return;

    if (value) {
      const movementId = await cashService.createOrderPaymentMovement(order);
      await patchOrder(id, { cobrado: true, paymentMovementId: movementId });
    } else {
      if (order.paymentMovementId) await cashService.deleteCashMovement(order.paymentMovementId);
      await patchOrder(id, { cobrado: false, paymentMovementId: null });
    }
  },
};
