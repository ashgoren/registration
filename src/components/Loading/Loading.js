import { TailSpin } from 'react-loading-icons'
import { Box, Typography } from '@mui/material';
import config from 'config';
const { EMAIL_CONTACT } = config;

export default function Loading({ text, isHeading=true, processing=false }) {
  return (
    <Box align='center' sx={{ my: 10 }}>
      <TailSpin stroke='black' strokeWidth='2.5' />
      <Typography sx={{ mt: 5}} color={isHeading ? 'error' : 'secondary'}>
        {text}
      </Typography>
      {processing &&
        <Typography sx={{ mt: 2 }}>
          Do not refresh or navigate away.<br />
          Email {EMAIL_CONTACT} if you do not see a confirmation page.
        </Typography>
      }
    </Box>
  );
}