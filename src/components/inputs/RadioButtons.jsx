import { memo } from 'react';
import { useField } from 'formik';
import { FormControl, RadioGroup, FormControlLabel, Radio, FormHelperText } from '@mui/material';
import { Label } from 'components/Layout/SharedStyles';

export const RadioButtons = memo(({ name, label, options, required, ...props }) => {
  const [field, { touched, error }, { setError }] = useField(name);

  const handleChange = (e) => {
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
