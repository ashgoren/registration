import { useEffect } from 'react';
import { useOrder } from 'components/OrderContext';
import { scrollToTop } from 'utils';
import { Box } from '@mui/material';

export default function Error() {
  const { error } = useOrder();
  
  useEffect(() => { scrollToTop() },[]);
  return (
    <Box sx={{ mb: 2, p: 2, backgroundColor: 'var(--color-error)', display: 'flex', justifyContent: 'center', alignItems: 'center'  }}>
      {error}
    </Box>
  );
}