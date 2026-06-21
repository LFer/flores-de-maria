// Seed data for the in-memory mock backend (used when Firebase isn't configured).
// Orders/expenses come from the design prototype; the cash ledger is a small
// representative set spanning the four movement types.
import type { Order, Expense, CashMovement } from '../../types';

export const seedOrders: Order[] = [
  { id: 'o1', name: 'Susana', chica: 1, grande: 0, assignee: 'María', entregado: true, cobrado: true },
  { id: 'o2', name: 'Camila', chica: 0, grande: 1, assignee: 'Belén', entregado: true, cobrado: false },
  { id: 'o3', name: 'Melanie', chica: 2, grande: 0, assignee: 'María', entregado: false, cobrado: false },
  { id: 'o4', name: 'Carmelitas', chica: 1, grande: 2, assignee: 'Belén', entregado: false, cobrado: true },
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
  { id: 'm1', type: 'order_payment', direction: 'in', amount: 400, description: 'Cobro pedido · Susana', createdAt: now - 1 * DAY },
  { id: 'm2', type: 'order_payment', direction: 'in', amount: 600, description: 'Cobro pedido · Familia Gómez', createdAt: now - 3 * DAY },
  { id: 'm3', type: 'expense', direction: 'out', amount: 480, description: 'Leche condensada · 6 latas', expenseId: 'e1', createdAt: now - 4 * DAY },
  { id: 'm4', type: 'parish_delivery', direction: 'out', amount: 500, description: 'Entrega a la parroquia', responsibleName: 'María', createdAt: now - 5 * DAY },
  { id: 'm5', type: 'order_payment', direction: 'in', amount: 750, description: 'Cobro pedido · Kiosco San José', createdAt: now - 7 * DAY },
  { id: 'm6', type: 'adjustment', direction: 'in', amount: 100, description: 'Ajuste de caja inicial', createdAt: now - 9 * DAY },
];
