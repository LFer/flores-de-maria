import type { Order } from '../types';

function positiveNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function canEditOrder(order: Order): boolean {
  const deliveredQuantity = order.items.reduce((sum, item) => sum + positiveNumber(item.deliveredQuantity), 0);
  const paidQuantity = order.items.reduce((sum, item) => sum + positiveNumber(item.paidQuantity), 0);
  const hasPaymentMovementIds = Array.isArray(order.paymentMovementIds) && order.paymentMovementIds.length > 0;
  const hasLegacyPaymentMovementId =
    typeof order.paymentMovementId === 'string' && order.paymentMovementId.trim().length > 0;

  return (
    order.archived !== true &&
    deliveredQuantity === 0 &&
    paidQuantity === 0 &&
    order.paidAmount === 0 &&
    !hasPaymentMovementIds &&
    !hasLegacyPaymentMovementId
  );
}
