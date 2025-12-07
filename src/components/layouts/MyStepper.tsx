import { Stepper, Step, StepLabel, MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';
const { STEPS } = config;

export const MyStepper = () => {
  const { currentPage } = useOrderFlow();

  return (
    <Stepper
      activeStep={STEPS.findIndex(step => step.key === currentPage)}
      sx={{
        my: 5,
        '& .MuiStepLabel-root .Mui-active': {color: 'secondary'},
        '& .MuiStepLabel-root .Mui-completed': {color: 'secondary'}
      }}
    >
      {STEPS.map(({ label }) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export const MyMobileStepper = ({ backText, nextText, onBackClick, onNextClick }: {
  backText?: string;
  nextText?: string;
  onBackClick?: () => void;
  onNextClick?: () => void;
}) => {
  const { currentPage } = useOrderFlow();

  return (
    <MobileStepper
      variant='dots'
      steps={STEPS.length}
      position='static'
      activeStep={STEPS.findIndex(step => step.key === currentPage)}
      backButton={backText ?
        <Button
          onClick={onBackClick}
          type='button'
          size='small'
          sx={!onBackClick ? { visibility: 'hidden' } : {}}
        >
          <KeyboardArrowLeft />{backText}
        </Button>
        : <div />
      }
      nextButton={nextText ?
        <Button
          onClick={onNextClick}
          type='button'
          size='small'
          sx={!onNextClick ? { visibility: 'hidden' } : {}}
        >
          {nextText}<KeyboardArrowRight />
        </Button>
      : <div />
      }
    />
  );
};
