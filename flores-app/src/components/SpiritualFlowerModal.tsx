import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowerMark } from './Flower';
import { PrimaryButton } from './ui';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import type { SpiritualFlower } from '../data/spiritualFlowers';

type ModalFlower = Pick<SpiritualFlower, 'text'> &
  Partial<Pick<SpiritualFlower, 'is_exact' | 'display_author' | 'source' | 'reference'>>;

type Props = {
  flower: ModalFlower | null;
  onClose: () => void;
  title?: string;
};

function exactAttribution(flower: ModalFlower): string | null {
  if (!flower.is_exact) return null;

  const details = [flower.source, flower.reference].filter(Boolean).join(', ');
  if (flower.display_author && details) return `${flower.display_author} · ${details}`;
  return flower.display_author || details || null;
}

export function SpiritualFlowerModal({ flower, onClose, title = 'Florecita' }: Props) {
  const insets = useSafeAreaInsets();
  const attribution = flower ? exactAttribution(flower) : null;

  return (
    <Modal visible={Boolean(flower)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {flower ? (
          <View style={[styles.card, cardShadow, { marginBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.mark}>
              <FlowerMark size={28} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{flower.text}</Text>
            {attribution ? <Text style={styles.attribution}>{attribution}</Text> : null}
            <PrimaryButton label="Cerrar" onPress={onClose} style={styles.button} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
  },
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.petalBgSoft,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.serifSemi,
    fontSize: 30,
    color: colors.ink,
  },
  text: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.serifSemi,
    fontSize: 24,
    lineHeight: 31,
    color: colors.ink,
  },
  attribution: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 22,
  },
});
