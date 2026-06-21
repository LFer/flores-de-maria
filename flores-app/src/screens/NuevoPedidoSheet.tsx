import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { BottomSheet } from '../components/BottomSheet';
import { Label, Input, FieldBox, PrimaryButton } from '../components/ui';
import { Stepper } from '../components/Stepper';
import { SegmentedControl } from '../components/SegmentedControl';
import { CalendarIcon } from '../components/icons';
import { orderService } from '../services';
import { PRICE } from '../types';
import { formatARS, shortDate } from '../lib/format';

type EntregaState = 'ingresado' | 'entregado';
type CobroState = 'sin' | 'cobrado';

export function NuevoPedidoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [cliente, setCliente] = useState('');
  const [chica, setChica] = useState(1);
  const [grande, setGrande] = useState(1);
  const [entrega, setEntrega] = useState<EntregaState>('ingresado');
  const [cobro, setCobro] = useState<CobroState>('sin');
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState(false);

  const monto = useMemo(() => formatARS(chica * PRICE.chica + grande * PRICE.grande), [chica, grande]);
  const fecha = useMemo(() => shortDate(), []);

  const reset = () => {
    setCliente('');
    setChica(1);
    setGrande(1);
    setEntrega('ingresado');
    setCobro('sin');
    setNota('');
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await orderService.add({
        name: cliente.trim() || 'Sin nombre',
        chica,
        grande,
        assignee: 'María',
        entregado: entrega === 'entregado',
        cobrado: cobro === 'cobrado',
        entrega: fecha,
        nota: nota.trim() || undefined,
      });
      reset();
      onClose();
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
            <Label>Monto sugerido</Label>
            <FieldBox>
              <Text style={styles.montoText}>{monto}</Text>
            </FieldBox>
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Label>Entrega</Label>
            <FieldBox>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{fecha}</Text>
                <CalendarIcon />
              </View>
            </FieldBox>
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
  montoText: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.ink },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 16, fontFamily: fonts.sans, color: colors.ink },
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
