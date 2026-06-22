import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { FlowerLogo } from '../components/Flower';
import { Label, Input, PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';

function friendlyLoginError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Esa combinación de email y contraseña no coincide. Revisala e intentá de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Esperá un momento y probá de nuevo.';
    default: {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Ingresá email y contraseña')) return message;
      return 'No pudimos iniciar sesión. Revisá tus datos e intentá otra vez.';
    }
  }
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(friendlyLoginError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <FlowerLogo size={78} />
          <Text style={styles.brand}>Flores de María</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagLine} />
            <Text style={styles.tag}>Sólo Dios basta</Text>
            <View style={styles.tagLine} />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>Email</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Label>Contraseña</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              rightSlot={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.stone}
                  />
                </Pressable>
              }
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={busy ? 'Ingresando…' : 'Ingresar'} onPress={onSubmit} disabled={busy} style={{ marginTop: 6 }} />
        </View>

        <Pressable style={styles.footer} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerText}>
            ¿No tenés cuenta? <Text style={styles.footerLink}>Crear cuenta</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 34,
    justifyContent: 'space-between',
  },
  logoBlock: { alignItems: 'center' },
  brand: {
    fontFamily: fonts.serifSemi,
    fontSize: 38,
    color: colors.ink,
    letterSpacing: 0.5,
    marginTop: 14,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  tagLine: { width: 22, height: 1, backgroundColor: colors.hairline },
  tag: { fontFamily: fonts.serifMediumItalic, fontSize: 17, color: colors.sage, letterSpacing: 0.5 },
  form: { gap: 18 },
  field: { gap: 8 },
  error: { color: colors.rose, fontFamily: fonts.sansSemi, fontSize: 13 },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, fontFamily: fonts.sans, color: colors.inkSoft },
  footerLink: { color: colors.rose, fontFamily: fonts.sansBold },
});
