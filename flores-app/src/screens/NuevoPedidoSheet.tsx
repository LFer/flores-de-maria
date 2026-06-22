import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { BottomSheet } from '../components/BottomSheet';
import { Label, Input, PrimaryButton } from '../components/ui';
import { Stepper } from '../components/Stepper';
import { SegmentedControl } from '../components/SegmentedControl';
import { DateField } from '../components/DateField';
import { orderService } from '../services';
import { PRICE, type Order } from '../types';
import { shortDate } from '../lib/format';
import { useAuth } from '../lib/auth';
import { userDisplayName } from '../lib/userDisplay';

type EntregaState = 'ingresado' | 'entregado';
type CobroState = 'sin' | 'cobrado';

const suggestedAmount = (chica: number, grande: number) => chica * PRICE.chica + grande * PRICE.grande;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parseEntregaDate(entrega: string | undefined): Date {
  if (!entrega) return new Date();

  const match = entrega.trim().toLocaleLowerCase().match(/^(\d{1,2})\s+([a-záéíóúñ]{3})$/i);
  if (!match) return new Date();

  const day = Number(match[1]);
  const month = MONTHS.indexOf(match[2]);
  if (!Number.isInteger(day) || month < 0) return new Date();

  const year = new Date().getFullYear();
  const parsed = new Date(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return new Date();

  return parsed;
}

function orderItemQuantity(order: Order, itemId: 'chica' | 'grande'): number {
  const item = order.items.find((candidate) => candidate.id === itemId);
  return item && Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
}

export function NuevoPedidoSheet({
  visible,
  onClose,
  order,
  onOrderCreated,
}: {
  visible: boolean;
  onClose: () => void;
  order?: Order | null;
  onOrderCreated?: () => void;
}) {
  const { user } = useAuth();
  const currentUserName = userDisplayName(user);
  const editing = Boolean(order);
  const [cliente, setCliente] = useState('');
  const [chica, setChica] = useState(1);
  const [grande, setGrande] = useState(1);
  const [importe, setImporte] = useState(String(suggestedAmount(1, 1)));
  const [fecha, setFecha] = useState(() => new Date());
  const [entrega, setEntrega] = useState<EntregaState>('ingresado');
  const [cobro, setCobro] = useState<CobroState>('sin');
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const skipQuantityRecalc = useRef(false);

  // Changing the box quantities always recalculates the suggested importe,
  // overwriting whatever value is currently in the field.
  useEffect(() => {
    if (skipQuantityRecalc.current) {
      skipQuantityRecalc.current = false;
      return;
    }
    setImporte(String(suggestedAmount(chica, grande)));
  }, [chica, grande]);

  useEffect(() => {
    if (!visible) return;

    if (order) {
      const nextChica = orderItemQuantity(order, 'chica');
      const nextGrande = orderItemQuantity(order, 'grande');
      skipQuantityRecalc.current = nextChica !== chica || nextGrande !== grande;
      setCliente(order.name);
      setChica(nextChica);
      setGrande(nextGrande);
      setImporte(String(order.totalAmount));
      setFecha(parseEntregaDate(order.entrega));
      setEntrega('ingresado');
      setCobro('sin');
      setNota(order.nota ?? '');
      setError(null);
      setBusy(false);
      return;
    }

    reset();
  }, [visible, order]);

  const reset = () => {
    skipQuantityRecalc.current = false;
    setCliente('');
    setChica(1);
    setGrande(1);
    setImporte(String(suggestedAmount(1, 1)));
    setFecha(new Date());
    setEntrega('ingresado');
    setCobro('sin');
    setNota('');
    setError(null);
    setBusy(false);
  };

  const onSave = async () => {
    const amount = parseInt(importe, 10);
    if (chica + grande <= 0) {
      setError('Agregá al menos una caja al pedido.');
      return;
    }
    if (importe.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      setError('Ingresá un importe válido (mayor o igual a 0).');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let createdOrder = false;
      if (order) {
        await orderService.updateEditableOrder(order.id, {
          name: cliente.trim() || 'Sin nombre',
          chica,
          grande,
          entrega: shortDate(fecha),
          nota: nota.trim() || undefined,
          amount,
        });
      } else {
        await orderService.add({
          name: cliente.trim() || 'Sin nombre',
          chica,
          grande,
          assignee: currentUserName,
          entregado: entrega === 'entregado',
          cobrado: cobro === 'cobrado',
          entrega: shortDate(fecha),
          nota: nota.trim() || undefined,
          amount,
        });
        createdOrder = true;
      }
      // Only clear and close when the save succeeded.
      reset();
      onClose();
      if (createdOrder) onOrderCreated?.();
    } catch {
      setError(
        order
          ? 'Este pedido ya tiene entregas o cobros registrados y no se puede editar.'
          : 'No pudimos guardar el pedido. Probá de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Editar pedido' : 'Nuevo pedido'}
      footer={<PrimaryButton label={busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar pedido'} onPress={onSave} disabled={busy} />}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Label>Cliente</Label>
          <Input value={cliente} onChangeText={setCliente} placeholder="Ej. Susana" />
        </View>

        <View style={styles.field}>
          <Label>Cajas</Label>
          <View style={{ gap: 10 }}>
            <CajaRow title="Caja Chica (16 brigadeiros)" value={chica} onDec={() => setChica((n) => Math.max(0, n - 1))} onInc={() => setChica((n) => Math.min(99, n + 1))} />
            <CajaRow title="Caja Grande (30 brigadeiros)" value={grande} onDec={() => setGrande((n) => Math.max(0, n - 1))} onInc={() => setGrande((n) => Math.min(99, n + 1))} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Label>Importe</Label>
            <Input
              value={importe}
              onChangeText={(t) => setImporte(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              returnKeyType="done"
              placeholder="$0"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Label>Entrega</Label>
            <DateField value={fecha} onChange={setFecha} />
          </View>
        </View>

        {!editing ? (
          <>
            <View style={styles.field}>
              <Label>Estado de entrega</Label>
              <SegmentedControl
                value={entrega}
                onChange={setEntrega}
                options={[
                  { label: 'Ingresado', value: 'ingresado' },
                  { label: 'Entregado', value: 'entregado' },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Label>Estado de cobro</Label>
              <SegmentedControl
                value={cobro}
                onChange={setCobro}
                options={[
                  { label: 'Sin cobrar', value: 'sin' },
                  { label: 'Cobrado', value: 'cobrado' },
                ]}
              />
            </View>
          </>
        ) : null}

        <View style={styles.field}>
          <Label hint="(opcional)">Nota</Label>
          <Input value={nota} onChangeText={setNota} placeholder="Ej. Retira en la parroquia" />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </BottomSheet>
  );
}

function CajaRow({ title, value, onDec, onInc }: { title: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <View style={styles.cajaRow}>
      <Text style={styles.cajaTitle}>{title}</Text>
      <Stepper value={value} onDec={onDec} onInc={onInc} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 36, gap: 16 },
  field: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  error: { color: colors.rose, fontFamily: fonts.sansSemi, fontSize: 13 },
  cajaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    paddingLeft: 16,
    paddingRight: 14,
  },
  cajaTitle: { flex: 1, fontSize: 15, fontFamily: fonts.sansBold, color: colors.ink },
});
