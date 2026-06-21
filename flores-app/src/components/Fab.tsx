import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { roseGlow } from '../theme/shadows';
import { PlusIcon } from './icons';

// Floating round "+" action button. `bottom` lets the screen clear the tab bar.
export function Fab({ onPress, bottom = 18 }: { onPress: () => void; bottom?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, { bottom }, pressed && { opacity: 0.9 }]}>
      <PlusIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    ...roseGlow,
  },
});
