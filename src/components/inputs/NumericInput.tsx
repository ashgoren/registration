import { memo } from 'react';
import { useField } from 'formik';
import { isMobile } from 'react-device-detect';
import { PatternFormat } from 'react-number-format';
import { Box, TextField } from '@mui/material';
import type { FocusEventHandler } from 'react';
import type { PatternFormatProps } from 'react-number-format';

interface NumericInputProps extends Omit<PatternFormatProps, 'onValueChange' | 'value' | 'name' | 'format' | 'customInput' | 'size' | 'color'> {
  variant?: 'filled' | 'outlined' | 'standard';
  label: string;
  name: string;
  pattern: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export const NumericInput = memo(({ variant, label, name, pattern, onBlur, ...props }: NumericInputProps) => {
  const isPhoneInput = pattern === '###-###-####'; // replace with more generalizable solution
  const isYearInput = pattern === '####'; // replace with more generalizable solution
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
        error={Boolean((isPhoneInput || isYearInput) && touched && error)}
        helperText={(isPhoneInput || isYearInput) && touched && error}
        onFocus={() => setError('')}
        onBlur={onBlur || field.onBlur}
        {...props}
      />
    </Box>
  );
});
