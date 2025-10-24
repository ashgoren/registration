import { memo } from 'react';
import { useField } from 'formik';
import { FormControl, RadioGroup, FormControlLabel, Radio, FormHelperText } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';
import type { RadioGroupProps } from '@mui/material';
import type { ChangeEvent } from 'react';

type Option = { label: string; value: string; };

interface RadioButtonsProps extends Omit<RadioGroupProps, 'name' | 'value' | 'children'> {
  name: string;
  label?: string;
  options: Option[];
}

export const RadioButtons = memo(({ name, label, options, ...props }: RadioButtonsProps) => {
  const [field, { touched, error }, { setError }] = useField(name);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    field.onChange(e);
    setError('');
  };

  return (
    <FormControl error={Boolean(touched && error)}>
      {label &&
        <Label name={name} required={true} sx={{ mb: 1 }}>{label}</Label>
      }
      <RadioGroup
        {...field}
        name={name}
        value={field.value}
        onChange={props.onChange || handleChange}
      >
        {options.map(option => (
          <FormControlLabel
            key={option.value}
            label={option.label}
            value={option.value}
            labelPlacement='end'
            control={<Radio />}
          />
        ))}
      </RadioGroup>
      {touched && error && <FormHelperText sx={{ mt: 2 }}>{error}</FormHelperText>}
    </FormControl>
  );
});
