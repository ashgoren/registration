import { Stepper, Step, StepLabel, MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { StyledPaper } from 'components/layouts/SharedStyles';
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
        '& .MuiStepLabel-root .Mui-active': { color: 'secondary.main' },
        '& .MuiStepLabel-root .Mui-completed': { color: 'secondary.main' }
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
    <StyledPaper>
      <MobileStepper
        sx={{
          bgcolor: 'transparent',
          '& .MuiMobileStepper-dotActive': { bgcolor: 'secondary.main' }
        }}
        variant='dots'
        steps={STEPS.length}
        position='static'
        activeStep={STEPS.findIndex(step => step.key === currentPage)}
        backButton={backText ?
          <Button
            color='secondary'
            onClick={onBackClick}
            type='button'
            size='medium'
            sx={!onBackClick ? { visibility: 'hidden' } : {}}
          >
            <KeyboardArrowLeft />{backText}
          </Button>
          : <div />
        }
        nextButton={nextText ?
          <Button
            color='secondary'
            onClick={onNextClick}
            type='button'
            size='medium'
            sx={!onNextClick ? { visibility: 'hidden' } : {}}
          >
            {nextText}<KeyboardArrowRight />
          </Button>
        : <div />
        }
      />
    </StyledPaper>
  );
};
