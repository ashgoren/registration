import { memo, useState } from 'react';
import { Grid, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { Field } from 'components/inputs';
import { config } from 'config';
import { logDebug } from 'src/logger';
import type { FormikProps } from 'formik';
import type { Order, Person } from 'types/order';
import type { RefObject, FocusEvent } from 'react';

const { FIELD_CONFIG, INCLUDE_LAST_ON_NAMETAG } = config;

export const ContactInfoInputs = memo(({ fields, index, formikRef }:
  { fields: string[]; index: number; formikRef: RefObject<FormikProps<Order>> }
) => {
  logDebug('ContactInfoInputs rendered');

  const addressFields = fields.filter((field) => ['address', 'apartment', 'city', 'state', 'zip', 'country'].includes(field));
  const otherFields = fields.filter((field) => !addressFields.includes(field));
  const mainFields = fields.includes('address') ? otherFields : fields;
  const firstPersonValues = index > 0 ? formikRef.current.values.people[0] as Person : null;
  const [isChecked, setIsChecked] = useState(false);

  const triggerSetNametagField = `people[${index}].${INCLUDE_LAST_ON_NAMETAG ? 'last' : 'first'}`;
  const setNametag = (e: FocusEvent<HTMLInputElement>) => {
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
    <>
      <Grid container spacing={2}>
        {mainFields.map((field) => {
          const fieldConfig = FIELD_CONFIG[field];
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
                          formikRef.current.setFieldValue(fieldName, (firstPersonValues as Person)[field]);
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
              const fieldConfig = FIELD_CONFIG[field];
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
