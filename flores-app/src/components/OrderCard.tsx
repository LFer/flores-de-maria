import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { listCardShadow } from '../theme/shadows';
import { Chip } from './Chip';
import { orderAmount, type Order } from '../types';
import { formatARS } from '../lib/format';
import { CURRENT_USER } from '../lib/constants';

function cajasLabel(c: number, g: number): string {
  if (c && g) return `${c} ${c === 1 ? 'chica' : 'chicas'} · ${g} ${g === 1 ? 'grande' : 'grandes'}`;
  if (c) return c === 1 ? '1 caja chica' : `${c} cajas chicas`;
  if (g) return g === 1 ? '1 caja grande' : `${g} cajas grandes`;
  return 'Sin cajas';
}

type Props = {
  order: Order;
  onToggleEntrega: () => void;
  onToggleCobro: () => void;
  onMarcarAmbos: () => void;
};

export function OrderCard({ order, onToggleEntrega, onToggleCobro, onMarcarAmbos }: Props) {
  const esMaria = order.assignee === CURRENT_USER;
  const ambosPendientes = !order.entregado && !order.cobrado;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{order.name}</Text>
          <Text style={styles.detail}>{cajasLabel(order.chica, order.grande)}</Text>
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
          label={order.entregado ? 'Entregado' : 'Ingresado'}
          tone={order.entregado ? 'done' : 'pending'}
          onPress={onToggleEntrega}
        />
        <Chip
          label={order.cobrado ? 'Cobrado' : 'Sin cobrar'}
          tone={order.cobrado ? 'done' : 'pending'}
          onPress={onToggleCobro}
        />
      </View>

      {ambosPendientes && (
        <Pressable onPress={onMarcarAmbos} style={styles.markBoth}>
          <Text style={styles.markBothText}>Marcar entregado y cobrado</Text>
        </Pressable>
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
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  markBoth: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(151,165,108,0.55)',
  },
  markBothText: { color: colors.sageDeep, fontSize: 12.5, fontFamily: fonts.sansBold },
});
