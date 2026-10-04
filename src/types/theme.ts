import type { PaletteOptions } from '@mui/material/styles';

type PaletteOptionsExtended = PaletteOptions & {
  background: { sticky: string };
};

export type ThemePalette = {
  light: PaletteOptionsExtended;
  dark: PaletteOptionsExtended;
};

export type Palettes = {
  default: ThemePalette;
  green: ThemePalette;
};

// Page & navbar colors for one color mode, named after the companion static site's CSS variables
// (--background-*, --foreground-*, --accent-* in app/globals.css) so they can be copied across
export type ThemeColors = {
  background: string;
  foreground: string;
  accent: string;
  paper: string;
};
