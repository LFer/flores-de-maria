// Seed data lifted verbatim from the design prototype's `renderVals`.
// Used by the in-memory mock backend (and as Firestore seed reference).
import type { Order, Expense, Income } from '../../types';

export const seedOrders: Order[] = [
  { id: 'o1', name: 'Susana', chica: 1, grande: 0, assignee: 'María', entregado: true, cobrado: true },
  { id: 'o2', name: 'Camila', chica: 0, grande: 1, assignee: 'Belén', entregado: true, cobrado: false },
  { id: 'o3', name: 'Melanie', chica: 2, grande: 0, assignee: 'María', entregado: false, cobrado: false },
  { id: 'o4', name: 'Carmelitas', chica: 1, grande: 2, assignee: 'Belén', entregado: false, cobrado: true },
];

export const seedIncomes: Income[] = [
  { id: 'i1', name: 'Susana', detail: '20 brigadeiros', amount: 400, date: '18 jun' },
  { id: 'i2', name: 'Carmelitas', detail: '24 brigadeiros', amount: 450, date: '17 jun' },
  { id: 'i3', name: 'Familia Gómez', detail: '30 brigadeiros', amount: 600, date: '14 jun' },
  { id: 'i4', name: 'Kiosco San José', detail: '50 brigadeiros', amount: 750, date: '11 jun' },
];

export const seedExpenses: Expense[] = [
  { id: 'e1', name: 'Leche condensada', detail: '6 latas', amount: 480, date: '16 jun' },
  { id: 'e2', name: 'Cacao amargo', detail: '1 kg', amount: 320, date: '16 jun' },
  { id: 'e3', name: 'Granas de colores', detail: 'surtidas', amount: 180, date: '14 jun' },
  { id: 'e4', name: 'Pirotines', detail: '200 u.', amount: 120, date: '14 jun' },
];
