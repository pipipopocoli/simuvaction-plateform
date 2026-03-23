export const Colors = {
  // Primary — SimuVaction blue
  primary: '#009EDB',
  primaryDark: '#0077A8',
  primaryLight: '#4DB8E8',

  // Backgrounds
  bg: '#0A1628',
  bgCard: '#111D2E',
  bgCardAlt: '#162236',
  bgElevated: '#1A2840',
  bgInput: '#0D1824',

  // Text
  text: '#E8EDF4',
  textSecondary: '#8B9BB4',
  textMuted: '#4A5C78',
  textInverse: '#0A1628',

  // Borders
  border: '#1E3048',
  borderLight: '#2A3E58',

  // Status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Chat bubbles
  bubbleSelf: '#009EDB',
  bubbleOther: '#1A2840',
  bubbleSelfText: '#FFFFFF',
  bubbleOtherText: '#E8EDF4',

  // Roles
  roleAdmin: '#F59E0B',
  roleDelegate: '#3B82F6',
  roleJournalist: '#8B5CF6',
  roleLobbyist: '#EC4899',
  roleLeader: '#10B981',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
