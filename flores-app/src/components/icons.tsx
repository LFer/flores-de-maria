import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

type IconProps = { size?: number; color?: string };

export function PlusIcon({ size = 26, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Path d="M13 5v16M5 13h16" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

export function MinusSmall({ size = 15, color = colors.stoneDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8h10" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusSmall({ size = 15, color = colors.stoneDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 3v10M3 8h10" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 13, color = colors.stone }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <Path d="M1 1l11 11M12 1L1 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 18, color = colors.stoneDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M6.5 3.5H3.8A1.3 1.3 0 002.5 4.8v8.4a1.3 1.3 0 001.3 1.3h2.7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M9.5 6.5L12 9l-2.5 2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9H5.7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12.8 3.5h1.4A1.3 1.3 0 0115.5 4.8v8.4a1.3 1.3 0 01-1.3 1.3h-1.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 15, color = colors.olive }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x={1.5} y={3} width={13} height={11.5} rx={2} stroke={color} strokeWidth={1.4} />
      <Path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

// ── Bottom-tab icons ─────────────────────────────────────────────
export function TabPedidos({ size = 24, color }: IconProps) {
  const c = color ?? colors.mutedTab;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M8 10h8M8 14h8M8 18h5" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function TabCaja({ size = 24, color }: IconProps) {
  const c = color ?? colors.mutedTab;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={2.5} stroke={c} strokeWidth={1.8} />
      <Path d="M3 10h18" stroke={c} strokeWidth={1.8} />
      <Circle cx={16.5} cy={14.5} r={1.4} fill={c} />
    </Svg>
  );
}

export function TabGastos({ size = 24, color }: IconProps) {
  const c = color ?? colors.mutedTab;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h9l5 5v11a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 13l2.2 2.2L15 11.5" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
