import { memo, useEffect } from 'react';
import { useField } from 'formik';
import { TextField } from '@mui/material';
import { usePlacesWidget } from 'react-google-autocomplete';

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

export const AddressAutocompleteInput = memo(({ label, name, ...props }) => {
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
    apiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
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
