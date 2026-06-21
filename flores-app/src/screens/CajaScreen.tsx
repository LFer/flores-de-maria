import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow, listCardShadow } from '../theme/shadows';
import { cashService, expenseService } from '../services';
import type { Income, Expense } from '../types';
import { formatARS } from '../lib/format';

export function CajaScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useBottomTabBarHeight();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => cashService.subscribeIncomes(setIncomes), []);
  useEffect(() => expenseService.subscribe(setExpenses), []);

  const totalIngresos = incomes.reduce((s, i) => s + i.amount, 0);
  const totalGastos = expenses.reduce((s, e) => s + e.amount, 0);
  const enCaja = totalIngresos - totalGastos;

  return (
    <View style={styles.root}>
      <FlatList
        data={incomes}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabH + 24 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 8 }}>
            <Text style={styles.title}>Caja</Text>

            <View style={[styles.hero, cardShadow]}>
              <Text style={styles.heroLabel}>En caja</Text>
              <Text style={styles.heroAmount}>{formatARS(enCaja)}</Text>
              <Text style={styles.heroSub}>Ingresos − gastos · para la parroquia</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Ingresos</Text>
                <Text style={[styles.statValue, { color: colors.sageDeep }]}>{formatARS(totalIngresos)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Gastos</Text>
                <Text style={[styles.statValue, { color: colors.roseText }]}>{formatARS(totalGastos)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Cobros recientes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, listCardShadow]}>
            <View style={{ gap: 3 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowDetail}>{item.detail} · {item.date}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: colors.sageDeep }]}>+{formatARS(item.amount)}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: 22, paddingTop: 0 },
  title: { fontFamily: fonts.serifSemi, fontSize: 34, color: colors.ink, marginBottom: 16 },
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
  },
  rowName: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.ink },
  rowDetail: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter },
  rowAmount: { fontSize: 17, fontFamily: fonts.sansExtra },
});
