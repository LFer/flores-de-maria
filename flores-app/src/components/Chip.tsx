import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

type Tone = 'done' | 'partial' | 'pending';

const TONES: Record<Tone, { bg: string; dot: string; text: string }> = {
  done: { bg: colors.sageBgSoft, dot: colors.sage, text: colors.sageDeep },
  partial: { bg: colors.amberBg, dot: colors.amberSoft, text: colors.amber },
  pending: { bg: colors.petalBgSoft, dot: colors.petalSoft, text: colors.roseText },
};

// Status pill with a leading dot — green when done, amber when partial, rose when pending.
export function Chip({ label, tone, onPress }: { label: string; tone: Tone; onPress?: () => void }) {
  const c = TONES[tone];
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontFamily: fonts.sansBold },
});
