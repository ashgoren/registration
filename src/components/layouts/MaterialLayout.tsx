import { useSyncExternalStore } from 'react';
import { ThemeProvider } from '@mui/system';
import { CssBaseline, useMediaQuery, Box } from '@mui/material';
import { Navbar } from './Navbar';
import { lightTheme, darkTheme } from './LayoutStyles';
import { getColorMode, subscribeColorMode, resolveColorMode } from 'utils/colorMode';
import type { ReactNode } from 'react';

export const MaterialLayout = ({ children }: { children: ReactNode }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const colorMode = useSyncExternalStore(subscribeColorMode, getColorMode);
  const resolvedMode = resolveColorMode(colorMode, prefersDarkMode);
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <Box sx={{ my: { xs: 0, sm: 2 } }}>
        {children}
      </Box>
    </ThemeProvider>
  );
};
