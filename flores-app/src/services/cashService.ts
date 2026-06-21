// Cash ledger service — owns the unified `cash_movements` collection.
// Every change to the caja (order payments, expenses, parish deliveries, manual
// adjustments) is recorded as one movement; the balance is derived from them.
// Firestore-backed when configured; in-memory mock otherwise.
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { authService } from './authService';
import { MemoryCollection, genId } from './mock/store';
import { seedCashMovements } from './mock/seed';
import type {
  CashMovement,
  NewCashMovementInput,
  CashSummary,
  Order,
  Unsubscribe,
} from '../types';

const COL = 'cash_movements';
const mock = new MemoryCollection<CashMovement>(seedCashMovements);

/** Normalize a movement payload: stamp createdAt and createdBy. Shared so the
 *  same shape is written whether through cashService or an expense/order batch. */
export function buildCashMovement(input: NewCashMovementInput): Omit<CashMovement, 'id'> {
  const doc: Record<string, unknown> = {
    type: input.type,
    direction: input.direction,
    amount: input.amount,
    description: input.description,
    createdAt: input.createdAt ?? Date.now(),
    createdBy: input.createdBy ?? authService.currentUserId() ?? null,
  };
  // Firestore rejects `undefined` — only include optional fields when present.
  if (input.responsibleName) doc.responsibleName = input.responsibleName;
  if (input.responsibleId) doc.responsibleId = input.responsibleId;
  if (input.orderId) doc.orderId = input.orderId;
  if (input.expenseId) doc.expenseId = input.expenseId;
  if (input.receiptUrl) doc.receiptUrl = input.receiptUrl;
  return doc as Omit<CashMovement, 'id'>;
}

export const cashService = {
  /** Realtime ledger, newest first. */
  listCashMovements(cb: (movements: CashMovement[]) => void): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CashMovement, 'id'>) })));
      });
    }
    return mock.subscribe(cb);
  },

  /** Create one movement; returns the new doc id. */
  async createCashMovement(input: NewCashMovementInput): Promise<string> {
    const payload = buildCashMovement(input);
    if (isFirebaseConfigured && db) {
      const ref = await addDoc(collection(db, COL), payload);
      return ref.id;
    }
    const id = genId('m');
    mock.add({ id, ...payload });
    return id;
  },

  async deleteCashMovement(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COL, id));
      return;
    }
    mock.remove(id);
  },

  // ── Typed creators ─────────────────────────────────────────────
  createOrderPaymentMovement(order: Order, amount = order.totalAmount - order.paidAmount): Promise<string> {
    return this.createCashMovement({
      type: 'order_payment',
      direction: 'in',
      amount,
      description: `Cobro pedido · ${order.name}`,
      orderId: order.id,
    });
  },

  createExpenseMovement(args: {
    expenseId: string;
    amount: number;
    description: string;
    receiptUrl?: string;
    responsibleName?: string;
    responsibleId?: string;
  }): Promise<string> {
    return this.createCashMovement({ type: 'expense', direction: 'out', ...args });
  },

  createParishDeliveryMovement(args: {
    amount: number;
    description: string;
    responsibleName?: string;
    responsibleId?: string;
  }): Promise<string> {
    return this.createCashMovement({ type: 'parish_delivery', direction: 'out', ...args });
  },

  createAdjustmentMovement(args: {
    direction: 'in' | 'out';
    amount: number;
    description: string;
  }): Promise<string> {
    return this.createCashMovement({ type: 'adjustment', ...args });
  },

  /** Derive caja totals from the ledger. */
  getCashSummary(movements: CashMovement[]): CashSummary {
    let totalIn = 0;
    let totalOut = 0;
    let totalExpenses = 0;
    let totalParishDeliveries = 0;
    let totalOrderPayments = 0;
    for (const m of movements) {
      if (m.direction === 'in') totalIn += m.amount;
      else totalOut += m.amount;
      if (m.type === 'expense') totalExpenses += m.amount;
      else if (m.type === 'parish_delivery') totalParishDeliveries += m.amount;
      else if (m.type === 'order_payment') totalOrderPayments += m.amount;
    }
    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      totalExpenses,
      totalParishDeliveries,
      totalOrderPayments,
    };
  },
};
