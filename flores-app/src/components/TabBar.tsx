import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { TabPedidos, TabCaja, TabGastos } from './icons';

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  Pedidos: (a) => <TabPedidos color={a ? colors.rose : colors.mutedTab} />,
  Caja: (a) => <TabCaja color={a ? colors.rose : colors.mutedTab} />,
  Gastos: (a) => <TabGastos color={a ? colors.rose : colors.mutedTab} />,
};

// Custom bottom tab bar matching the design (3 evenly spaced items).
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            {ICONS[route.name]?.(active)}
            <Text style={[styles.label, { color: active ? colors.rose : colors.mutedTab, fontFamily: active ? fonts.sansBold : fonts.sansSemi }]}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,42,40,0.07)',
    paddingTop: 11,
    paddingHorizontal: 28,
  },
  item: { flex: 1, alignItems: 'center', gap: 5 },
  label: { fontSize: 11 },
});
