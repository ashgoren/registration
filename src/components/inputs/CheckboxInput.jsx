import { memo } from 'react';
import { useField } from 'formik';
import { FormControl, FormHelperText, FormControlLabel, Checkbox } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';
// import { logDebug } from 'src/logger';

const CheckboxOption = memo(({ name, option, onChange, ...props }) => {
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
          {...props}
        />
      }
      label={option.label}
    />
  );
});

export const CheckboxInput = memo(({ name, label, options, onChange, ...props }) => {
  const [, { touched, error }] = useField(name);

  // logDebug('render CheckboxInput:', name);

  return (
    <FormControl error={Boolean(touched && error)}>
      <Label name={name} sx={{ mb: 1 }}>{label}</Label>
      {options.map((option) => (
        <div key={option.value}>
          <CheckboxOption name={name} option={option} onChange={onChange} {...props} />
        </div>
      ))}
      {touched && error && <FormHelperText sx={{ mt: 2 }}>{error}</FormHelperText>}
    </FormControl>
  );
});
