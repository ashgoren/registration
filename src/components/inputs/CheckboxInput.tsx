import { memo } from 'react';
import { useField } from 'formik';
import { FormControl, FormHelperText, FormControlLabel, Checkbox } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';
import type { CheckboxProps } from '@mui/material/Checkbox';
import type { FormControlProps } from '@mui/material/FormControl';
// import { logDebug } from 'src/logger';

type Option = { label: string; value: string; };

interface CheckboxOptionProps extends Omit<CheckboxProps, 'name' | 'value'> {
  name: string;
  option: Option;
}

const CheckboxOption = memo(({ name, option, onChange }: CheckboxOptionProps) => {
  const [field] = useField(name);
  return (
    <FormControlLabel sx={{ alignItems: 'flex-start' }}
      control={
        <Checkbox
          {...field}
          id={option.value}
          checked={field.value.includes(option.value)}
          value={option.value}
          color="secondary"
          onChange={onChange || field.onChange}
          sx={{ pt: 0.1 }}
        />
      }
      label={option.label}
    />
  );
});

interface CheckboxInputProps extends Omit<FormControlProps, 'error'> {
  name: string;
  label: string;
  options: Option[];
}

export const CheckboxInput = memo(({ name, label, options, onChange }: CheckboxInputProps) => {
  const [, { touched, error }] = useField(name);

  // logDebug('render CheckboxInput:', name);

  return (
    <FormControl error={Boolean(touched && error)}>
      <Label name={name} sx={{ mb: 1 }}>{label}</Label>
      {options.map((option) => (
        <div key={option.value}>
          <CheckboxOption name={name} option={option} onChange={onChange} />
        </div>
      ))}
      {touched && error && <FormHelperText sx={{ mt: 2 }}>{error}</FormHelperText>}
    </FormControl>
  );
});
