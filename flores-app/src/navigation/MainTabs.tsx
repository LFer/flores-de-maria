import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/TabBar';
import { PedidosScreen } from '../screens/PedidosScreen';
import { CajaScreen } from '../screens/CajaScreen';
import { GastosScreen } from '../screens/GastosScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Caja" component={CajaScreen} />
      <Tab.Screen name="Gastos" component={GastosScreen} />
    </Tab.Navigator>
  );
}
