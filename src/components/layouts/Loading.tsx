import { Box, Typography } from '@mui/material';
import { TailSpin } from 'react-loading-icons'
import { config } from 'config';

export const Loading = ({ text='Thinking...', isHeading=true, processing=false }:
  { text?: string | null; isHeading?: boolean; processing?: boolean }
) => {
  return (
    <Box sx={{ my: 10 }}>
      <TailSpin stroke='black' strokeWidth='2.5' />
      <Typography sx={{ mt: 5}} color={isHeading ? 'error' : 'secondary'}>
        {text}
      </Typography>
      {processing &&
        <Typography sx={{ mt: 2 }}>
          Do not refresh or navigate away.<br />
          Email {config.contacts.tech} if you do not see a confirmation page.
        </Typography>
      }
    </Box>
  );
};
