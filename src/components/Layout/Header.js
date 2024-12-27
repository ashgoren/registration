import { useOrder } from 'hooks/useOrder';
import { StyledPaper } from 'components/Layout/SharedStyles';
import { Typography, Box } from "@mui/material";
import { MyStepper } from 'components/MyStepper';
import config from 'config';
const { TITLE, REGISTRATION_ONLY, WAITLIST_MODE } = config;

export default function Header({ titleText = TITLE, children }) {
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
}
