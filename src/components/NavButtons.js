import { MyMobileStepper } from 'components/MyStepper';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { StyledButton, StyledPaper } from "components/Layout/SharedStyles.js";

function UnifiedButton({ color, palette, variant='contained', type='button', onClick, text, ...props }) {
  const ButtonComponent = palette ? StyledButton : Button;
  return (
    <ButtonComponent color={color} palette={palette} variant={variant} type={type} onClick={onClick} {...props}>
      {text}
    </ButtonComponent>
  );
}

export default function NavButtons({ backButtonProps, nextButtonProps, centerButtonProps }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const renderButtonsOrMobileStepper = () => {
    if (isMobile) {
      return (
        <MyMobileStepper
          backButtonProps={backButtonProps}
          nextButtonProps={nextButtonProps}
        />
      );
    } else {
      return (
        <StyledPaper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {backButtonProps ? <UnifiedButton palette='greyButton' variant='outlined' {...backButtonProps} /> : <div />}
            {centerButtonProps && <UnifiedButton palette='greyButton' variant='outlined' {...centerButtonProps} />}
            {nextButtonProps ? <UnifiedButton type='submit' color='secondary' {...nextButtonProps} /> : <div />}
          </Box>
        </StyledPaper>
      );
    }
  };

  return renderButtonsOrMobileStepper();
}
