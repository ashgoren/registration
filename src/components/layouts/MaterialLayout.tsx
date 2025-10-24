import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/system';
import { CssBaseline, useMediaQuery, Box } from '@mui/material';
import { Navbar } from './Navbar';
import { lightTheme, darkTheme } from './LayoutStyles';
import type { ReactNode } from 'react';

export const MaterialLayout = ({ children }: { children: ReactNode }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [theme, setTheme] = useState(prefersDarkMode ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(prefersDarkMode ? darkTheme : lightTheme);
  }, [prefersDarkMode]);
  
  const toggleColorMode = () => {
    setTheme(prevTheme => (prevTheme === lightTheme ? darkTheme : lightTheme));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <Box sx={rootStyle(theme)}> */}
        <Navbar toggleColorMode={toggleColorMode} />
        {/* <Paper sx={paperStyle(theme)}>{children}</Paper> */}
        <Box sx={{ my: { xs: 0, sm: 2 } }}>
          {children}
        </Box>
      {/* </Box> */}
    </ThemeProvider>
  );
};
