import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow, listCardShadow } from '../theme/shadows';
import { Fab } from '../components/Fab';
import { LogoutButton } from '../components/LogoutButton';
import { NuevoGastoSheet } from './NuevoGastoSheet';
import { expenseService } from '../services';
import type { Expense } from '../types';
import { formatARS } from '../lib/format';

export function GastosScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useBottomTabBarHeight();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [receipt, setReceipt] = useState<Expense | null>(null);

  useEffect(() => expenseService.subscribe(setExpenses), []);

  const totalGastos = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.root}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabH + 96 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Gastos</Text>
              <LogoutButton />
            </View>

            <View style={[styles.hero, cardShadow]}>
              <Text style={styles.heroLabel}>Total en insumos</Text>
              <Text style={styles.heroAmount}>{formatARS(totalGastos)}</Text>
              <Text style={styles.heroSub}>Ingredientes y packaging</Text>
            </View>

            <Text style={styles.sectionLabel}>Movimientos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            disabled={!item.comprobanteUrl}
            onPress={() => setReceipt(item)}
            style={[styles.row, listCardShadow]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                {item.comprobanteUrl ? (
                  <Image source={{ uri: item.comprobanteUrl }} style={styles.receiptThumb} />
                ) : (
                  <View style={styles.iconDot} />
                )}
              </View>
              <View style={{ gap: 3 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowDetail}>{item.detail} · {item.date}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              {item.comprobanteUrl ? <Text style={styles.receiptLabel}>Ver foto</Text> : null}
              <Text style={styles.rowAmount}>−{formatARS(item.amount)}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      <Fab onPress={() => setSheetOpen(true)} bottom={tabH + 18} />
      <NuevoGastoSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      <Modal visible={Boolean(receipt)} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReceipt(null)} />
          <View style={styles.viewer}>
            <View style={styles.viewerHeader}>
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={styles.viewerTitle}>{receipt?.name}</Text>
                <Text style={styles.viewerSub}>{receipt ? `${receipt.detail} · ${receipt.date}` : ''}</Text>
              </View>
              <Pressable onPress={() => setReceipt(null)} style={styles.viewerClose} hitSlop={8}>
                <Text style={styles.viewerCloseText}>Cerrar</Text>
              </Pressable>
            </View>
            {receipt?.comprobanteUrl ? (
              <Image source={{ uri: receipt.comprobanteUrl }} style={styles.viewerImage} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
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
  heroAmount: { fontFamily: fonts.serifSemi, fontSize: 46, color: colors.ink, marginTop: 4 },
  heroSub: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter, marginTop: 2 },
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
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.petalBgFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.petalSoft },
  receiptThumb: { width: 34, height: 34, borderRadius: 10 },
  rowName: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.ink },
  rowDetail: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  receiptLabel: { fontSize: 11.5, fontFamily: fonts.sansBold, color: colors.sageDeep },
  rowAmount: { fontSize: 17, fontFamily: fonts.sansExtra, color: colors.roseText },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  viewer: {
    backgroundColor: colors.bg,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  viewerTitle: { fontSize: 17, fontFamily: fonts.sansBold, color: colors.ink },
  viewerSub: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSoft },
  viewerClose: { paddingHorizontal: 12, paddingVertical: 8 },
  viewerCloseText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.rose },
  viewerImage: { width: '100%', height: 420, backgroundColor: colors.card },
});
