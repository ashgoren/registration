// import { green } from '@mui/material/colors';

// set MUI theme palette
const PALETTE = 'default'; // options defined in LayoutStyles.js

// navbar color for light mode
const NAVBAR_COLOR = 'default'; // options: default|primary|secondary

// apply a variant of NAVBAR_COLOR to dark mode navbar as well
const NAVBAR_COLOR_DARK = false; // options: true|false (if false, dark mode navbar will be dark grey)

// force navbar background color for both light and dark mode
// overrides NAVBAR_COLOR & NAVBAR_COLOR_DARK
const NAVBAR_BACKGROUND_OVERRIDE = false; // options: false (to disable) | MUI or CSS color - e.g. green[900] or '#333'

const config = {
  PALETTE,
  ...NAVBAR_BACKGROUND_OVERRIDE ? { NAVBAR_BACKGROUND_OVERRIDE } : { NAVBAR_COLOR, NAVBAR_COLOR_DARK }
};

export default config;
