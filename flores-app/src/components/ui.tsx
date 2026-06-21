import React from 'react';
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { roseGlow } from '../theme/shadows';

// Uppercase olive field label.
export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <Text style={styles.label}>
      {children}
      {hint ? <Text style={styles.labelHint}>  {hint}</Text> : null}
    </Text>
  );
}

// White rounded input matching the form fields in the design. Pass `rightSlot`
// to render a trailing element (e.g. a show/hide-password button or an icon).
export function Input({ rightSlot, ...props }: TextInputProps & { rightSlot?: React.ReactNode }) {
  if (rightSlot) {
    return (
      <View style={[styles.box, styles.boxRow]}>
        <TextInput
          placeholderTextColor={colors.inkFaint}
          {...props}
          style={[styles.inputText, { flex: 1 }, props.style]}
        />
        {rightSlot}
      </View>
    );
  }
  return (
    <TextInput
      placeholderTextColor={colors.inkFaint}
      {...props}
      style={[styles.box, styles.inputText, props.style]}
    />
  );
}

// Read-only white field box (e.g. a display-only value).
export function FieldBox({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.box, styles.fieldBox, style]}>{children}</View>;
}

// Rose pill CTA with pink glow.
export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, roseGlow, disabled && { opacity: 0.5 }, pressed && { opacity: 0.92 }, style]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11.5,
    fontFamily: fonts.sansBold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.olive,
  },
  labelHint: {
    textTransform: 'none',
    letterSpacing: 0,
    fontFamily: fonts.sansMed,
    color: colors.inkFaint,
  },
  box: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  boxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputText: {
    fontSize: 16,
    fontFamily: fonts.sans,
    color: colors.ink,
  },
  fieldBox: { justifyContent: 'center' },
  btn: {
    backgroundColor: colors.rose,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 17, fontFamily: fonts.sansBold },
});
