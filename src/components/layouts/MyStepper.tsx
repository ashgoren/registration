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
        '& .MuiStepLabel-root .Mui-active': {color: 'secondary.main'},
        '& .MuiStepLabel-root .Mui-completed': {color: 'secondary.main'}
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

export const MyMobileStepper = ({ backButtonProps, nextButtonProps }: {
  backButtonProps?: { text: string; onClick: () => void };
  nextButtonProps?: { text: string };
}) => {
  const { currentPage } = useOrderFlow();

  return (
    <MobileStepper
      variant="dots"
      steps={STEPS.length}
      position="static"
      activeStep={STEPS.findIndex(step => step.key === currentPage)}
      backButton={backButtonProps ?
        <Button
          {...backButtonProps}
          type="button"
          size="small"
          sx={!backButtonProps.onClick ? { visibility: 'hidden' } : {}}
        >
          <KeyboardArrowLeft />{backButtonProps.text}
        </Button>
        : <div />
      }
      nextButton={nextButtonProps ?
        <Button
          {...nextButtonProps}
          type='submit'
          size='small'
          sx={!nextButtonProps ? { visibility: 'hidden' } : {}}
        >
          {nextButtonProps.text}<KeyboardArrowRight />
        </Button>
      : <div />
      }
    />
  );
};
