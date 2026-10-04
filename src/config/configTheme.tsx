import type { Palettes, ThemeColors } from 'types/theme';
// import { green } from '@mui/material/colors';

// set MUI theme palette (button, checkbox & other control colors)
const palette: keyof Palettes = 'default'; // options defined in LayoutStyles.tsx

// Page & navbar colors, applied on top of the palette above. To match a companion static site
// (static-site-kit), copy the values of --background-*, --foreground-* and --accent-* from its
// app/globals.css. `paper` (form card background) has no static site equivalent: pick a color
// that stands out slightly from `background`.
// The values below match MUI's defaults (and the default palette's primary color for accent).
const colors: Record<'light' | 'dark', ThemeColors> = {
  light: { background: '#ffffff', foreground: 'rgba(0, 0, 0, 0.87)', accent: '#1976d2', paper: '#f5f5f5' },
  dark: { background: '#000000', foreground: '#ffffff', accent: '#00bcd4', paper: '#424242' },
};

const config = {
  palette,
  colors,
};

export default config;
