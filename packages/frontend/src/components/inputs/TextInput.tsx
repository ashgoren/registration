import { memo } from 'react';
import { useField } from 'formik';
import { Box, TextField } from '@mui/material';
import type { FocusEventHandler } from 'react';
import type { TextFieldProps } from '@mui/material';

interface TextInputProps extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  label?: string;
  name: string;
  type?: string;
  hidden?: boolean;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  width?: string | number;
}

export const TextInput = memo(({ label, name, type, hidden, onBlur, width, ...props }: TextInputProps) => {
  const [field, { touched, error }, { setError }] = useField(name);

  const handleFocus = () => setError('');
  const handleBlur = onBlur || field.onBlur;

  const textFieldStyles = {
    mb: '.3rem',
    display: hidden ? 'none' : undefined,
    ...(width && { width })
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
