import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

// Dark snackbar with an "Deshacer" (undo) action, anchored to the left of the FAB.
export function Toast({ message, onUndo, bottom = 18 }: { message: string; onUndo: () => void; bottom?: number }) {
  return (
    <View style={[styles.toast, { bottom }]}>
      <Text style={styles.msg} numberOfLines={1}>{message}</Text>
      <Pressable onPress={onUndo} hitSlop={8}>
        <Text style={styles.undo}>Deshacer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 88,
    zIndex: 40,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#2D2A28',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  msg: { color: '#fff', fontSize: 13.5, fontFamily: fonts.sansSemi, flex: 1 },
  undo: { color: colors.petal, fontSize: 13.5, fontFamily: fonts.sansExtra },
});
