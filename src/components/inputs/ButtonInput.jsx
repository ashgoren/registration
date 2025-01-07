import { Button } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';

// not memoized because not used on the main form page
export const ButtonInput = ({ buttonText, onClick }) => {
  return (
    <Button variant='contained' size='large' color='info' onClick={onClick}>
      <Label sx={{ mr: '.5rem' }}>{buttonText}</Label>
      {/* <Typography variant='body1' sx={{ mr: '.5rem' }}>{buttonText}</Typography> */}
    </Button>
  );
};
