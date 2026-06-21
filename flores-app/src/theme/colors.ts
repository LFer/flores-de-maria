// Palette extracted 1:1 from the Flores de María design handoff.
export const colors = {
  // surfaces
  bg: '#F6F3EE', // screen background (cream)
  card: '#FFFFFF',
  segment: '#EFEAE2', // segmented-control / stepper track

  // ink
  ink: '#2D2A28', // primary text
  inkSoft: 'rgba(45,42,40,0.55)',
  inkSofter: 'rgba(45,42,40,0.5)',
  inkFaint: 'rgba(45,42,40,0.4)',

  // rose (primary / brand)
  rose: '#C8536F',
  roseText: '#B4596B',
  petal: '#E7A7B1',
  petalMid: '#DE8E9B',
  petalSoft: '#E29AA7',

  // sage / olive (secondary)
  sage: '#97A56C',
  sageDeep: '#6E7C49',
  olive: '#A2A77F', // uppercase labels

  // neutrals
  stone: '#8A857E',
  stoneDeep: '#5A5550',
  mutedTab: '#B6B1A9', // inactive tab icon/label
  hairline: '#C9B7A0', // login divider lines

  // borders
  border: 'rgba(45,42,40,0.10)',
  borderSoft: 'rgba(45,42,40,0.06)',
  borderFaint: 'rgba(45,42,40,0.05)',

  // tinted chip / avatar backgrounds
  petalBg: 'rgba(231,167,177,0.30)',
  petalBgSoft: 'rgba(231,167,177,0.24)',
  petalBgFaint: 'rgba(231,167,177,0.22)',
  sageBg: 'rgba(151,165,108,0.26)',
  sageBgSoft: 'rgba(151,165,108,0.16)',

  overlay: 'rgba(45,42,40,0.42)',
} as const;
