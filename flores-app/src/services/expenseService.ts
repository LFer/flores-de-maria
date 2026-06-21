// Expenses service. Firestore-backed when configured; in-memory mock otherwise.
// Creating an expense is a consistent operation: upload the comprobante (if any),
// then write the `expenses` doc and its matching `cash_movements` doc together
// (a write batch in Firestore) so a gasto can never exist without its cash
// movement.
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { storageService } from './storageService';
import { cashService, buildCashMovement } from './cashService';
import { authService } from './authService';
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

  /** Create an expense and its `expense` cash movement consistently. */
  async add(input: NewExpenseInput): Promise<void> {
    const { comprobanteLocalUri, ...fields } = input;
    const receiptUrl = comprobanteLocalUri
      ? await storageService.uploadComprobante(comprobanteLocalUri)
      : undefined;

    const responsibleName = fields.responsibleName ?? authService.currentUserName();
    const responsibleId = fields.responsibleId ?? authService.currentUserId();
    const description =
      fields.detail && fields.detail !== '—' ? `${fields.name} · ${fields.detail}` : fields.name;

    // Strip undefined for Firestore.
    const expenseDoc: Record<string, unknown> = {
      name: fields.name,
      detail: fields.detail,
      amount: fields.amount,
      date: fields.date,
      createdAt: Date.now(),
    };
    if (receiptUrl) expenseDoc.comprobanteUrl = receiptUrl;
    if (responsibleName) expenseDoc.responsibleName = responsibleName;
    if (responsibleId) expenseDoc.responsibleId = responsibleId;

    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      const expenseRef = doc(collection(db, COL));
      const movementRef = doc(collection(db, 'cash_movements'));
      batch.set(expenseRef, expenseDoc);
      batch.set(
        movementRef,
        buildCashMovement({
          type: 'expense',
          direction: 'out',
          amount: fields.amount,
          description,
          expenseId: expenseRef.id,
          receiptUrl,
          responsibleName,
          responsibleId,
        }),
      );
      await batch.commit();
      return;
    }

    // Mock: write both collections sequentially.
    const expenseId = genId('e');
    mock.add({ id: expenseId, ...(expenseDoc as Omit<Expense, 'id'>) });
    await cashService.createExpenseMovement({
      expenseId,
      amount: fields.amount,
      description,
      receiptUrl,
      responsibleName,
      responsibleId,
    });
  },
};
