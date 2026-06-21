import React, { useState } from 'react';
import { Pressable, View, Text, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { CalendarIcon } from './icons';
import { FieldBox } from './ui';
import { shortDate } from '../lib/format';

// Tappable field that opens the native date picker (dialog on Android, inline
// spinner with "Listo" on iOS). Shows the selected date as the "DD mmm" label.
export function DateField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [show, setShow] = useState(false);

  // Android: the dialog closes itself on pick; iOS: the inline spinner stays
  // open until the user taps "Listo".
  const handleValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => setShow(true)}>
        <FieldBox>
          <View style={styles.row}>
            <Text style={styles.text}>{shortDate(value)}</Text>
            <CalendarIcon />
          </View>
        </FieldBox>
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode="date"
          onValueChange={handleValueChange}
          onDismiss={() => setShow(false)}
        />
      )}

      {show && Platform.OS === 'ios' && (
        <View style={styles.iosWrap}>
          <DateTimePicker value={value} mode="date" display="spinner" onValueChange={handleValueChange} />
          <Pressable onPress={() => setShow(false)} style={styles.done} hitSlop={8}>
            <Text style={styles.doneText}>Listo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  text: { fontSize: 16, fontFamily: fonts.sans, color: colors.ink },
  iosWrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingBottom: 8,
  },
  done: { alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 6 },
  doneText: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.rose },
});
