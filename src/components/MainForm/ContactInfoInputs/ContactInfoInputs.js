import { Input } from '../Input';
import { Grid } from '@mui/material';
import config from 'config';
const { FIELD_CONFIG, FIRST_PERSON_CONTACT_FIELDS } = config;

export default function ContactInfoInputs({ fields, index }) {
  const adjustedFields = index === 0 ? FIRST_PERSON_CONTACT_FIELDS : fields;
  return (
    <Grid container spacing={2}>
      {adjustedFields.sort((a, b) => FIELD_CONFIG[a].order - FIELD_CONFIG[b].order)
      .map((field) => (
        <Grid item xs={12} sm={field === 'email' && adjustedFields.includes('emailConfirmation') ? 6 : FIELD_CONFIG[field].width} key={`${index}-${field}`}>
          <Input
            label={FIELD_CONFIG[field].label}
            name={FIELD_CONFIG[field].name || `people[${index}].${field}`} // (special case emailConfirmation)
            type={FIELD_CONFIG[field].type || 'text'}
            pattern={FIELD_CONFIG[field].pattern}
            placeholder={FIELD_CONFIG[field].placeholder}
            autoComplete={FIELD_CONFIG[field].autoComplete}
            fullWidth
            mask='_'
            variant='standard'
            hidden={FIELD_CONFIG[field].hidden}
          />
        </Grid>
      ))}
    </Grid>
  );
}
