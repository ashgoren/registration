import { memo } from 'react';
import { useField } from 'formik';
import { TextField } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';

export const TextArea = memo(({ label, name, rows }) => {
  const [field] = useField(name);
  return (
    <>
      <Label name={name} sx={{ mb: 2 }}>{label}</Label>
      <TextField
        {...field}
        multiline
        rows={rows}
        sx={{ width: '100%', '& textarea': { resize: 'vertical' } }}
      />
    </>
  );
});
