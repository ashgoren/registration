import { memo } from 'react';
import { useField } from 'formik';
import { Box, TextField } from '@mui/material';

export const TextInput = memo(({ label, name, type, hidden, onBlur, ...props }) => {
  const [field, { touched, error }, { setError }] = useField(name);

  const handleFocus = () => setError('');
  const handleBlur = onBlur || field.onBlur;

  const textFieldStyles = {
    mb: '.3rem',
    display: hidden ? 'none' : undefined,
    ...(props.width && { width: props.width })
  };
  
  return (
    <Box>
      <TextField
        sx={textFieldStyles}
        {...field}
        type={type}
        label={label}
        variant='standard'
        error={Boolean(touched && error)}
        helperText={touched && error}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Box>
  );
});
