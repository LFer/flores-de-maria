import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { FlowerLogo } from '../components/Flower';
import { Label, Input, PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError('Ingresá tu nombre.');
    if (!email.trim()) return setError('Ingresá tu email.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setBusy(true);
    try {
      // On success, the auth listener switches the app to the main tabs.
      await signUp(email.trim(), password, name.trim());
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.logoBlock}>
        <FlowerLogo size={66} />
        <Text style={styles.brand}>Crear cuenta</Text>
        <View style={styles.tagRow}>
          <View style={styles.tagLine} />
          <Text style={styles.tag}>Flores de María</Text>
          <View style={styles.tagLine} />
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Label>Nombre</Label>
          <Input value={name} onChangeText={setName} placeholder="Tu nombre" autoCapitalize="words" autoComplete="name" />
        </View>
        <View style={styles.field}>
          <Label>Email</Label>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        <View style={styles.field}>
          <Label>Contraseña</Label>
          <Input value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry autoComplete="password-new" />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? 'Creando…' : 'Crear cuenta'} onPress={onSubmit} disabled={busy} style={{ marginTop: 6 }} />
      </View>

      <Pressable style={styles.footer} onPress={() => navigation.goBack()}>
        <Text style={styles.footerText}>
          ¿Ya tenés cuenta? <Text style={styles.footerLink}>Iniciar sesión</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 34,
    justifyContent: 'space-between',
  },
  logoBlock: { alignItems: 'center' },
  brand: { fontFamily: fonts.serifSemi, fontSize: 34, color: colors.ink, letterSpacing: 0.5, marginTop: 12 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  tagLine: { width: 22, height: 1, backgroundColor: colors.hairline },
  tag: { fontFamily: fonts.serifMediumItalic, fontSize: 16, color: colors.sage, letterSpacing: 0.5 },
  form: { gap: 16 },
  field: { gap: 8 },
  error: { color: colors.rose, fontFamily: fonts.sansSemi, fontSize: 13 },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, fontFamily: fonts.sans, color: colors.inkSoft },
  footerLink: { color: colors.rose, fontFamily: fonts.sansBold },
});
