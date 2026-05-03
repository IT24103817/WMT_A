// GemMarket design system — light theme, royal purple
// Tokens are intentionally small + opinionated. Components import from here only.

export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  surface: '#FAFAFE',
  surfaceAlt: '#F3F0FF', // soft lilac
  surfaceMuted: '#F4F4F5',

  // Text
  text: '#0F172A',       // slate-900
  textDim: '#64748B',    // slate-500
  textMuted: '#94A3B8',  // slate-400
  textInverse: '#FFFFFF',

  // Brand
  primary: '#6D28D9',    // violet-700
  primaryDark: '#5B21B6',
  primaryLight: '#8B5CF6',
  primaryGlow: 'rgba(109, 40, 217, 0.12)',

  // Accents
  accent: '#F59E0B',     // amber-500 — for prices, highlights
  accentDark: '#D97706',

  // Semantic
  success: '#10B981',
  successBg: '#ECFDF5',
  warn: '#F97316',
  warnBg: '#FFF7ED',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  info: '#2563EB',
  infoBg: '#EFF6FF',

  // Lines
  border: '#E5E7EB',     // gray-200
  borderStrong: '#D1D5DB',
  divider: '#F3F4F6',

  // Tabs
  tabBg: '#FFFFFF',
  tabBorder: '#F3F4F6',

  // Gradients (used by GradientButton + Hero)
  gradStart: '#7C3AED',  // violet-600
  gradEnd: '#A855F7',    // purple-500
  heroStart: '#6D28D9',
  heroEnd: '#9333EA',
};

export const spacing = (n) => n * 8;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6D28D9',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
};

export const type = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
};

// Fade durations (ms) — used by Reanimated entering animations
export const motion = {
  fast: 180,
  base: 260,
  slow: 420,
  stagger: 60,
};

export const formatPrice = (n) => {
  const num = Number(n) || 0;
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};
