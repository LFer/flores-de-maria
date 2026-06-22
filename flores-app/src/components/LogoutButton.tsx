import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { LogoutIcon } from './icons';

export function LogoutButton() {
  const { signOut } = useAuth();

  const onPress = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar la sesión actual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={onPress} style={styles.button}>
      <LogoutIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
