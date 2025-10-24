import { Box } from '@mui/material';
import { Label } from 'components/layouts/SharedStyles';
import { ButtonInput, CheckboxInput, RadioButtons, NumericInput, TextArea, AddressAutocompleteInput, TextInput, AutocompleteInput, SelectInput } from '.';
import type { ComponentProps } from 'react';
import type { FocusEventHandler } from 'react';

type BaseFieldProps = {
  alignRight?: boolean;
};

type NumericInputProps = {
  variant?: 'filled' | 'outlined' | 'standard';
  label: string;
  name: string;
  pattern: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

type FieldProps = BaseFieldProps & (
  | ({ type?: 'text' | 'email' } & ComponentProps<typeof TextInput>)
  | ({ type: 'pattern' } & NumericInputProps)
  | ({ type: 'address' } & ComponentProps<typeof AddressAutocompleteInput>)
  | ({ type: 'autocomplete' } & ComponentProps<typeof AutocompleteInput>)
  | ({ type: 'textarea' } & ComponentProps<typeof TextArea>)
  | ({ type: 'checkbox' } & ComponentProps<typeof CheckboxInput>)
  | ({ type: 'radio' } & ComponentProps<typeof RadioButtons>)
  | ({ type: 'select' } & ComponentProps<typeof SelectInput>)
  | ({ type: 'button' } & ComponentProps<typeof ButtonInput>)
);

export const Field = ({ alignRight, type = 'text', ...props }: FieldProps) => {
  const inputProps = alignRight ? { ...props, label: undefined } : props;

  const renderInput = () => {
    switch (type) {
      case 'text':
      case 'email':
        return <TextInput {...inputProps as ComponentProps<typeof TextInput>} />;
      case 'pattern':
        return <NumericInput {...inputProps as ComponentProps<typeof NumericInput>} />;
      case 'address':
        return <AddressAutocompleteInput {...inputProps as ComponentProps<typeof AddressAutocompleteInput>} />;
      case 'autocomplete':
        return <AutocompleteInput {...inputProps as ComponentProps<typeof AutocompleteInput>} />;
      case 'textarea':
        return <TextArea {...inputProps as ComponentProps<typeof TextArea>} />;
      case 'checkbox':
        return <CheckboxInput {...inputProps as ComponentProps<typeof CheckboxInput>} />;
      case 'radio':
        return <RadioButtons {...inputProps as ComponentProps<typeof RadioButtons>} />;
      case 'select':
        return <SelectInput {...inputProps as ComponentProps<typeof SelectInput>} />;
      case 'button':
        return <ButtonInput {...inputProps as ComponentProps<typeof ButtonInput>} />;
    }
  };

  if (alignRight) {
    const { label, name } = props as { label: string; name: string };
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label name={name} sx={{ mr: '.5rem' }}>{label}</Label>
        {renderInput()}
      </Box>
    );
  }

  return renderInput();
};
