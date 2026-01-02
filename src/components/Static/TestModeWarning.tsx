import { StyledPaper, Paragraph } from 'components/layouts/SharedStyles';
import { Typography, Button } from "@mui/material";

export const TestModeWarning = ({ setRegistering }: { setRegistering: (registering: boolean) => void }) => (
  <StyledPaper>
    <Typography variant='h4' color='error' sx={{ fontWeight: 'bold'}}>TEST MODE ONLY</Typography>
    <Typography variant='h6'>DO NOT USE FOR ACTUAL REGISTRATION</Typography>
    <Paragraph sx={{ lineHeight: 2, mt: 4 }}>
      <Button variant='contained' color='secondary' onClick={() => setRegistering(true)}>Continue</Button>
    </Paragraph>
  </StyledPaper>
);
