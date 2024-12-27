// memoizing isn't accomplishing anything since useField causes re-renders anyway

import { useEffect, memo } from 'react';
import { isMobile } from "react-device-detect";
import { useField } from 'formik';
import { PatternFormat } from 'react-number-format';
import { Box, TextField, Button, Checkbox, FormControlLabel, FormControl, RadioGroup, Radio, FormHelperText } from '@mui/material';
import { usePlacesWidget } from "react-google-autocomplete";
import { Label } from 'components/Layout/SharedStyles';

export const Input = memo((props) => {
  const { type = 'text' } = props;
  const Component = inputComponentMapping[type];
  return <Component {...props} />;
});

// not memoized because not used on the main form page,
export const RightAlignedInput = ({ label, ...props }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label name={props.name} sx={{ mr: '.5rem' }}>{label}</Label>
      {/* <Typography variant='body1' sx={{ mr: '.5rem' }}>{label}</Typography> */}
      <Input {...props} />
    </Box>
  );
};

// not memoized because not used on the main form page
const ButtonInput = ({ buttonText, onClick }) => {
  return (
    <Button variant='contained' size='large' color='info' onClick={onClick}>
      <Label sx={{ mr: '.5rem' }}>{buttonText}</Label>
      {/* <Typography variant='body1' sx={{ mr: '.5rem' }}>{buttonText}</Typography> */}
    </Button>
  );
};

const TextInput = memo(({ label, name, type, hidden, onBlur, ...props }) => {
  // console.log('render TextInput:', name);
  const [field, { touched, error }, { setError }] = useField(name);

  const handleFocus = () => setError('');
  const handleBlur = onBlur || field.onBlur;

  const textFieldStyles = {
    mb: '.3rem',
    display: hidden ? 'none' : undefined,
    ...(props.width && { width: props.width })
  };
  
  return (
    <Box>
      <TextField
        sx={textFieldStyles}
        {...field}
        type={type}
        label={label}
        variant='standard'
        error={Boolean(touched && error)}
        helperText={touched && error}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Box>
  );
});

const NumericInput = memo(({ variant, label, name, type, pattern, range, onBlur, ...props }) => {
  // console.log('render NumericInput:', name);
  const isPhoneInput = pattern === '###-###-####'; // replace with more generalizable solution
  const [field, { touched, error }, { setError }] = useField(name);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <PatternFormat
        {...field}
        type={isMobile ? 'tel' : 'text'}
        customInput={TextField}
        label={label}
        format={pattern}
        // onValueChange={() => setValue(isPhoneInput ? field.value : parseInt(field.value))}
        inputMode='numeric'
        variant={variant || 'outlined'}
        error={Boolean(isPhoneInput && touched && error)}
        helperText={isPhoneInput && touched && error}
        onFocus={() => setError('')}
        onBlur={onBlur || field.onBlur}
        {...props}
      />
    </Box>
  );
});

const TextArea = memo(({ label, name, rows }) => {
  // console.log('render TextArea:', name);
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

const CheckboxOption = memo(({ name, option, onChange, ...props }) => {
  const [field] = useField(name);
  return (
    <FormControlLabel
      control={
        <Checkbox
          {...field}
          id={option.value}
          checked={field.value.includes(option.value)}
          value={option.value}
          color="secondary"
          onChange={onChange || field.onChange}
          {...props}
        />
      }
      label={option.label}
    />
  );
});

const CheckboxInput = memo(({ name, label, options, onChange, ...props }) => {
  // console.log('render CheckboxInput:', name);
  return (
    <>
      <Label name={name} sx={{ mb: 1 }}>{label}</Label>
      {options.map((option) => (
        <div key={option.value}>
          <CheckboxOption name={name} option={option} onChange={onChange} {...props} />
        </div>
      ))}
    </>
  );
});

const RadioButtons = memo(({ name, label, options, required, ...props }) => {
  // console.log('render RadioButtons:', name);
  const [field, { touched, error }, { setError }] = useField(name);

  const handleChange = (e) => {
    field.onChange(e);
    setError('');
  };

  return (
    <FormControl error={Boolean(touched && error)}>
      {label &&
        <Label name={name} required={true} sx={{ mb: 1 }}>{label}</Label>
      }
      <RadioGroup
        {...field}
        name={name}
        value={field.value}
        onChange={props.onChange || handleChange}
      >
        {options.map(option => (
          <FormControlLabel
            key={option.value}
            label={option.label}
            value={option.value}
            labelPlacement='end'
            control={<Radio />}
          />
        ))}
      </RadioGroup>
      {touched && error && <FormHelperText sx={{ mt: 2 }}>{error}</FormHelperText>}
    </FormControl>
  );
});

const useAddressFields = (index) => {
  const [,,{ setValue: setAddressValue, setError: setAddressError }] = useField(`people[${index}].address`);
  const [,,{ setValue: setCityValue, setError: setCityError }] = useField(`people[${index}].city`);
  const [,,{ setValue: setStateValue, setError: setStateError }] = useField(`people[${index}].state`);
  const [,,{ setValue: setZipValue, setError: setZipError }] = useField(`people[${index}].zip`);
  const [,,{ setValue: setCountryValue, setError: setCountryError }] = useField(`people[${index}].country`);
  return {
    setAddressValue,
    setCityValue,
    setStateValue,
    setZipValue,
    setCountryValue,
    setAddressError,
    setCityError,
    setStateError,
    setZipError,
    setCountryError,
  };
};

const AddressAutocompleteInput = memo(({ label, name, ...props }) => {
  // console.log('render AddressAutocompleteInput:', name);
  const [field, { touched, error }, { setError }] = useField(name);
  const personIndex = name.split('[')[1].split(']')[0];
  const {
    setAddressValue, setCityValue, setStateValue, setZipValue, setCountryValue,
    setAddressError, setCityError, setStateError, setZipError, setCountryError
  } = useAddressFields(personIndex);

  // fix for errors on these fields not disappearing after browser autofill
  useEffect(() => {
    if (field.value) {
      setError('');
      setCityError('');
      setStateError('');
      setZipError('');
    }
  }, [field.value, setError, setCityError, setStateError, setZipError]);

  const getComponentValue = (addressComponents, componentTypes) => {
    return componentTypes.map(type => {
      const component = addressComponents.find(c => c.types.includes(type));
      return component?.short_name || component?.long_name || '';
    }).join(' ').trim();
  };

  const { ref } = usePlacesWidget({
    apiKey: process.env.REACT_APP_GOOGLE_PLACES_API_KEY,
    onPlaceSelected: (place) => {

      const { address_components } = place;
      if (!address_components) return;

      const fieldToComponentMapping = {
        address: ['street_number', 'route'],
        city: ['locality', 'sublocality_level_1'],
        state: ['administrative_area_level_1'],
        zip: ['postal_code'],
        country: ['country'],
      };

      const fieldValues = Object.keys(fieldToComponentMapping).reduce((acc, field) => {
        const componentTypes = fieldToComponentMapping[field];
        const value = getComponentValue(address_components, componentTypes);
        return { ...acc, [field]: value };
      }, {});

      setAddressValue(fieldValues['address'] || '');
      setCityValue(fieldValues['city'] || '');
      setStateValue(fieldValues['state'] || '');
      setZipValue(fieldValues['zip'] || '');
      setCountryValue(fieldValues['country'] || '');

      setAddressError('');
      setCityError('');
      setStateError('');
      setZipError('');
      setCountryError('');
    },
    options: {
      types: ['address'],
      fields: ['address_components'],
      componentRestrictions: { country: ['us', 'ca'] },
    },
  });

  useEffect(() => {
    const listener = (e) => {
      if (e.key === 'Enter') e.preventDefault();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  return (
    <TextField
      {...field}
      inputRef={ref}
      label={label}
      onFocus={() => setError('')}
      error={Boolean(touched && error)}
      helperText={touched && error ? error : ''}
      {...props}
      onBlur={field.onBlur}
    />
  );
});

const inputComponentMapping = {
  button: ButtonInput,
  checkbox: CheckboxInput,
  radio: RadioButtons,
  pattern: NumericInput,
  textarea: TextArea,
  address: AddressAutocompleteInput,
  email: TextInput,
  text: TextInput,
};
