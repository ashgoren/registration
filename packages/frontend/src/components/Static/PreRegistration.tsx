import { Checkbox } from '@mui/material';
import { StyledPaper, StyledLink, Paragraph } from 'components/layouts/SharedStyles';

export const PreRegistration = ({ setRegistering }: { setRegistering: (value: boolean) => void }) => {
  return(
    <StyledPaper>
      <p>Please read the Covid Policy and Safety Policy for the 2025 Corvallis Contra Dance Weekend:</p>
      <ul>
        <li><StyledLink to='https://corvallisfolklore.org/home/ccw-faq/#Covid'>Covid Policy</StyledLink> (will open in a new tab)</li>
        <li><StyledLink to='https://corvallisfolklore.org/home/dance-safety-policy/'>Safety Policy</StyledLink> (will open in a new tab)</li>
      </ul>
      <Paragraph sx={{ lineHeight: 2, mt: 4 }}>
        I acknowledge that I have read and agree to follow both the Covid Policy and the Safety Policy for the 2025 Corvallis Contra Dance Weekend. 
        If I am registering multiple people, I acknowledge that everyone has read and agreed to these policies.
        <Checkbox onChange={() => setRegistering(true)} />
      </Paragraph>
    </StyledPaper>
  );
}
