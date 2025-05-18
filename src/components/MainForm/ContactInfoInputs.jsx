import { memo } from 'react';
import { Grid } from '@mui/material';
import { Field } from 'components/inputs';
import { config } from 'config';
const { FIELD_CONFIG, INCLUDE_LAST_ON_NAMETAG } = config;

export const ContactInfoInputs = memo(({ fields, index, formikRef }) => {
  console.log('ContactInfoInputs rendered');

  const triggerSetNametagField = `people[${index}].${INCLUDE_LAST_ON_NAMETAG ? 'last' : 'first'}`;
  const setNametag = (e) => {
    const { values, setFieldValue, handleBlur } = formikRef.current;
    handleBlur(e);  // bubble up to default Formik onBlur handler
    const { first, last, nametag } = values.people[index];
    if (nametag) return;
    const fieldsFilled = INCLUDE_LAST_ON_NAMETAG ? first && last : first;
    const newNametag = INCLUDE_LAST_ON_NAMETAG ? `${first} ${last}` : first;
    if (fieldsFilled) {
      setFieldValue(`people[${index}].nametag`, newNametag);
    }
  };

  return (
    <Grid container spacing={2}>
      {fields.map((field) => {
        const fieldConfig = FIELD_CONFIG[field];
        const { label, type, pattern, placeholder, autoComplete, required, hidden, width, suggestions } = fieldConfig;
        const fieldName = `people[${index}].${field}`;
        return (
          <Grid item xs={12} sm={width} key={`${index}-${field}`}>
            <Field
              label={label}
              name={fieldName}
              type={type || 'text'}
              pattern={pattern}
              placeholder={placeholder}
              autoComplete={autoComplete}
              fullWidth
              required={required}
              mask='_'
              variant='standard'
              hidden={hidden}
              suggestions={suggestions}
              onBlur={fieldName === triggerSetNametagField ? setNametag : undefined}
            />
          </Grid>
        );
      })}
    </Grid>
  );
});
