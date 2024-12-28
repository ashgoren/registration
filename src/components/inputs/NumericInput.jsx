import { memo } from 'react';
import { useField } from 'formik';
import { isMobile } from 'react-device-detect';
import { PatternFormat } from 'react-number-format';
import { Box, TextField } from '@mui/material';

export const NumericInput = memo(({ variant, label, name, type, pattern, range, onBlur, ...props }) => {
  const isPhoneInput = pattern === '###-###-####'; // replace with more generalizable solution
  const [field, { touched, error }, { setError }] = useField(name);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <PatternFormat
        {...field}
        type={isMobile ? 'tel' : 'text'}
        customInput={TextField}
        label={label}
        format={pattern}
        // onValueChange={() => setValue(isPhoneInput ? field.value : parseInt(field.value))}
        inputMode='numeric'
        variant={variant || 'outlined'}
        error={Boolean(isPhoneInput && touched && error)}
        helperText={isPhoneInput && touched && error}
        onFocus={() => setError('')}
        onBlur={onBlur || field.onBlur}
        {...props}
      />
    </Box>
  );
});
