import { Field } from 'formik';
import { Select, MenuItem, Typography } from '@mui/material';

export const SelectInput = ({ name, label, options, ...props }) => {
  return (
    <>
      <Typography gutterBottom htmlFor={name}>{label}</Typography>
      <Field name={name}>
        {({ field }) => (
          <Select
            id={name}
            {...field}
            {...props}
            value={field.value || ''}
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Typography variant="body1" sx={{ textAlign: 'left'}}>{option.label}</Typography>
              </MenuItem>
            ))}
          </Select>
        )}
      </Field>
    </>
  );
}
