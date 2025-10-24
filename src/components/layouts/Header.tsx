import { Typography, Box } from '@mui/material';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { MyStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { config } from 'config';
import type { ReactNode } from 'react';
const { REGISTRATION_ONLY, WAITLIST_MODE } = config;

export const Header = ({ titleText, children }: { titleText: string; children: ReactNode }) => {
  const { currentPage } = useOrderFlow();

  return (
    <StyledPaper>
      {!REGISTRATION_ONLY &&
        <Typography variant='h4' component='h1' align='center' gutterBottom>
          {titleText}
        </Typography>
      }

      {currentPage !== 'confirmation' && !WAITLIST_MODE &&
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <MyStepper />
        </Box>
      }

      {children}
    </StyledPaper>
  );
};
