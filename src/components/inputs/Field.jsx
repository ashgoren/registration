import { Box } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';
import { ButtonInput, CheckboxInput, RadioButtons, NumericInput, TextArea, AddressAutocompleteInput, TextInput, AutocompleteInput, SelectInput } from './';

const inputComponents = {
  text: TextInput,
  email: TextInput,
  pattern: NumericInput,
  address: AddressAutocompleteInput,
  autocomplete: AutocompleteInput,
  textarea: TextArea,
  checkbox: CheckboxInput,
  radio: RadioButtons,
  select: SelectInput,
  button: ButtonInput
};

export const Field = ({ alignRight, type = 'text', ...props }) => {
  const Component = inputComponents[type];

  if (alignRight) {
    const { label, ...rest } = props;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label name={props.name} sx={{ mr: '.5rem' }}>{label}</Label>
        <Component {...rest} />
      </Box>
    );
  }

  return <Component {...props} />;
};
