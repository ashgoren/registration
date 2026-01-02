// This component is not currently used

import { Box, Typography } from '@mui/material';

export const Photo = ({ url, caption }: { url: string, caption: string }) => {
  return (
    <Box position='relative' mt={-5} mb={4}>
      <img
        src={url}
        alt=''
        style={{ width: '100%', height: 'auto' }}
      />
      <Typography
        variant='caption'
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.8rem',
        }}
      >
        {caption}
      </Typography>
    </Box>
  );
};
