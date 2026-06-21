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
  paymentMovementId?: string | null; // cash_movements doc created when cobrado
  createdAt?: number;
}

export type NewOrderInput = Omit<Order, 'id' | 'createdAt' | 'paymentMovementId'>;

export interface Expense {
  id: string;
  name: string; // concepto
  detail: string;
  amount: number;
  date: string; // "16 jun"
  comprobanteUrl?: string; // receipt image in Firebase Storage
  responsibleName?: string;
  responsibleId?: string;
  createdAt?: number;
}

// `comprobanteLocalUri` is the picked image to upload; the service swaps it for
// a Storage `comprobanteUrl`.
export type NewExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'comprobanteUrl'> & {
  comprobanteLocalUri?: string;
};

// ── Cash ledger ──────────────────────────────────────────────────
export type CashMovementType = 'order_payment' | 'expense' | 'parish_delivery' | 'adjustment';
export type CashDirection = 'in' | 'out';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  direction: CashDirection;
  amount: number;
  description: string;
  responsibleName?: string;
  responsibleId?: string;
  orderId?: string;
  expenseId?: string;
  receiptUrl?: string;
  createdAt: number;
  createdBy?: string;
}

export type NewCashMovementInput = Omit<CashMovement, 'id' | 'createdAt'> & { createdAt?: number };

export interface CashSummary {
  totalIn: number;
  totalOut: number;
  balance: number;
  totalExpenses: number;
  totalParishDeliveries: number;
  totalOrderPayments: number;
}

// ── Users ────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: number;
}

export type Unsubscribe = () => void;
