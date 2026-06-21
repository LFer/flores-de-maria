// Seed data for the in-memory mock backend (used when Firebase isn't configured).
// Orders/expenses come from the design prototype; the cash ledger is a small
// representative set spanning the four movement types.
import type { Order, Expense, CashMovement } from '../../types';

type ItemOpts = { delivered?: boolean; paidChica?: number; paidGrande?: number };

const orderItems = (chica: number, grande: number, opts: ItemOpts = {}) => [
  ...(chica > 0
    ? [
        {
          id: 'chica',
          name: 'Caja Chica (16 brigadeiros)',
          quantity: chica,
          unitPrice: 250,
          total: chica * 250,
          deliveredQuantity: opts.delivered ? chica : 0,
          paidQuantity: opts.paidChica ?? 0,
        },
      ]
    : []),
  ...(grande > 0
    ? [
        {
          id: 'grande',
          name: 'Caja Grande (30 brigadeiros)',
          quantity: grande,
          unitPrice: 450,
          total: grande * 450,
          deliveredQuantity: opts.delivered ? grande : 0,
          paidQuantity: opts.paidGrande ?? 0,
        },
      ]
    : []),
];

export const seedOrders: Order[] = [
  {
    id: 'o1',
    name: 'Susana',
    chica: 1,
    grande: 0,
    assignee: 'María',
    items: orderItems(1, 0, { delivered: true, paidChica: 1 }),
    totalAmount: 250,
    paidAmount: 250,
    deliveryStatus: 'delivered',
    paymentStatus: 'paid',
    deliveryMovements: [],
    paymentMovementIds: ['m1'],
  },
  {
    id: 'o2',
    name: 'Camila',
    chica: 0,
    grande: 1,
    assignee: 'Belén',
    items: orderItems(0, 1, { delivered: true }),
    totalAmount: 450,
    paidAmount: 0,
    deliveryStatus: 'delivered',
    paymentStatus: 'pending',
    deliveryMovements: [],
    paymentMovementIds: [],
  },
  {
    id: 'o3',
    name: 'Melanie',
    chica: 2,
    grande: 0,
    assignee: 'María',
    items: orderItems(2, 0),
    totalAmount: 500,
    paidAmount: 0,
    deliveryStatus: 'pending',
    paymentStatus: 'pending',
    deliveryMovements: [],
    paymentMovementIds: [],
  },
  {
    id: 'o4',
    name: 'Carmelitas',
    chica: 1,
    grande: 2,
    assignee: 'Belén',
    items: orderItems(1, 2, { paidGrande: 1 }),
    totalAmount: 1150,
    paidAmount: 450,
    deliveryStatus: 'pending',
    paymentStatus: 'partial',
    deliveryMovements: [],
    paymentMovementIds: ['m2'],
  },
];

export const seedExpenses: Expense[] = [
  { id: 'e1', name: 'Leche condensada', detail: '6 latas', amount: 480, date: '16 jun' },
  { id: 'e2', name: 'Cacao amargo', detail: '1 kg', amount: 320, date: '16 jun' },
  { id: 'e3', name: 'Granas de colores', detail: 'surtidas', amount: 180, date: '14 jun' },
  { id: 'e4', name: 'Pirotines', detail: '200 u.', amount: 120, date: '14 jun' },
];

const DAY = 86_400_000;
const now = Date.now();

export const seedCashMovements: CashMovement[] = [
  { id: 'm1', type: 'order_payment', direction: 'in', amount: 250, description: 'Cobro pedido · Susana', orderId: 'o1', createdAt: now - 1 * DAY },
  { id: 'm2', type: 'order_payment', direction: 'in', amount: 450, description: 'Cobro pedido · Carmelitas', orderId: 'o4', createdAt: now - 3 * DAY },
  { id: 'm3', type: 'expense', direction: 'out', amount: 480, description: 'Leche condensada · 6 latas', expenseId: 'e1', createdAt: now - 4 * DAY },
  { id: 'm4', type: 'parish_delivery', direction: 'out', amount: 500, description: 'Entrega a la parroquia', responsibleName: 'María', createdAt: now - 5 * DAY },
  { id: 'm5', type: 'order_payment', direction: 'in', amount: 750, description: 'Cobro pedido · Kiosco San José', createdAt: now - 7 * DAY },
  { id: 'm6', type: 'adjustment', direction: 'in', amount: 100, description: 'Ajuste de caja inicial', createdAt: now - 9 * DAY },
];
