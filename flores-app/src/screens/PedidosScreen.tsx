import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import { FlowerMark } from '../components/Flower';
import { SegmentedControl } from '../components/SegmentedControl';
import { OrderCard } from '../components/OrderCard';
import { Fab } from '../components/Fab';
import { LogoutButton } from '../components/LogoutButton';
import { NuevoPedidoSheet } from './NuevoPedidoSheet';
import { BottomSheet } from '../components/BottomSheet';
import { PrimaryButton } from '../components/ui';
import { Stepper } from '../components/Stepper';
import { orderService } from '../services';
import type { Order } from '../types';
import { formatARS } from '../lib/format';
import { useAuth } from '../lib/auth';
import { sameUserName, userDisplayName } from '../lib/userDisplay';

type Filter = 'todos' | 'mios';
type QuickFilter = 'activos' | 'entrega' | 'cobro' | 'archivados';

const paymentBalance = (order: Order): number => Math.max(0, order.totalAmount - order.paidAmount);

const QUICK_FILTERS: { label: string; value: QuickFilter }[] = [
  { label: 'Activos', value: 'activos' },
  { label: 'Entrega', value: 'entrega' },
  { label: 'Cobro', value: 'cobro' },
  { label: 'Archivo', value: 'archivados' },
];

function matchesQuickFilter(order: Order, quickFilter: QuickFilter): boolean {
  const archived = order.archived === true;
  if (quickFilter === 'archivados') return archived;
  if (archived) return false;
  if (quickFilter === 'entrega') return order.deliveryStatus !== 'delivered';
  if (quickFilter === 'cobro') return order.paymentStatus !== 'paid';
  return true;
}

function emptyMessage(quickFilter: QuickFilter): string {
  if (quickFilter === 'entrega') return 'No hay pedidos pendientes de entregar.';
  if (quickFilter === 'cobro') return 'No hay pedidos pendientes de cobrar.';
  if (quickFilter === 'archivados') return 'No hay pedidos archivados.';
  return 'No hay pedidos activos.';
}

export function PedidosScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useBottomTabBarHeight();
  const { user } = useAuth();
  const currentUserName = userDisplayName(user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('activos');
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliverySheetOpen, setDeliverySheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => orderService.subscribe(setOrders), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshOrders = await orderService.listOnce();
      setOrders(freshOrders);
    } catch (error) {
      console.error('[PedidosScreen] refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openDelivery = (order: Order) => {
    setSelectedOrder(order);
    setDeliverySheetOpen(true);
  };

  const openPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentSheetOpen(true);
  };

  const confirmArchive = (order: Order) => {
    Alert.alert('Archivar pedido', 'Este pedido ya está entregado y cobrado. ¿Querés archivarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        style: 'destructive',
        onPress: () => {
          void orderService.archive(order.id).catch(() => {
            Alert.alert('No se pudo archivar', 'El pedido no se pudo archivar. Probá nuevamente.');
          });
        },
      },
    ]);
  };

  const unarchive = (order: Order) => {
    void orderService.unarchive(order.id).catch(() => {
      Alert.alert('No se pudo desarchivar', 'El pedido no se pudo desarchivar. Probá nuevamente.');
    });
  };

  const ownerFilteredOrders = filter === 'mios' ? orders.filter((order) => sameUserName(order.assignee, currentUserName)) : orders;
  const filteredOrders = ownerFilteredOrders.filter((order) => matchesQuickFilter(order, quickFilter));
  const pendingPaymentOrders = filteredOrders.filter((order) => paymentBalance(order) > 0);
  const totalPendiente = pendingPaymentOrders.reduce((sum, order) => sum + paymentBalance(order), 0);

  return (
    <View style={styles.root}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(order) => order.id}
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
            <Text style={styles.greeting}>Hola, {currentUserName}</Text>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <FlowerMark size={22} />
                <Text style={styles.title}>Pedidos</Text>
              </View>
              <LogoutButton />
            </View>

            <View style={[styles.summary, cardShadow]}>
              <View style={{ gap: 3 }}>
                <Text style={styles.summaryLabel}>Pendiente de cobro</Text>
                <Text style={styles.summarySub}>{pendingPaymentOrders.length} de {filteredOrders.length} pedidos con saldo</Text>
              </View>
              <Text style={styles.summaryAmount}>{formatARS(totalPendiente)}</Text>
            </View>

            <View style={styles.ownerFilter}>
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

            <View style={styles.quickFilters}>
              {QUICK_FILTERS.map((option) => {
                const active = option.value === quickFilter;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setQuickFilter(option.value)}
                    style={[styles.quickChip, active && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage(quickFilter)}</Text>}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onRegisterDelivery={() => openDelivery(item)}
            onRegisterPayment={() => openPayment(item)}
            onArchive={() => confirmArchive(item)}
            onUnarchive={() => unarchive(item)}
            showUnarchive={quickFilter === 'archivados'}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <Fab onPress={() => setNewOrderOpen(true)} bottom={tabH + 18} />
      <NuevoPedidoSheet visible={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
      <DeliverySheet
        order={selectedOrder}
        visible={deliverySheetOpen}
        onClose={() => setDeliverySheetOpen(false)}
      />
      <PaymentSheet
        order={selectedOrder}
        visible={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
      />
    </View>
  );
}

function DeliverySheet({ order, visible, onClose }: { order: Order | null; visible: boolean; onClose: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible || !order) return;
    setQuantities(Object.fromEntries(order.items.map((item) => [item.id, 0])));
    setError(null);
    setBusy(false);
  }, [visible, order]);

  if (!order) return null;

  const totalNow = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  const hasPending = order.items.some((item) => item.quantity - item.deliveredQuantity > 0);

  const setItemQuantity = (itemId: string, next: number) => {
    const item = order.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const pending = item.quantity - item.deliveredQuantity;
    setQuantities((current) => ({ ...current, [itemId]: Math.min(pending, Math.max(0, next)) }));
  };

  const onConfirm = async () => {
    if (!hasPending) {
      setError('Este pedido ya está entregado completo.');
      return;
    }
    if (totalNow <= 0) {
      setError('Indicá al menos una caja para entregar.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await orderService.registerDelivery(
        order.id,
        order.items.map((item) => ({ itemId: item.id, quantity: quantities[item.id] ?? 0 })),
      );
      onClose();
    } catch {
      setError('No pudimos registrar la entrega. Revisá las cantidades.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Registrar entrega"
      footer={<PrimaryButton label={busy ? 'Guardando...' : 'Confirmar entrega'} onPress={onConfirm} disabled={busy} />}
    >
      <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetClient}>{order.name}</Text>
          <Text style={styles.sheetSub}>{order.entrega ? `Entrega ${order.entrega}` : 'Sin fecha de entrega'}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {order.items.map((item) => {
            const pending = item.quantity - item.deliveredQuantity;
            const value = quantities[item.id] ?? 0;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    Pedido {item.quantity} · Entregado {item.deliveredQuantity} · Pendiente {pending}
                  </Text>
                </View>
                <Stepper
                  value={value}
                  onDec={() => setItemQuantity(item.id, value - 1)}
                  onInc={() => setItemQuantity(item.id, value + 1)}
                />
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </BottomSheet>
  );
}

function PaymentSheet({ order, visible, onClose }: { order: Order | null; visible: boolean; onClose: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible || !order) return;
    setQuantities(Object.fromEntries(order.items.map((item) => [item.id, 0])));
    setError(null);
    setBusy(false);
  }, [visible, order]);

  if (!order) return null;

  const balance = paymentBalance(order);
  const hasPending = order.items.some((item) => item.quantity - (item.paidQuantity ?? 0) > 0);
  const amountNow = order.items.reduce((sum, item) => sum + (quantities[item.id] ?? 0) * item.unitPrice, 0);

  const setItemQuantity = (itemId: string, next: number) => {
    const item = order.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const pending = item.quantity - (item.paidQuantity ?? 0);
    setQuantities((current) => ({ ...current, [itemId]: Math.min(pending, Math.max(0, next)) }));
  };

  const onConfirm = async () => {
    if (balance <= 0 || !hasPending) {
      setError('Este pedido ya está cobrado completo.');
      return;
    }
    if (amountNow <= 0) {
      setError('Indicá al menos una caja para cobrar.');
      return;
    }
    if (amountNow > balance) {
      setError('El cobro no puede superar el saldo pendiente.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await orderService.registerPayment(
        order.id,
        order.items.map((item) => ({ itemId: item.id, quantity: quantities[item.id] ?? 0 })),
      );
      onClose();
    } catch {
      setError('No pudimos registrar el cobro. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Registrar cobro"
      footer={<PrimaryButton label={busy ? 'Guardando...' : 'Confirmar cobro'} onPress={onConfirm} disabled={busy} />}
    >
      <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetClient}>{order.name}</Text>
          <Text style={styles.sheetSub}>Total {formatARS(order.totalAmount)}</Text>
        </View>

        <View style={styles.paymentSummary}>
          <AmountCell label="Pagado" value={formatARS(order.paidAmount)} />
          <AmountCell label="Saldo" value={formatARS(balance)} emphasized />
        </View>

        <View style={{ gap: 10 }}>
          {order.items.map((item) => {
            const pending = item.quantity - (item.paidQuantity ?? 0);
            const value = quantities[item.id] ?? 0;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    Pedido {item.quantity} · Cobrado {item.paidQuantity ?? 0} · Pendiente {pending}
                  </Text>
                </View>
                <Stepper
                  value={value}
                  onDec={() => setItemQuantity(item.id, value - 1)}
                  onInc={() => setItemQuantity(item.id, value + 1)}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a cobrar ahora</Text>
          <Text style={styles.totalValue}>{formatARS(amountNow)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </BottomSheet>
  );
}

function AmountCell({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <View style={styles.amountCell}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, emphasized && { color: colors.rose }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: 18, paddingTop: 0 },
  greeting: {
    marginLeft: 4,
    marginBottom: 8,
    fontSize: 15,
    fontFamily: fonts.sansSemi,
    color: colors.inkSoft,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
    gap: 12,
  },
  summaryLabel: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', color: colors.olive },
  summarySub: { fontSize: 13, fontFamily: fonts.sans, color: colors.inkSofter },
  summaryAmount: { fontFamily: fonts.serifSemi, fontSize: 30, color: colors.rose },
  ownerFilter: { marginTop: 12 },
  quickFilters: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    marginBottom: 2,
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  quickChipActive: {
    backgroundColor: colors.petalBgSoft,
    borderColor: 'rgba(200,83,111,0.24)',
  },
  quickChipText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.inkSoft },
  quickChipTextActive: { color: colors.roseText },
  empty: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.sansSemi,
    color: colors.inkSoft,
  },
  sheetBody: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12, gap: 16 },
  sheetHeader: { gap: 3 },
  sheetClient: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  sheetSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    paddingLeft: 16,
    paddingRight: 14,
  },
  itemName: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.ink },
  itemMeta: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.inkSoft },
  paymentSummary: { flexDirection: 'row', gap: 10 },
  amountCell: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 4,
  },
  amountLabel: { fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', color: colors.olive },
  amountValue: { fontSize: 20, fontFamily: fonts.sansExtra, color: colors.ink },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  totalLabel: { fontSize: 13, fontFamily: fonts.sansSemi, color: colors.inkSoft },
  totalValue: { fontSize: 18, fontFamily: fonts.sansExtra, color: colors.rose },
  error: { color: colors.rose, fontFamily: fonts.sansSemi, fontSize: 13 },
});
