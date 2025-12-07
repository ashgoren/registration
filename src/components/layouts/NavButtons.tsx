import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { MyMobileStepper } from 'components/layouts';
import { StyledPaper } from 'components/layouts/SharedStyles';

export interface NavButtonsProps {
  next?: {
    text: string;
    onClick: () => void;
    disable?: boolean;
  };
  back?: {
    text: string;
    onClick: () => void;
    disable?: boolean;
  };
}

export const NavButtons = ({ back, next }: NavButtonsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return <MyMobileStepper back={back} next={next} />;
  }

  return (
    <StyledPaper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

        <Box>
          {back && (
            <Button color='inherit' variant='outlined' type='button' onClick={back.onClick} disabled={back.disable}>
              {back.text}
            </Button>
          )}
        </Box>

        <Box sx={{ marginLeft: 'auto' }}>
          {next && (
            <Button color='secondary' variant='contained' onClick={next.onClick} disabled={next.disable}>
              {next.text}
            </Button>
          )}
        </Box>

      </Box>
    </StyledPaper>
  );
};
