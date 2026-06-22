// Expenses service. Firestore-backed when configured; in-memory mock otherwise.
// Creating an expense is a consistent operation: upload the comprobante (if any),
// then write the `expenses` doc and its matching `cash_movements` doc together
// (a write batch in Firestore) so a gasto can never exist without its cash
// movement.
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  where,
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

  /** One-shot read for manual refresh. Does not create a realtime listener. */
  async listOnce(): Promise<Expense[]> {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }));
    }
    return mock.snapshot();
  },

  /** Create an expense and its `expense` cash movement consistently. */
  async add(input: NewExpenseInput): Promise<void> {
    try {
      const { comprobanteLocalUri, ...fields } = input;
      const receipt = comprobanteLocalUri
        ? await storageService.uploadComprobanteWithPath(comprobanteLocalUri, input.comprobanteMimeType)
        : undefined;
      const receiptUrl = receipt?.url;
      const receiptPath = receipt?.path;

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
      if (receiptUrl) {
        expenseDoc.comprobanteUrl = receiptUrl;
        expenseDoc.receiptUrl = receiptUrl;
      }
      if (receiptPath) expenseDoc.receiptPath = receiptPath;
      if (responsibleName) expenseDoc.responsibleName = responsibleName;
      if (responsibleId) expenseDoc.responsibleId = responsibleId;

      if (isFirebaseConfigured && db) {
        const batch = writeBatch(db);
        const expenseRef = doc(collection(db, COL));
        const movementRef = doc(collection(db, 'cash_movements'));
        expenseDoc.cashMovementId = movementRef.id;
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
            receiptPath,
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
      const cashMovementId = await cashService.createExpenseMovement({
        expenseId,
        amount: fields.amount,
        description,
        receiptUrl,
        receiptPath,
        responsibleName,
        responsibleId,
      });
      mock.update(expenseId, { cashMovementId, receiptUrl, receiptPath });
    } catch (error) {
      throw error;
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const firestore = db;
      const expenseRef = doc(firestore, COL, expenseId);
      const expenseSnap = await getDoc(expenseRef);
      if (!expenseSnap.exists()) {
        console.warn('[expenseService] deleteExpense called for missing expense', { expenseId });
        return;
      }

      const expense = { id: expenseSnap.id, ...(expenseSnap.data() as Omit<Expense, 'id'>) };
      const movementIds = new Set<string>();
      if (expense.cashMovementId) movementIds.add(expense.cashMovementId);

      const movementQuery = query(collection(firestore, 'cash_movements'), where('expenseId', '==', expenseId));
      const movementSnap = await getDocs(movementQuery);
      movementSnap.docs.forEach((movementDoc) => movementIds.add(movementDoc.id));

      if (movementIds.size === 0) {
        console.warn('[expenseService] deleteExpense found no matching cash movement', { expenseId });
      }

      const batch = writeBatch(firestore);
      batch.delete(expenseRef);
      movementIds.forEach((movementId) => {
        batch.delete(doc(firestore, 'cash_movements', movementId));
      });
      await batch.commit();

      try {
        await storageService.deleteComprobante(expense.receiptPath);
      } catch (error) {
        console.warn('[expenseService] receipt delete failed after expense delete', {
          expenseId,
          receiptPath: expense.receiptPath,
          error,
        });
      }
      return;
    }

    const expense = mock.get(expenseId);
    if (!expense) {
      console.warn('[expenseService] deleteExpense called for missing mock expense', { expenseId });
      return;
    }

    const movementIds = new Set<string>();
    if (expense.cashMovementId) movementIds.add(expense.cashMovementId);
    const matchingMovements = (await cashService.listCashMovementsOnce()).filter((movement) => movement.expenseId === expenseId);
    matchingMovements.forEach((movement) => movementIds.add(movement.id));

    if (movementIds.size === 0) {
      console.warn('[expenseService] deleteExpense found no matching mock cash movement', { expenseId });
    }

    mock.remove(expenseId);
    for (const movementId of movementIds) {
      await cashService.deleteCashMovement(movementId);
    }
  },
};
