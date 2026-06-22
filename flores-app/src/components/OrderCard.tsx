import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { listCardShadow } from '../theme/shadows';
import { Chip } from './Chip';
import { orderAmount, type Order } from '../types';
import { formatARS } from '../lib/format';
import { CURRENT_USER } from '../lib/constants';

function itemsLabel(order: Order): string {
  if (!Array.isArray(order.items) || order.items.length === 0) return 'Sin cajas cargadas';

  const label = order.items
    .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0)
    .map((item) => {
      const kind = item.id === 'chica' ? 'chica' : item.id === 'grande' ? 'grande' : item.name;
      return `${item.quantity} ${item.quantity === 1 ? kind : `${kind}s`}`;
    })
    .join(' · ');

  return label || 'Sin cajas cargadas';
}

type SummaryTone = 'done' | 'partial' | 'pending';

type ProgressSummary = {
  label: string;
  chip: 'Pendiente' | 'Parcial' | 'Completo';
  tone: SummaryTone;
  progress: number;
};

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function deliverySummary(order: Order): ProgressSummary {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { label: 'Entrega pendiente', chip: 'Pendiente', tone: 'pending', progress: 0 };
  }

  let totalBoxes = 0;
  let deliveredBoxes = 0;

  for (const item of order.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) continue;
    const deliveredQuantity = item.deliveredQuantity ?? 0;
    if (!Number.isFinite(deliveredQuantity) || deliveredQuantity < 0) {
      return { label: 'Entrega pendiente', chip: 'Pendiente', tone: 'pending', progress: 0 };
    }

    totalBoxes += item.quantity;
    deliveredBoxes += Math.min(deliveredQuantity, item.quantity);
  }

  if (totalBoxes <= 0) {
    return { label: 'Entrega pendiente', chip: 'Pendiente', tone: 'pending', progress: 0 };
  }

  deliveredBoxes = Math.min(deliveredBoxes, totalBoxes);
  const pendingBoxes = Math.max(0, totalBoxes - deliveredBoxes);
  const progress = clampProgress(deliveredBoxes / totalBoxes);

  if (progress >= 1) {
    return { label: 'Entrega completa', chip: 'Completo', tone: 'done', progress: 1 };
  }

  if (deliveredBoxes > 0) {
    return {
      label: `Entregado: ${deliveredBoxes} de ${totalBoxes} cajas · Faltan entregar: ${pendingBoxes} cajas`,
      chip: 'Parcial',
      tone: 'partial',
      progress,
    };
  }

  return {
    label: `Faltan entregar: ${totalBoxes} cajas`,
    chip: 'Pendiente',
    tone: 'pending',
    progress: 0,
  };
}

function paymentSummary(order: Order): ProgressSummary {
  if (!isValidMoney(order.totalAmount) || !Number.isFinite(order.paidAmount) || order.paidAmount < 0) {
    return { label: 'Cobro pendiente', chip: 'Pendiente', tone: 'pending', progress: 0 };
  }

  const totalAmount = order.totalAmount;
  const paidAmount = Math.min(order.paidAmount, totalAmount);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const progress = clampProgress(paidAmount / totalAmount);

  if (progress >= 1) {
    return { label: 'Cobro completo', chip: 'Completo', tone: 'done', progress: 1 };
  }

  if (paidAmount > 0) {
    return {
      label: `Cobrado: ${formatARS(paidAmount)} de ${formatARS(totalAmount)} · Resta cobrar: ${formatARS(pendingAmount)}`,
      chip: 'Parcial',
      tone: 'partial',
      progress,
    };
  }

  return {
    label: `Resta cobrar: ${formatARS(totalAmount)}`,
    chip: 'Pendiente',
    tone: 'pending',
    progress: 0,
  };
}

function progressColor(tone: SummaryTone): string {
  if (tone === 'done') return colors.sage;
  if (tone === 'partial') return colors.amberSoft;
  return colors.petalSoft;
}

function SummaryRow({ summary }: { summary: ProgressSummary }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLine}>
        <Text style={styles.summaryText} numberOfLines={2}>
          {summary.label}
        </Text>
        <Chip label={summary.chip} tone={summary.tone} />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${summary.progress * 100}%`, backgroundColor: progressColor(summary.tone) },
          ]}
        />
      </View>
    </View>
  );
}

type Props = {
  order: Order;
  onRegisterDelivery: () => void;
  onRegisterPayment: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  showUnarchive?: boolean;
};

export function OrderCard({ order, onRegisterDelivery, onRegisterPayment, onArchive, onUnarchive, showUnarchive }: Props) {
  const esMaria = order.assignee === CURRENT_USER;
  const deliveryDone = order.deliveryStatus === 'delivered';
  const paymentDone = order.paymentStatus === 'paid';
  const archived = order.archived === true;
  const canArchive = deliveryDone && paymentDone && !archived;
  const delivery = deliverySummary(order);
  const payment = paymentSummary(order);
  const amount = isValidMoney(orderAmount(order)) ? orderAmount(order) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{order.name}</Text>
          <Text style={styles.detail}>{itemsLabel(order)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatARS(amount)}</Text>
          <View style={styles.assignee}>
            <View style={[styles.badge, { backgroundColor: esMaria ? colors.petalBg : colors.sageBg }]}>
              <Text style={[styles.badgeLetter, { color: esMaria ? colors.roseText : colors.sageDeep }]}>
                {esMaria ? 'M' : 'B'}
              </Text>
            </View>
            <Text style={styles.assigneeName}>{order.assignee}</Text>
          </View>
        </View>
      </View>

      <View style={styles.summary}>
        {archived ? (
          <View style={styles.archiveLine}>
            <Chip label="Archivado" tone="done" />
          </View>
        ) : null}
        <SummaryRow summary={delivery} />
        <SummaryRow summary={payment} />
      </View>

      {archived ? (
        showUnarchive && onUnarchive ? (
          <View style={styles.actions}>
            <Pressable onPress={onUnarchive} style={styles.actionBtn}>
              <Text style={styles.actionText}>Desarchivar</Text>
            </Pressable>
          </View>
        ) : null
      ) : (
        <View style={styles.actions}>
          {canArchive && onArchive ? (
            <Pressable onPress={onArchive} style={[styles.actionBtn, styles.archiveBtn]}>
              <Text style={styles.archiveText}>Archivar</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={onRegisterDelivery}
                disabled={deliveryDone}
                style={[styles.actionBtn, deliveryDone && styles.actionDisabled]}
              >
                <Text style={[styles.actionText, deliveryDone && styles.actionTextDisabled]}>
                  {deliveryDone ? 'Entrega completa' : 'Registrar entrega'}
                </Text>
              </Pressable>
              <Pressable
                onPress={onRegisterPayment}
                disabled={paymentDone}
                style={[styles.actionBtn, paymentDone && styles.actionDisabled]}
              >
                <Text style={[styles.actionText, paymentDone && styles.actionTextDisabled]}>
                  {paymentDone ? 'Cobro completo' : 'Registrar cobro'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    ...listCardShadow,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { fontSize: 17, fontFamily: fonts.sansBold, color: colors.ink },
  detail: { fontSize: 14, fontFamily: fonts.sans, color: colors.inkSoft, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 17, fontFamily: fonts.sansExtra, color: colors.ink },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetter: { fontSize: 10.5, fontFamily: fonts.sansExtra },
  assigneeName: { fontSize: 12.5, fontFamily: fonts.sansSemi, color: 'rgba(45,42,40,0.6)' },
  summary: { gap: 8, marginTop: 12 },
  archiveLine: { flexDirection: 'row' },
  summaryRow: { gap: 5 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: fonts.sansSemi, color: colors.inkSoft },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.segment,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(151,165,108,0.45)',
    backgroundColor: colors.sageBgSoft,
  },
  actionDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.segment,
  },
  archiveBtn: {
    backgroundColor: colors.petalBgSoft,
    borderColor: 'rgba(200,83,111,0.28)',
  },
  actionText: { color: colors.sageDeep, fontSize: 12.5, fontFamily: fonts.sansBold },
  archiveText: { color: colors.roseText, fontSize: 12.5, fontFamily: fonts.sansBold },
  actionTextDisabled: { color: colors.inkFaint },
});
