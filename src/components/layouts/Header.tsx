import { Typography } from '@mui/material';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { MyStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { config } from 'config';
import type { ReactNode } from 'react';
const { REGISTRATION_ONLY } = config;

export const Header = ({ titleText, children }: { titleText: string; children?: ReactNode }) => {
  const { currentPage } = usePageNavigation();

  return (
    <StyledPaper>
      {!REGISTRATION_ONLY &&
        <Typography variant='h4' component='h1' align='center' gutterBottom>
          {titleText}
        </Typography>
      }

      {currentPage !== 'confirmation' &&
        <MyStepper />
      }

      {children}
    </StyledPaper>
  );
};
