import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { MyMobileStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';

interface NavButtonsProps {
  backButtonProps?: { text: string; onClick: () => void };
  nextButtonProps?: { text: string; };
}

export const NavButtons = ({ backButtonProps, nextButtonProps }: NavButtonsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <MyMobileStepper
        backButtonProps={backButtonProps}
        nextButtonProps={nextButtonProps}
      />
    );
  }

  return (
    <StyledPaper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

        <Box>
          {backButtonProps && (
            <Button color='inherit' variant='outlined' type='button' onClick={backButtonProps.onClick}>
              {backButtonProps.text}
            </Button>
          )}
        </Box>

        <Box sx={{ marginLeft: 'auto' }}>
          {nextButtonProps && (
            <Button color='secondary' variant='contained' type='submit'>
              {nextButtonProps.text}
            </Button>
          )}
        </Box>

      </Box>
    </StyledPaper>
  );
};
