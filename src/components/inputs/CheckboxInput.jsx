import { memo } from 'react';
import { useField } from 'formik';
import { FormControlLabel, Checkbox } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';

const CheckboxOption = memo(({ name, option, onChange, ...props }) => {
  const [field] = useField(name);
  return (
    <FormControlLabel
      control={
        <Checkbox
          {...field}
          id={option.value}
          checked={field.value.includes(option.value)}
          value={option.value}
          color="secondary"
          onChange={onChange || field.onChange}
          {...props}
        />
      }
      label={option.label}
    />
  );
});

export const CheckboxInput = memo(({ name, label, options, onChange, ...props }) => {
  // console.log('render CheckboxInput:', name);
  return (
    <>
      <Label name={name} sx={{ mb: 1 }}>{label}</Label>
      {options.map((option) => (
        <div key={option.value}>
          <CheckboxOption name={name} option={option} onChange={onChange} {...props} />
        </div>
      ))}
    </>
  );
});
