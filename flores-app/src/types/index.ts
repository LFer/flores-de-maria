// Domain models shared across services and screens.

export type Assignee = 'María' | 'Belén';

// Box pricing (ARS). Matches the prototype: chica $250, grande $450.
export const PRICE = { chica: 250, grande: 450 } as const;

export function orderAmount(o: Pick<Order, 'chica' | 'grande'>): number {
  return o.chica * PRICE.chica + o.grande * PRICE.grande;
}

export interface Order {
  id: string;
  name: string; // cliente
  chica: number; // # cajas chicas (16 brigadeiros)
  grande: number; // # cajas grandes (30 brigadeiros)
  assignee: Assignee;
  entregado: boolean;
  cobrado: boolean;
  entrega?: string; // delivery date label, e.g. "20 jun"
  nota?: string;
  createdAt?: number;
}

export type NewOrderInput = Omit<Order, 'id' | 'createdAt'>;

export interface Expense {
  id: string;
  name: string; // concepto
  detail: string;
  amount: number;
  date: string; // "16 jun"
  comprobanteUrl?: string; // receipt image in Firebase Storage
  createdAt?: number;
}

export type NewExpenseInput = Omit<Expense, 'id' | 'createdAt'>;

export interface Income {
  id: string;
  name: string; // cliente
  detail: string; // e.g. "20 brigadeiros"
  amount: number;
  date: string; // "18 jun"
  createdAt?: number;
}

export type NewIncomeInput = Omit<Income, 'id' | 'createdAt'>;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type Unsubscribe = () => void;
