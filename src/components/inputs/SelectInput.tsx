import { Field } from 'formik';
import { Select, MenuItem, Typography } from '@mui/material';
import type { FieldProps } from 'formik';
import type { SelectProps } from '@mui/material/Select';

type Option = { label: string; value: string | number };

interface SelectInputProps extends Omit<SelectProps, 'name' | 'children'> {
  name: string;
  options: Option[];
}

export const SelectInput = ({ name, options, ...props }: SelectInputProps) => {
  return (
    <>
      {/* <Typography gutterBottom htmlFor={name}>{label}</Typography> */}
      <Field name={name}>
        {({ field }: FieldProps) => (
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
