import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { Label, Input, PrimaryButton } from '../components/ui';
import { SegmentedControl } from '../components/SegmentedControl';
import { cashService } from '../services';

type Tipo = 'parish_delivery' | 'adjustment';
type Dir = 'in' | 'out';

// Registers the two cash movements that don't originate from another screen:
// entregas de dinero a la parroquia y ajustes manuales.
export function NuevoMovimientoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [tipo, setTipo] = useState<Tipo>('parish_delivery');
  const [direction, setDirection] = useState<Dir>('in');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [busy, setBusy] = useState(false);

  const amount = parseInt(monto.replace(/\D/g, ''), 10) || 0;
  const canSave = amount > 0 && !busy;

  const reset = () => {
    setTipo('parish_delivery');
    setDirection('in');
    setMonto('');
    setDescripcion('');
    setResponsable('');
  };

  const onSave = async () => {
    setBusy(true);
    try {
      if (tipo === 'parish_delivery') {
        await cashService.createParishDeliveryMovement({
          amount,
          description: descripcion.trim() || 'Entrega a la parroquia',
          responsibleName: responsable.trim() || undefined,
        });
      } else {
        await cashService.createAdjustmentMovement({
          direction,
          amount,
          description: descripcion.trim() || 'Ajuste de caja',
        });
      }
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
      title="Nuevo movimiento"
      footer={<PrimaryButton label={busy ? 'Guardando…' : 'Guardar movimiento'} onPress={onSave} disabled={!canSave} />}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Label>Tipo</Label>
          <SegmentedControl
            value={tipo}
            onChange={setTipo}
            options={[
              { label: 'Entrega parroquia', value: 'parish_delivery' },
              { label: 'Ajuste', value: 'adjustment' },
            ]}
          />
        </View>

        {tipo === 'adjustment' && (
          <View style={styles.field}>
            <Label>Dirección</Label>
            <SegmentedControl
              value={direction}
              onChange={setDirection}
              options={[
                { label: 'Ingreso', value: 'in' },
                { label: 'Egreso', value: 'out' },
              ]}
            />
          </View>
        )}

        <View style={styles.field}>
          <Label>Monto</Label>
          <Input value={monto} onChangeText={setMonto} placeholder="$0" keyboardType="number-pad" />
        </View>

        <View style={styles.field}>
          <Label hint="(opcional)">Descripción</Label>
          <Input
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder={tipo === 'parish_delivery' ? 'Ej. Entrega mensual' : 'Ej. Corrección de conteo'}
          />
        </View>

        {tipo === 'parish_delivery' && (
          <View style={styles.field}>
            <Label hint="(opcional)">Responsable</Label>
            <Input value={responsable} onChangeText={setResponsable} placeholder="Ej. María" />
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12, gap: 16 },
  field: { gap: 8 },
});
