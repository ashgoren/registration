import { memo, useState } from 'react';
import { useFormikContext } from 'formik';
import { Grid, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { Field } from 'components/inputs';
import { config } from 'config';
// import { logDebug } from 'src/logger';
import type { Order, Person } from 'types/order';
import type { FocusEvent } from 'react';

export const ContactInfoInputs = memo(({ fields, index }:{ fields: string[]; index: number; }) => {
  // logDebug('ContactInfoInputs rendered');

  const { values, setFieldValue, handleBlur } = useFormikContext<Order>();

  const addressFields = fields.filter((field) => ['address', 'apartment', 'city', 'state', 'zip', 'country'].includes(field));
  const otherFields = fields.filter((field) => !addressFields.includes(field));
  const mainFields = fields.includes('address') ? otherFields : fields;
  const firstPersonValues = index > 0 ? values.people[0] as Person : null;
  const [isChecked, setIsChecked] = useState(false);

  const triggerSetNametagField = `people[${index}].${config.nametags.includeLastName ? 'last' : 'first'}`;
  const setNametag = (e: FocusEvent<HTMLInputElement>) => {
    handleBlur(e);  // bubble up to default Formik onBlur handler
    const { first, last, nametag } = values.people[index];
    if (nametag) return;
    const fieldsFilled = config.nametags.includeLastName ? first && last : first;
    const newNametag = config.nametags.includeLastName ? `${first} ${last}` : first;
    if (fieldsFilled) {
      setFieldValue(`people[${index}].nametag`, newNametag);
    }
  };

  return (
    <>
      {/* <Typography variant='body1' gutterBottom sx={{ my: 2 }}>
        If using browser autofill, don't forget the optional pronouns field.
      </Typography> */}
      <Grid container spacing={2}>
        {mainFields.map((field) => {
          const fieldConfig = config.fields.fieldsConfig[field];
          const { label, type, pattern, placeholder, autoComplete, required, hidden, width } = fieldConfig;
          const fieldName = `people[${index}].${field}`;

          if (typeof label !== 'string') {
            throw new Error(`ContactInfoInputs: label for field "${field}" is not a string`);
          }

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
                variant='standard'
                hidden={hidden}
                onBlur={fieldName === triggerSetNametagField ? setNametag : undefined}
              />
            </Grid>
          );
        })}
      </Grid>

      {fields.includes('address') &&
        <>
          <FormGroup sx={{ mt: 2 }}>
            {index > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={(e) => {
                      const { checked } = e.target;
                      setIsChecked(checked);
                      if (checked) {
                        addressFields.forEach((field) => {
                          const fieldName = `people[${index}].${field}`;
                          setFieldValue(fieldName, (firstPersonValues as Person)[field]);
                        });
                      }
                    }}
                  />
                }
                label={`Copy address from ${(firstPersonValues as Person).first} ${(firstPersonValues as Person).last}`}
              />
            )}
          </FormGroup>

          <Grid container spacing={2}>
            {addressFields.map((field) => {
              const fieldConfig = config.fields.fieldsConfig[field];
              const { label, type, pattern, placeholder, autoComplete, required, hidden, width, suggestions } = fieldConfig;
              const fieldName = `people[${index}].${field}`;

              if (typeof label !== 'string') {
                throw new Error(`ContactInfoInputs: label for field "${field}" is not a string`);
              }

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
                    variant='standard'
                    hidden={hidden}
                    suggestions={suggestions}
                    onBlur={fieldName === triggerSetNametagField ? setNametag : undefined}
                    disabled={isChecked}
                  />
                </Grid>
              );
            })}
          </Grid>
        </>
      }

    </>
  );
});
