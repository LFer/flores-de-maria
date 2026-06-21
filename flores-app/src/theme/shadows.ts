import type { ViewStyle } from 'react-native';

// Soft elevation used by the list/summary cards in the design.
export const cardShadow: ViewStyle = {
  shadowColor: '#2D2A28',
  shadowOpacity: 0.05,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const listCardShadow: ViewStyle = {
  shadowColor: '#2D2A28',
  shadowOpacity: 0.045,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

// Pink glow under the primary button / FAB.
export const roseGlow: ViewStyle = {
  shadowColor: '#C8536F',
  shadowOpacity: 0.32,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
};
