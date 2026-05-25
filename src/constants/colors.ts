import { HintTier } from '../types';

export const COLORS = {
  purple: {
    primary: '#534AB7',
    light: '#EEEDFE',
    dark: '#3C3489',
  },
  teal: {
    primary: '#1D9E75',
    light: '#E1F5EE',
    dark: '#085041',
  },
  amber: {
    primary: '#EF9F27',
    light: '#FAEEDA',
    dark: '#633806',
  },
  red: {
    primary: '#E24B4A',
    light: '#FCEBEB',
    dark: '#501313',
  },
  gray: {
    primary: '#888780',
    light: '#F1EFE8',
    dark: '#2C2C2A',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const TIER_COLORS: Record<HintTier, { bg: string; border: string; text: string }> = {
  nudge: { bg: '#EEEDFE', border: '#AFA9EC', text: '#3C3489' },
  concept: { bg: '#EEEDFE', border: '#7F77DD', text: '#26215C' },
  example: { bg: '#E1F5EE', border: '#5DCAA5', text: '#085041' },
  partial: { bg: '#FAEEDA', border: '#EF9F27', text: '#633806' },
  solution: { bg: '#FCEBEB', border: '#E24B4A', text: '#501313' },
};

export const UNDERLINE_COLORS = {
  flagged: '#EF9F27',
  error: '#E24B4A',
  correct: '#1D9E75',
} as const;
