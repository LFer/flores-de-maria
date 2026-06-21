import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { MinusSmall, PlusSmall } from './icons';

type Props = {
  value: number;
  onDec: () => void;
  onInc: () => void;
};

// Cream pill with −/+ round buttons and the count between them.
export function Stepper({ value, onDec, onInc }: Props) {
  return (
    <View style={styles.track}>
      <Pressable onPress={onDec} style={styles.btn} hitSlop={6}>
        <MinusSmall />
      </Pressable>
      <Text style={styles.count}>{value}</Text>
      <Pressable onPress={onInc} style={styles.btn} hitSlop={6}>
        <PlusSmall />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.segment,
    borderRadius: 999,
    padding: 3,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colors.ink,
    minWidth: 22,
    textAlign: 'center',
  },
});
