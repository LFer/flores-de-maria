import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow, listCardShadow } from '../theme/shadows';
import { Fab } from '../components/Fab';
import { LogoutButton } from '../components/LogoutButton';
import { SpiritualFlowerModal } from '../components/SpiritualFlowerModal';
import { NuevoMovimientoSheet } from './NuevoMovimientoSheet';
import { cashService } from '../services';
import type { CashMovement, CashMovementType } from '../types';
import type { SpiritualFlower } from '../data/spiritualFlowers';
import { formatARS, shortDate } from '../lib/format';
import { maybeGetDailySpiritualFlower } from '../utils/spiritualFlowers';

const TYPE_LABEL: Record<CashMovementType, string> = {
  order_payment: 'Cobro de pedido',
  expense: 'Gasto',
  parish_delivery: 'Entrega a parroquia',
  adjustment: 'Ajuste',
};

export function CajaScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useBottomTabBarHeight();
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [spiritualFlower, setSpiritualFlower] = useState<SpiritualFlower | null>(null);

  useEffect(() => cashService.listCashMovements(setMovements), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshMovements = await cashService.listCashMovementsOnce();
      setMovements(freshMovements);
    } catch (error) {
      console.error('[CajaScreen] refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const summary = useMemo(() => cashService.getCashSummary(movements), [movements]);

  const tryShowParishDeliveryFlower = useCallback(async () => {
    const flower = await maybeGetDailySpiritualFlower('parish_delivery', 0.5);
    if (flower) setSpiritualFlower(flower);
  }, []);

  return (
    <View style={styles.root}>
      <FlatList
        data={movements}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabH + 96 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.rose}
            colors={[colors.rose]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Caja</Text>
              <LogoutButton />
            </View>

            <View style={[styles.hero, cardShadow]}>
              <Text style={styles.heroLabel}>En caja</Text>
              <Text style={styles.heroAmount}>{formatARS(summary.balance)}</Text>
              <Text style={styles.heroSub}>Ingresos − egresos · para la parroquia</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Ingresos</Text>
                <Text style={[styles.statValue, { color: colors.sageDeep }]}>{formatARS(summary.totalIn)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Egresos</Text>
                <Text style={[styles.statValue, { color: colors.roseText }]}>{formatARS(summary.totalOut)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Movimientos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isIn = item.direction === 'in';
          return (
            <View style={[styles.row, listCardShadow]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isIn ? colors.sageBg : colors.petalBgFaint }]}>
                  <View style={[styles.iconDot, { backgroundColor: isIn ? colors.sage : colors.petalSoft }]} />
                </View>
                <View style={{ gap: 3, flexShrink: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.rowDetail}>{TYPE_LABEL[item.type]} · {shortDate(new Date(item.createdAt))}</Text>
                </View>
              </View>
              <Text style={[styles.rowAmount, { color: isIn ? colors.sageDeep : colors.roseText }]}>
                {isIn ? '+' : '−'}{formatARS(item.amount)}
              </Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      <Fab onPress={() => setSheetOpen(true)} bottom={tabH + 18} />
      <NuevoMovimientoSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onParishDeliveryCreated={() => {
          void tryShowParishDeliveryFlower();
        }}
      />
      <SpiritualFlowerModal flower={spiritualFlower} onClose={() => setSpiritualFlower(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: 22, paddingTop: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: fonts.serifSemi, fontSize: 34, color: colors.ink },
  hero: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  heroLabel: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.olive },
  heroAmount: { fontFamily: fonts.serifSemi, fontSize: 46, color: colors.rose, marginTop: 4 },
  heroSub: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statLabel: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.olive },
  statValue: { fontSize: 21, fontFamily: fonts.sansExtra, marginTop: 4 },
  sectionLabel: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', color: colors.olive, marginTop: 18, marginBottom: 10, marginLeft: 2 },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: { width: 8, height: 8, borderRadius: 4 },
  rowName: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.ink },
  rowDetail: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter },
  rowAmount: { fontSize: 17, fontFamily: fonts.sansExtra },
});
