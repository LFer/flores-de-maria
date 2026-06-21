import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { BottomSheet } from '../components/BottomSheet';
import { Label, Input, PrimaryButton } from '../components/ui';
import { Stepper } from '../components/Stepper';
import { SegmentedControl } from '../components/SegmentedControl';
import { DateField } from '../components/DateField';
import { orderService } from '../services';
import { PRICE } from '../types';
import { shortDate } from '../lib/format';

type EntregaState = 'ingresado' | 'entregado';
type CobroState = 'sin' | 'cobrado';

const suggestedAmount = (chica: number, grande: number) => chica * PRICE.chica + grande * PRICE.grande;

export function NuevoPedidoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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

  // Changing the box quantities always recalculates the suggested importe,
  // overwriting whatever value is currently in the field.
  useEffect(() => {
    setImporte(String(suggestedAmount(chica, grande)));
  }, [chica, grande]);

  // Clear any stale error when the sheet is reopened.
  useEffect(() => {
    if (visible) setError(null);
  }, [visible]);

  const reset = () => {
    setCliente('');
    setChica(1);
    setGrande(1);
    setImporte(String(suggestedAmount(1, 1)));
    setFecha(new Date());
    setEntrega('ingresado');
    setCobro('sin');
    setNota('');
    setError(null);
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
      await orderService.add({
        name: cliente.trim() || 'Sin nombre',
        chica,
        grande,
        assignee: 'María',
        entregado: entrega === 'entregado',
        cobrado: cobro === 'cobrado',
        entrega: shortDate(fecha),
        nota: nota.trim() || undefined,
        amount,
      });
      // Only clear and close when the save succeeded.
      reset();
      onClose();
    } catch {
      setError('No pudimos guardar el pedido. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Nuevo pedido"
      footer={<PrimaryButton label={busy ? 'Guardando…' : 'Guardar pedido'} onPress={onSave} disabled={busy} />}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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
              placeholder="$0"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Label>Entrega</Label>
            <DateField value={fecha} onChange={setFecha} />
          </View>
        </View>

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
  body: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12, gap: 16 },
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
