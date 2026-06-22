import React from 'react';
import { Image } from 'react-native';
import Svg, { G, Ellipse, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

const PETAL_ROT = [0, 72, 144, 216, 288];

/**
 * Full brand flower used on the login screen, now rendered from the provided
 * brand logo image.
 */
export function FlowerLogo({ size = 78 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
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
