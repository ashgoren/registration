import { Typography, Box } from '@mui/material';
import { useOrder } from 'hooks/useOrder';
import { MyStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { config } from 'config';
const { TITLE, REGISTRATION_ONLY, WAITLIST_MODE } = config;

export const Header = ({ titleText = TITLE, children }) => {
  const { currentPage } = useOrder();

  return (
    <StyledPaper>
      {!REGISTRATION_ONLY &&
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {titleText}
        </Typography>
      }

      {currentPage !== 'confirmation' && !WAITLIST_MODE &&
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <MyStepper currentPage={currentPage} />
        </Box>
      }

      {children}
    </StyledPaper>
  );
};
