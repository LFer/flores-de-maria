import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export type Segment<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
};

// Pill segmented control: cream track with a white "thumb" on the active item.
// `sm` matches the Pedidos filter; `md` matches the Nuevo-pedido state toggles.
export function SegmentedControl<T extends string>({ options, value, onChange, size = 'md' }: Props<T>) {
  const sm = size === 'sm';
  return (
    <View style={[styles.track, { borderRadius: sm ? 12 : 14 }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.item,
              { paddingVertical: sm ? 9 : 10, borderRadius: sm ? 9 : 11 },
              active && styles.itemActive,
            ]}
          >
            <Text
              style={[
                { fontSize: sm ? 13.5 : 14 },
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.segment,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.card,
    shadowColor: '#2D2A28',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  labelActive: { color: colors.ink, fontFamily: fonts.sansBold },
  labelInactive: { color: colors.inkSofter, fontFamily: fonts.sansSemi },
});
