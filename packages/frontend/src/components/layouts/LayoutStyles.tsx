import { createTheme } from '@mui/material';
import { responsiveFontSizes } from '@mui/material/styles';
import { cyan, green, yellow } from '@mui/material/colors';
import configTheme from 'config/configTheme';
import type { SxProps, Theme } from '@mui/material';
import type { ThemePalette, Palettes } from '@registration/types';

const { palette }: { palette: keyof Palettes } = configTheme;

const palettes: Palettes = {
  default: {
    light: {
    primary: { main: '#1976d2' }, 
    secondary: { main: '#9c27b0' },
      background: { default: '#ffffff', paper: '#f5f5f5', sticky: yellow[500] }
    },
    dark: {
      primary: cyan,
      secondary: cyan,
      background: { default: '#000000', paper: '#424242', sticky: yellow[900] }
    }
  },
  green: {
    light: {
      primary: { main: green[900] },
      secondary: { main: green[900] },
      background: { default: green[50], paper: '#f5f5f5', sticky: green[500] }
    },
    dark: {
      primary: green,
      secondary: green,
      background: { default: '#212e22', paper: '#424242', sticky: green[900] }
    }
  },
};

const breakpoints = {
  values: { xs: 0, sm: 674, md: 900, lg: 1190, xl: 1536 }
};

interface CustomThemeOptions {
  mode: 'light' | 'dark';
  palette: ThemePalette;
}
  
const createCustomTheme = ({ mode, palette }: CustomThemeOptions) => {
  const theme = createTheme({
    breakpoints,
    palette: {
      mode,
      ...palette[mode]
    },
  });
  return responsiveFontSizes(theme);
};

const lightTheme = createCustomTheme({ mode: 'light', palette: palettes[palette] });
const darkTheme = createCustomTheme({ mode: 'dark', palette: palettes[palette] });

// const rootStyle = (theme: Theme) => ({
//   width: 'auto',
//   marginLeft: theme.spacing(2),
//   marginRight: theme.spacing(2),
//   backgroundColor: theme.palette.background.default,
//   color: theme.palette.text.primary,
//   [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
//     width: 600,
//     marginLeft: 'auto',
//     marginRight: 'auto',
//   },
// });

const paperStyle = (theme: Theme, extraStyles?: SxProps<Theme>) => ({
  maxWidth: 650,
  margin: 'auto',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.up(600)]: {
    padding: theme.spacing(3),
  },
  // [theme.breakpoints.up('sm')]: {
  //   marginTop: theme.spacing(6),
  //   marginBottom: theme.spacing(6),
  // },
  ...extraStyles
});

export { darkTheme, lightTheme, paperStyle };
