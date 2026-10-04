import { useSyncExternalStore } from 'react';
import { Box } from '@mui/material';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { getColorMode, applyColorMode, subscribeColorMode, nextColorMode } from 'utils/colorMode';
import { config } from 'config';
import type { ColorMode } from 'utils/colorMode';

const icons: Record<ColorMode, React.ReactNode> = {
  auto: <SunMoon size={18} aria-hidden />,
  light: <Sun size={18} aria-hidden />,
  dark: <Moon size={18} aria-hidden />,
};

// A plain button rather than MUI's IconButton (no hover circle or ripple), sized and faded like
// static-site-kit's ThemeToggle so the two sites' navbars match
export const ColorModeToggle = () => {
  const colorMode = useSyncExternalStore(subscribeColorMode, getColorMode);
  const toggle = () => applyColorMode(nextColorMode(colorMode), config.links.info);

  return (
    <Box
      component='button'
      onClick={toggle}
      aria-label={`Theme: ${colorMode} — click to cycle`}
      title={`Theme: ${colorMode}`}
      sx={{
        // reset browser button styles (static-site-kit gets this from Tailwind's preflight)
        border: 0,
        background: 'none',
        color: 'inherit',
        // p-1 w-9 h-9 flex items-center justify-center
        p: 0.5,
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // opacity-60 hover:opacity-100 transition-opacity
        opacity: 0.6,
        transition: 'opacity 150ms',
        '&:hover': { opacity: 1 },
      }}
    >
      {icons[colorMode]}
    </Box>
  );
};
