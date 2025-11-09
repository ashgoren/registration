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
