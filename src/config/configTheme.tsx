import type { Palettes } from 'types/theme';
// import { green } from '@mui/material/colors';

// set MUI theme palette
const palette: keyof Palettes = 'default'; // options defined in LayoutStyles.js

// navbar color for light mode
const navbarColor: 'default' | 'primary' | 'secondary' = 'default';

// apply a variant of navbarColor to dark mode navbar as well
const navbarColorDark: true | false = false; // if false, dark mode navbar will be dark grey

// force navbar background color for both light and dark mode
// overrides navbarColor & navbarColorDark
const navbarBackgroundOverride: string | false = false; // MUI or CSS color - e.g. green[900] or '#333' (or false to disable)

const config = {
  palette,
  // ...navbarBackgroundOverride ? { navbarBackgroundOverride } : { navbarColor, navbarColorDark }
  navbarColor: navbarBackgroundOverride ? undefined : navbarColor,
  navbarColorDark: navbarBackgroundOverride ? undefined : navbarColorDark,
  navbarBackgroundOverride: navbarBackgroundOverride || undefined,
};

export default config;
