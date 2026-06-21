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
  return order.items
    .map((item) => {
      const kind = item.id === 'chica' ? 'chica' : item.id === 'grande' ? 'grande' : item.name;
      return `${item.quantity} ${item.quantity === 1 ? kind : `${kind}s`}`;
    })
    .join(' · ');
}

function deliveryLabel(order: Order): string {
  if (order.deliveryStatus === 'delivered') return 'Entrega completa';
  if (order.deliveryStatus === 'partial') return 'Entrega parcial';
  return 'Entrega pendiente';
}

function paymentLabel(order: Order): string {
  if (order.paymentStatus === 'paid') return 'Cobro completo';
  if (order.paymentStatus === 'partial') return 'Cobro parcial';
  return 'Cobro pendiente';
}

type Props = {
  order: Order;
  onRegisterDelivery: () => void;
  onRegisterPayment: () => void;
};

export function OrderCard({ order, onRegisterDelivery, onRegisterPayment }: Props) {
  const esMaria = order.assignee === CURRENT_USER;
  const deliveryDone = order.deliveryStatus === 'delivered';
  const paymentDone = order.paymentStatus === 'paid';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{order.name}</Text>
          <Text style={styles.detail}>{itemsLabel(order)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatARS(orderAmount(order))}</Text>
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

      <View style={styles.chips}>
        <Chip
          label={deliveryLabel(order)}
          tone={deliveryDone ? 'done' : 'pending'}
        />
        <Chip
          label={paymentLabel(order)}
          tone={paymentDone ? 'done' : 'pending'}
        />
      </View>

      <View style={styles.actions}>
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
      </View>
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
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
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
  actionText: { color: colors.sageDeep, fontSize: 12.5, fontFamily: fonts.sansBold },
  actionTextDisabled: { color: colors.inkFaint },
});
