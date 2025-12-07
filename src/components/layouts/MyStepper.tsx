import { Stepper, Step, StepLabel, MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { StyledPaper } from 'components/layouts/SharedStyles';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { STEPPER_PAGES } from 'utils/pageFlow';
import type { NavButtonsProps } from 'components/layouts/NavButtons';

export const MyStepper = () => {
  const { currentPage } = useOrderFlow();

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
  const { currentPage } = useOrderFlow();

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
            color='secondary'
            onClick={back.onClick}
            type='button'
            size='medium'
            disabled={back.disable}
            sx={!back ? { visibility: 'hidden' } : {}}
          >
            <KeyboardArrowLeft />{back.text}
          </Button>
          : <div />
        }
        nextButton={next ?
          <Button
            color='secondary'
            onClick={next.onClick}
            type='button'
            size='medium'
            disabled={next.disable}
            sx={!next ? { visibility: 'hidden' } : {}}
          >
            {next.text}<KeyboardArrowRight />
          </Button>
        : <div />
        }
      />
    </StyledPaper>
  );
};
