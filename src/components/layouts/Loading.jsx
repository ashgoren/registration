import { Box, Typography } from '@mui/material';
import { TailSpin } from 'react-loading-icons'
import { config } from 'config';
const { TECH_CONTACT } = config;

export const Loading = ({ text='Thinking...', isHeading=true, processing=false }) => {
  return (
    <Box align='center' sx={{ my: 10 }}>
      <TailSpin stroke='black' strokeWidth='2.5' />
      <Typography sx={{ mt: 5}} color={isHeading ? 'error' : 'secondary'}>
        {text}
      </Typography>
      {processing &&
        <Typography sx={{ mt: 2 }}>
          Do not refresh or navigate away.<br />
          Email {TECH_CONTACT} if you do not see a confirmation page.
        </Typography>
      }
    </Box>
  );
};
