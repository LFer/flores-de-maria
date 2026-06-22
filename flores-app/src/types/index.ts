// Domain models shared across services and screens.

export type Assignee = 'María' | 'Belén';

// Box pricing (ARS). Matches the prototype: chica $250, grande $450.
export const PRICE = { chica: 250, grande: 450 } as const;

export function orderAmount(o: Pick<Order, 'totalAmount'>): number {
  return o.totalAmount;
}

export type DeliveryStatus = 'pending' | 'partial' | 'delivered';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  deliveredQuantity: number;
  paidQuantity?: number; // cajas cobradas de esta línea (cobro por ítem)
}

export interface DeliveryMovementItem {
  itemId: string;
  name: string;
  quantity: number;
}

export interface DeliveryMovement {
  id: string;
  createdAt: number;
  createdBy?: string | null;
  items: DeliveryMovementItem[];
}

export interface Order {
  id: string;
  name: string; // cliente
  assignee: Assignee;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  deliveryMovements: DeliveryMovement[];
  paymentMovementIds: string[];
  entrega?: string; // delivery date label, e.g. "20 jun"
  nota?: string;
  createdAt?: number;
  // Legacy fields from the first boolean-based order model. New UI and writes
  // use the item/status model above; these remain optional during transition.
  chica?: number;
  grande?: number;
  amount?: number;
  entregado?: boolean;
  cobrado?: boolean;
  paymentMovementId?: string | null;
}

export type NewOrderInput = {
  name: string;
  chica: number;
  grande: number;
  assignee: Assignee;
  entregado: boolean;
  cobrado: boolean;
  entrega?: string;
  nota?: string;
  amount?: number;
};

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
  comprobanteMimeType?: string;
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
