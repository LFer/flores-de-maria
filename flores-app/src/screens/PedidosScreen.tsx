import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import { FlowerMark } from '../components/Flower';
import { SegmentedControl } from '../components/SegmentedControl';
import { OrderCard } from '../components/OrderCard';
import { Fab } from '../components/Fab';
import { Toast } from '../components/Toast';
import { NuevoPedidoSheet } from './NuevoPedidoSheet';
import { orderService } from '../services';
import { orderAmount, type Order } from '../types';
import { formatARS } from '../lib/format';
import { CURRENT_USER } from '../lib/constants';

type Filter = 'todos' | 'mios';
type ToastState = { message: string; revert: () => void } | null;

export function PedidosScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useBottomTabBarHeight();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [toast, setToast] = useState<ToastState>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => orderService.subscribe(setOrders), []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const flashToast = (message: string, revert: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, revert });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const setField = (id: string, field: 'entregado' | 'cobrado', value: boolean) =>
    field === 'entregado' ? orderService.setEntrega(id, value) : orderService.setCobro(id, value);

  const toggleField = (o: Order, field: 'entregado' | 'cobrado') => {
    const next = !o[field];
    setField(o.id, field, next);
    flashToast(field === 'entregado' ? 'Entrega actualizada' : 'Cobro actualizado', () =>
      setField(o.id, field, !next),
    );
  };

  const marcarAmbos = (o: Order) => {
    const prev = { entregado: o.entregado, cobrado: o.cobrado };
    orderService.setEntrega(o.id, true);
    orderService.setCobro(o.id, true);
    flashToast('Entregado y cobrado', () => {
      orderService.setEntrega(o.id, prev.entregado);
      orderService.setCobro(o.id, prev.cobrado);
    });
  };

  const undo = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toast?.revert();
    setToast(null);
  };

  const pendientes = orders.filter((o) => !o.cobrado);
  const totalPendiente = pendientes.reduce((s, o) => s + orderAmount(o), 0);
  const visible = filter === 'mios' ? orders.filter((o) => o.assignee === CURRENT_USER) : orders;

  return (
    <View style={styles.root}>
      <FlatList
        data={visible}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabH + 96 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.titleRow}>
              <FlowerMark size={22} />
              <Text style={styles.title}>Pedidos</Text>
            </View>

            <View style={[styles.summary, cardShadow]}>
              <View style={{ gap: 3 }}>
                <Text style={styles.summaryLabel}>Pendiente de cobro</Text>
                <Text style={styles.summarySub}>{pendientes.length} pedidos sin cobrar</Text>
              </View>
              <Text style={styles.summaryAmount}>{formatARS(totalPendiente)}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <SegmentedControl
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { label: 'Todos', value: 'todos' },
                  { label: 'Mis pedidos', value: 'mios' },
                ]}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onToggleEntrega={() => toggleField(item, 'entregado')}
            onToggleCobro={() => toggleField(item, 'cobrado')}
            onMarcarAmbos={() => marcarAmbos(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {toast && <Toast message={toast.message} onUndo={undo} bottom={tabH + 16} />}
      <Fab onPress={() => setSheetOpen(true)} bottom={tabH + 18} />
      <NuevoPedidoSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: 18, paddingTop: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingBottom: 2 },
  title: { fontFamily: fonts.serifSemi, fontSize: 34, color: colors.ink, letterSpacing: 0.4 },
  summary: {
    marginTop: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', color: colors.olive },
  summarySub: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter },
  summaryAmount: { fontFamily: fonts.serifSemi, fontSize: 30, color: colors.rose },
});
