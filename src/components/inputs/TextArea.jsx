import { memo } from 'react';
import { useField } from 'formik';
import { TextField, FormHelperText } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';

export const TextArea = memo(({ label, name, rows }) => {
  const [field, { touched, error }, { setError }] = useField(name);

  return (
    <>
      <Label name={name} sx={{ mb: 2 }}>{label}</Label>
      <TextField
        {...field}
        multiline
        rows={rows}
        sx={{ width: '100%', '& textarea': { resize: 'vertical' } }}
        onFocus={() => error && setError('')}
      />
      {touched && error && <FormHelperText sx={{ mt: 2 }} error>{error}</FormHelperText>}
    </>
  );
});
