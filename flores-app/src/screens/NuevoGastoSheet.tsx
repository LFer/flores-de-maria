import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { BottomSheet } from '../components/BottomSheet';
import { Label, Input, PrimaryButton } from '../components/ui';
import { expenseService } from '../services';
import { shortDate } from '../lib/format';

// Companion sheet for the Gastos FAB. Built in the same visual language as the
// Nuevo-pedido sheet; supports attaching a comprobante image (→ Firebase Storage).
export function NuevoGastoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [monto, setMonto] = useState('');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName('');
    setDetail('');
    setMonto('');
    setComprobante(null);
  };

  const pickComprobante = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setComprobante(res.assets[0].uri);
  };

  const amount = parseInt(monto.replace(/\D/g, ''), 10) || 0;
  const canSave = name.trim().length > 0 && amount > 0 && !busy;

  const onSave = async () => {
    setBusy(true);
    try {
      const comprobanteUrl = comprobante ? await expenseService.uploadComprobante(comprobante) : undefined;
      await expenseService.add({
        name: name.trim(),
        detail: detail.trim() || '—',
        amount,
        date: shortDate(),
        comprobanteUrl,
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
      title="Nuevo gasto"
      footer={<PrimaryButton label={busy ? 'Guardando…' : 'Guardar gasto'} onPress={onSave} disabled={!canSave} />}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Label>Concepto</Label>
          <Input value={name} onChangeText={setName} placeholder="Ej. Leche condensada" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Label hint="(opcional)">Detalle</Label>
            <Input value={detail} onChangeText={setDetail} placeholder="Ej. 6 latas" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Label>Monto</Label>
            <Input value={monto} onChangeText={setMonto} placeholder="$0" keyboardType="number-pad" />
          </View>
        </View>

        <View style={styles.field}>
          <Label hint="(opcional)">Comprobante</Label>
          <Pressable onPress={pickComprobante} style={styles.comprobante}>
            {comprobante ? (
              <Image source={{ uri: comprobante }} style={styles.thumb} />
            ) : (
              <Text style={styles.comprobanteText}>Adjuntar foto del comprobante</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12, gap: 16 },
  field: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  comprobante: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(151,165,108,0.55)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comprobanteText: { fontSize: 14, fontFamily: fonts.sansSemi, color: colors.sageDeep },
  thumb: { width: '100%', height: 160, borderRadius: 12 },
});
