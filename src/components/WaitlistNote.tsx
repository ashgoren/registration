import { useTheme } from '@mui/system';
import { Box } from '@mui/material';
import { config } from 'config';
const { EVENT_TITLE } = config;

export const WaitlistNote = () => {
  const theme = useTheme();

  return (
    <Box sx={{ my: 4, p: 2, backgroundColor: theme.palette.background.sticky, display: 'flex', justifyContent: 'center', alignItems: 'center'  }}>
      <strong>{EVENT_TITLE} is full; sign up here for the waitlist.</strong>
    </Box>
  );
};
