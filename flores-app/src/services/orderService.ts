// Orders service. Firestore-backed when configured; in-memory mock otherwise.
// Orders are item-based and track delivery/payment independently.
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { authService } from './authService';
import { buildCashMovement, cashService } from './cashService';
import { MemoryCollection, genId } from './mock/store';
import { seedOrders } from './mock/seed';
import { PRICE } from '../types';
import type {
  DeliveryMovement,
  DeliveryStatus,
  NewOrderInput,
  Order,
  OrderItem,
  PaymentStatus,
  Unsubscribe,
} from '../types';

const COL = 'orders';
const CASH_COL = 'cash_movements';
const mock = new MemoryCollection<Order>(seedOrders);

type DeliveryInput = { itemId: string; quantity: number };
type PaymentInput = { itemId: string; quantity: number };

function isCurrentOrder(value: Order): boolean {
  return (
    Array.isArray(value.items) &&
    typeof value.totalAmount === 'number' &&
    typeof value.paidAmount === 'number' &&
    Array.isArray(value.deliveryMovements) &&
    Array.isArray(value.paymentMovementIds)
  );
}

function paymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (totalAmount <= 0) return 'paid';
  if (paidAmount <= 0) return 'pending';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

function deliveryStatus(items: OrderItem[]): DeliveryStatus {
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  const delivered = items.reduce((sum, item) => sum + item.deliveredQuantity, 0);
  if (delivered <= 0) return 'pending';
  if (delivered >= total) return 'delivered';
  return 'partial';
}

function buildItems(input: NewOrderInput, delivered: boolean): OrderItem[] {
  const definitions = [
    { id: 'chica', name: 'Caja Chica (16 brigadeiros)', quantity: input.chica, unitPrice: PRICE.chica },
    { id: 'grande', name: 'Caja Grande (30 brigadeiros)', quantity: input.grande, unitPrice: PRICE.grande },
  ];
  return definitions
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
      deliveredQuantity: delivered ? item.quantity : 0,
      paidQuantity: input.cobrado ? item.quantity : 0,
    }));
}

function initialDeliveryMovement(items: OrderItem[], createdAt: number): DeliveryMovement[] {
  if (!items.some((item) => item.deliveredQuantity > 0)) return [];
  return [
    {
      id: genId('dm'),
      createdAt,
      createdBy: authService.currentUserId() ?? null,
      items: items.map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.deliveredQuantity,
      })),
    },
  ];
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

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
  /** Realtime list of current-model orders, newest first. */
  subscribe(cb: (orders: Order[]) => void): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        cb(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
            .filter(isCurrentOrder),
        );
      });
    }
    return mock.subscribe((orders) => cb(orders.filter(isCurrentOrder)));
  },

  /** One-shot read for manual refresh. Does not create a realtime listener. */
  async listOnce(): Promise<Order[]> {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
        .filter(isCurrentOrder);
    }
    return mock.snapshot().filter(isCurrentOrder);
  },

  async add(input: NewOrderInput): Promise<void> {
    const createdAt = Date.now();
    const items = buildItems(input, input.entregado);
    if (!items.length) throw new Error('Order requires at least one item');

    const derivedAmount = items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = input.amount ?? derivedAmount;
    const paidAmount = input.cobrado ? totalAmount : 0;
    const payload: Omit<Order, 'id'> = {
      name: input.name,
      assignee: input.assignee,
      items,
      totalAmount,
      paidAmount,
      deliveryStatus: deliveryStatus(items),
      paymentStatus: paymentStatus(totalAmount, paidAmount),
      deliveryMovements: initialDeliveryMovement(items, createdAt),
      paymentMovementIds: [],
      entrega: input.entrega,
      nota: input.nota,
      createdAt,
      chica: input.chica,
      grande: input.grande,
      amount: input.amount,
      entregado: input.entregado,
      cobrado: input.cobrado,
      paymentMovementId: null,
    };

    if (isFirebaseConfigured && db) {
      const orderRef = doc(collection(db, COL));
      const firestorePayload = withoutUndefined(payload as unknown as Record<string, unknown>);
      if (input.cobrado && totalAmount > 0) {
        const movementRef = doc(collection(db, CASH_COL));
        const movement = buildCashMovement({
          type: 'order_payment',
          direction: 'in',
          amount: totalAmount,
          description: `Cobro pedido · ${input.name}`,
          orderId: orderRef.id,
        });
        const batch = writeBatch(db);
        batch.set(orderRef, { ...firestorePayload, paymentMovementIds: [movementRef.id], paymentMovementId: movementRef.id });
        batch.set(movementRef, movement);
        await batch.commit();
      } else {
        await addDoc(collection(db, COL), firestorePayload);
      }
      return;
    }

    const id = genId('o');
    mock.add({ id, ...payload });
    if (input.cobrado && totalAmount > 0) {
      const movementId = await cashService.createOrderPaymentMovement({ id, ...payload }, totalAmount);
      await patchOrder(id, { paymentMovementIds: [movementId], paymentMovementId: movementId });
    }
  },

  async registerDelivery(id: string, deliveredItems: DeliveryInput[]): Promise<void> {
    const order = await readOrder(id);
    if (!order || !isCurrentOrder(order)) return;

    const quantities = new Map(deliveredItems.map((item) => [item.itemId, item.quantity]));
    const positiveItems = deliveredItems.filter((item) => item.quantity > 0);
    if (!positiveItems.length) throw new Error('Delivery amount must be positive');

    const movementItems: DeliveryMovement['items'] = [];
    const items = order.items.map((item) => {
      const quantity = quantities.get(item.id) ?? 0;
      const pending = item.quantity - item.deliveredQuantity;
      if (quantity < 0 || quantity > pending) throw new Error('Invalid delivery quantity');
      if (quantity > 0) {
        movementItems.push({ itemId: item.id, name: item.name, quantity });
      }
      return { ...item, deliveredQuantity: item.deliveredQuantity + quantity };
    });

    if (!movementItems.length) throw new Error('Delivery amount must be positive');
    const movement: DeliveryMovement = {
      id: genId('dm'),
      createdAt: Date.now(),
      createdBy: authService.currentUserId() ?? null,
      items: movementItems,
    };

    const status = deliveryStatus(items);
    await patchOrder(id, {
      items,
      deliveryStatus: status,
      deliveryMovements: [...order.deliveryMovements, movement],
      entregado: status === 'delivered',
    });
  },

  async registerPayment(id: string, paidItems: PaymentInput[]): Promise<void> {
    const order = await readOrder(id);
    if (!order || !isCurrentOrder(order)) return;

    const balance = order.totalAmount - order.paidAmount;
    if (balance <= 0) throw new Error('Order already fully paid');

    // Charge per item by quantity; the amount is derived from unit prices.
    const quantities = new Map(paidItems.map((item) => [item.itemId, item.quantity]));
    let amount = 0;
    const items = order.items.map((item) => {
      const quantity = quantities.get(item.id) ?? 0;
      const alreadyPaid = item.paidQuantity ?? 0;
      const pending = item.quantity - alreadyPaid;
      if (quantity < 0 || quantity > pending) throw new Error('Invalid payment quantity');
      amount += quantity * item.unitPrice;
      return { ...item, paidQuantity: alreadyPaid + quantity };
    });

    if (amount <= 0) throw new Error('Payment amount must be positive');
    if (amount > balance) throw new Error('Payment exceeds balance');

    const paidAmount = order.paidAmount + amount;
    const status = paymentStatus(order.totalAmount, paidAmount);

    if (isFirebaseConfigured && db) {
      const movementRef = doc(collection(db, CASH_COL));
      const movement = buildCashMovement({
        type: 'order_payment',
        direction: 'in',
        amount,
        description: `Cobro pedido · ${order.name}`,
        orderId: id,
      });
      const batch = writeBatch(db);
      batch.update(doc(db, COL, id), {
        items,
        paidAmount,
        paymentStatus: status,
        paymentMovementIds: [...order.paymentMovementIds, movementRef.id],
        cobrado: status === 'paid',
        paymentMovementId: status === 'paid' ? movementRef.id : order.paymentMovementId ?? null,
      });
      batch.set(movementRef, movement);
      await batch.commit();
      return;
    }

    const movementId = await cashService.createOrderPaymentMovement(order, amount);
    await patchOrder(id, {
      items,
      paidAmount,
      paymentStatus: status,
      paymentMovementIds: [...order.paymentMovementIds, movementId],
      cobrado: status === 'paid',
      paymentMovementId: status === 'paid' ? movementId : order.paymentMovementId ?? null,
    });
  },

  async archive(id: string): Promise<void> {
    const order = await readOrder(id);
    if (!order || !isCurrentOrder(order)) return;
    if (order.deliveryStatus !== 'delivered') throw new Error('Order must be fully delivered before archiving');
    if (order.paymentStatus !== 'paid') throw new Error('Order must be fully paid before archiving');

    await patchOrder(id, {
      archived: true,
      archivedAt: Date.now(),
      archivedBy: authService.currentUserId() ?? null,
    });
  },

  async unarchive(id: string): Promise<void> {
    const order = await readOrder(id);
    if (!order || !isCurrentOrder(order)) return;

    await patchOrder(id, {
      archived: false,
      archivedAt: null,
      archivedBy: null,
    });
  },
};
