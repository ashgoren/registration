import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { MyMobileStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';

interface NavButtonsProps {
  backText?: string;
  nextText?: string;
  onBackClick?: () => void;
  onNextClick?: () => void;
  disableNext?: boolean;
}

export const NavButtons = ({ backText, nextText, onBackClick, onNextClick, disableNext }: NavButtonsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <MyMobileStepper
        backText={backText}
        nextText={nextText}
        onBackClick={onBackClick}
        onNextClick={onNextClick}
        disableNext={disableNext}
      />
    );
  }

  return (
    <StyledPaper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

        <Box>
          {backText && (
            <Button color='inherit' variant='outlined' type='button' onClick={onBackClick}>
              {backText}
            </Button>
          )}
        </Box>

        <Box sx={{ marginLeft: 'auto' }}>
          {nextText && (
            <Button color='secondary' variant='contained' onClick={onNextClick} disabled={disableNext}>
              {nextText}
            </Button>
          )}
        </Box>

      </Box>
    </StyledPaper>
  );
};
