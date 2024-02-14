import { Box, Button } from '@mui/material';
import { StyledButton } from "components/Layout/SharedStyles.js";

function UnifiedButton({ color, palette, variant='contained', type='button', onClick, text, ...props }) {
  const ButtonComponent = palette ? StyledButton : Button;
  return (
    <ButtonComponent color={color} palette={palette} variant={variant} type={type} onClick={onClick} {...props}>
      {text}
    </ButtonComponent>
  );
}

export default function ButtonRow({ backButtonProps, nextButtonProps, centerButtonProps, cancelButtonProps, saveButtonProps, deleteButtonProps, editButtonProps }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {backButtonProps ?
        <UnifiedButton
          palette='greyButton'
          variant='outlined'
          {...backButtonProps}
        /> : <div />
      }
      {centerButtonProps &&
        <>
          <UnifiedButton
            palette='greyButton'
            variant='outlined'
            {...centerButtonProps}
            />
          <div />
        </>
      }
      {cancelButtonProps &&
        <>
          <UnifiedButton
            color='warning'
            {...cancelButtonProps}
            />
          <div />
        </>
      }
      {deleteButtonProps &&
        <>
          <UnifiedButton
            color='error'
            {...deleteButtonProps}
            />
          <div />
        </>
      }
      {editButtonProps &&
        <>
          <UnifiedButton
            color='info'
            {...editButtonProps}
            />
          <div />
        </>
      }
      {saveButtonProps &&
        <>
          <UnifiedButton
            color='success'
            {...saveButtonProps}
            />
          <div />
        </>
      }
      {nextButtonProps &&
        <UnifiedButton
          type='submit'
          color='secondary'
          {...nextButtonProps}
        />
      }
    </Box>
  );
}
