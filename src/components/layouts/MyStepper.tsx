import { Stepper, Step, StepLabel, MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { usePageNavigation } from 'hooks/usePageNavigation';
import { config } from 'config';
import type { NavButtonsProps } from 'components/layouts/NavButtons';

const { STEPPER_PAGES } = config;

export const MyStepper = () => {
  const { currentPage } = usePageNavigation();

  return (
    <Stepper
      activeStep={STEPPER_PAGES.findIndex(step => step.key === currentPage)}
      sx={{
        my: 5,
        '& .MuiStepLabel-root .Mui-active': { color: 'secondary.main' },
        '& .MuiStepLabel-root .Mui-completed': { color: 'secondary.main' }
      }}
    >
      {STEPPER_PAGES.map(({ label }) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export const MyMobileStepper = ({ back, next }: NavButtonsProps) => {
  const { currentPage } = usePageNavigation();
  const { isNavigating } = useOrderFlow();

  return (
    <StyledPaper>
      <MobileStepper
        sx={{
          bgcolor: 'transparent',
          '& .MuiMobileStepper-dotActive': { bgcolor: 'secondary.main' }
        }}
        variant='dots'
        steps={STEPPER_PAGES.length}
        position='static'
        activeStep={STEPPER_PAGES.findIndex(step => step.key === currentPage)}
        backButton={back ?
          <Button
            type='button'
            onClick={back.onClick}
            disabled={back.disable}
            color='secondary'
            size='medium'
            sx={!back ? { visibility: 'hidden' } : {}}
          >
            <KeyboardArrowLeft />{back.text}
          </Button>
          : <div />
        }
        nextButton={next ?
          <Button
            type={next.onClick ? 'button' : 'submit'}
            onClick={next.onClick}
            disabled={next.disable || isNavigating}
            color='secondary'
            size='medium'
            sx={!next ? { visibility: 'hidden' } : {}}
          >
            {isNavigating ? 'Thinking...' : next.text}<KeyboardArrowRight />
          </Button>
        : <div />
        }
      />
    </StyledPaper>
  );
};
