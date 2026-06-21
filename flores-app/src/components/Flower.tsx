import React from 'react';
import Svg, { G, Ellipse, Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

const PETAL_ROT = [0, 72, 144, 216, 288];
const INNER_ROT = [0, 144, 288];

/**
 * Full brand flower used on the login screen (design: 78×78 with petals,
 * inner petals, center highlight and sage leaves).
 */
export function FlowerLogo({ size = 78 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 78 78" fill="none">
      <G opacity={0.92}>
        {PETAL_ROT.map((r) => (
          <Ellipse key={r} cx={39} cy={23} rx={9.5} ry={16} fill={colors.petal} rotation={r} origin="39, 39" />
        ))}
      </G>
      {INNER_ROT.map((r) => (
        <Ellipse key={r} cx={39} cy={29} rx={5.5} ry={9} fill={colors.petalMid} opacity={0.7} rotation={r} origin="39, 39" />
      ))}
      <Circle cx={39} cy={39} r={7.5} fill={colors.rose} />
      <Circle cx={36.5} cy={36.5} r={2.4} fill={colors.bg} opacity={0.55} />
      <Path d="M30 58 C30 50, 35 47, 39 47" stroke={colors.sage} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M48 58 C48 50, 43 47, 39 47" stroke={colors.sage} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Ellipse cx={29} cy={55} rx={6.5} ry={3.4} fill={colors.sage} opacity={0.85} rotation={-38} origin="29, 55" />
      <Ellipse cx={49} cy={55} rx={6.5} ry={3.4} fill={colors.sage} opacity={0.85} rotation={38} origin="49, 55" />
    </Svg>
  );
}

/**
 * Compact flower mark used beside screen titles (design: rendered at 22px,
 * just petals + center).
 */
export function FlowerMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 78 78" fill="none">
      <G opacity={0.95}>
        {PETAL_ROT.map((r) => (
          <Ellipse key={r} cx={39} cy={24} rx={9.5} ry={15} fill={colors.petal} rotation={r} origin="39, 39" />
        ))}
      </G>
      <Circle cx={39} cy={39} r={8} fill={colors.rose} />
    </Svg>
  );
}
