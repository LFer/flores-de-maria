import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

type Tone = 'done' | 'pending';

// Status pill with a leading dot — green when done, rose when pending.
export function Chip({ label, tone, onPress }: { label: string; tone: Tone; onPress?: () => void }) {
  const done = tone === 'done';
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: done ? colors.sageBgSoft : colors.petalBgSoft }]}>
      <View style={[styles.dot, { backgroundColor: done ? colors.sage : colors.petalSoft }]} />
      <Text style={[styles.label, { color: done ? colors.sageDeep : colors.roseText }]}>{label}</Text>
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
