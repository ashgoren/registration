import { createTheme } from '@mui/material';
import { responsiveFontSizes } from '@mui/material/styles';
import { cyan, grey, green } from '@mui/material/colors';
import config from 'config/configBasics';
const { PALETTE } = config;

const palettes = {
  default: {
    light: {
      primary: { main: '#1976d2' },
      secondary: { main: '#9c27b0' },
      background: { default: '#ffffff', paper: '#f5f5f5' }
    },
    dark: {
      primary: cyan,
      secondary: cyan,
      background: { default: '#000000', paper: '#424242' }
    }
  },
  green: {
    light: {
      primary: { main: green[900] },
      secondary: { main: green[900] },
      background: { default: green[50], paper: '#f5f5f5' }
    },
    dark: {
      primary: green,
      secondary: green,
      background: { default: '#212e22', paper: '#424242' }
    }
  },
};

const greyButtonColors = {
  light: { main: grey[800], hover: grey[900], active: grey[900], background: grey[200] },
  dark: { main: grey[300], hover: grey[200], active: grey[200], background: grey[800] }
};

const breakpoints = {
  values: { xs: 0, sm: 674, md: 900, lg: 1190, xl: 1536 }
};

const createCustomTheme = ({ mode, palette }) => {
  let theme = createTheme({
    breakpoints,
    palette: {
      mode,
      greyButton: greyButtonColors[mode],
      ...palette[mode]
    },
  });
  return responsiveFontSizes(theme);
};

const lightTheme = createCustomTheme({ mode: 'light', palette: palettes[PALETTE] });
const darkTheme = createCustomTheme({ mode: 'dark', palette: palettes[PALETTE] });

const rootStyle = (theme) => ({
  width: 'auto',
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
    width: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

const paperStyle = (theme, extraStyles) => ({
  ...{
    maxWidth: 650,
    margin: 'auto',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.up(600)]: {
      padding: theme.spacing(3),
    },
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
    },
  },
  ...extraStyles
});

export { darkTheme, lightTheme, rootStyle, paperStyle };
