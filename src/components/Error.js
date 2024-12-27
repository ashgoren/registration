import { useOrder } from 'hooks/useOrder';
import { Box } from '@mui/material';
import useScrollToTop from 'hooks/useScrollToTop';

export default function Error() {
  const { error } = useOrder();
  
  useScrollToTop();

  return (
    <Box sx={{ mb: 2, p: 2, backgroundColor: 'var(--color-error)', display: 'flex', justifyContent: 'center', alignItems: 'center'  }}>
      {error}
    </Box>
  );
}
