import { useSyncExternalStore } from 'react';
import IconButton from '@mui/material/IconButton';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { getColorMode, applyColorMode, subscribeColorMode, nextColorMode } from 'utils/colorMode';
import { config } from 'config';
import type { ColorMode } from 'utils/colorMode';

const icons: Record<ColorMode, React.ReactNode> = {
  auto: <SunMoon size={18} aria-hidden />,
  light: <Sun size={18} aria-hidden />,
  dark: <Moon size={18} aria-hidden />,
};

export const ColorModeToggle = () => {
  const colorMode = useSyncExternalStore(subscribeColorMode, getColorMode);
  const toggle = () => applyColorMode(nextColorMode(colorMode), config.links.info);

  return (
    <IconButton
      sx={{ ml: 1, opacity: 0.6, '&:hover': { opacity: 1 } }}
      onClick={toggle}
      color='inherit'
      aria-label={`Theme: ${colorMode} — click to cycle`}
      title={`Theme: ${colorMode}`}
    >
      {icons[colorMode]}
    </IconButton>
  );
};
