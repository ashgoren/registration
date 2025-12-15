import { Box } from '@mui/material';
import { useScrollToTop } from 'hooks/useScrollToTop';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';

export const Error = () => {
  const { error } = useOrderFlow();

  useScrollToTop();

  return (
    <Box sx={{ mb: 2, p: 2, backgroundColor: 'var(--color-error)', display: 'flex', justifyContent: 'center', alignItems: 'center'  }}>
      {error || `An unexpected error has occurred. Please email ${config.contacts.tech}.`}
    </Box>
  );
};
