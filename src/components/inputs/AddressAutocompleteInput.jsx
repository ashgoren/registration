import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { useField } from 'formik';
import { TextField, Popper, Paper, List, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import { usePlacesAutocomplete } from 'hooks/usePlacesAutocomplete';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const PLACES_FIELD_MAPPING = {
  address: ['street_number', 'route'],
  city: ['locality', 'sublocality_level_1'],
  state: ['administrative_area_level_1'],
  zip: ['postal_code'],
  country: ['country'],
};

export const AddressAutocompleteInput = memo(({ label, name, onAddressSelect, ...props }) => {
  // --- Formik field setup ---
  const [field, meta, helpers] = useField(name);
  const { touched, error } = meta;
  const { setError, setValue } = helpers;

  // Extract person index for related fields
  const personIndex = name.split('[')[1].split(']')[0];

  // --- For setting other address fields ---
  const [,,{ setValue: setCityValue, setError: setCityError }] = useField(`people[${personIndex}].city`);
  const [,,{ setValue: setStateValue, setError: setStateError }] = useField(`people[${personIndex}].state`);
  const [,,{ setValue: setZipValue, setError: setZipError }] = useField(`people[${personIndex}].zip`);
  const [,,{ setValue: setCountryValue }] = useField(`people[${personIndex}].country`);
  
  // --- UI state ---
  const textFieldRef = useRef(null); // to anchor the Popper
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1); // index of the focused suggestion

  // Initialize Places API hook
  const { predictions, getPredictions, getPlaceDetails, clearPredictions } = usePlacesAutocomplete(API_KEY);

  // --- Fix for errors on these fields not disappearing after browser autofill ---
  useEffect(() => {
    if (field.value) {
      setError('');
      setCityError('');
      setStateError('');
      setZipError('');
    }
  }, [field.value, setError, setCityError, setStateError, setZipError]);

  // --- Handle Input Change & Fetch Predictions ---
  const handleInputChange = useCallback(async (event) => {
    const inputValue = event.target.value;
    setValue(inputValue);
    setFocusedSuggestionIndex(-1); // Reset focus when input text changes

    if (inputValue.trim()) {
      await getPredictions(inputValue);
    } else {
      clearPredictions();
    }
  }, [getPredictions, clearPredictions, setValue]);

  // --- Handle Prediction Selection ---
  const handlePredictionSelect = useCallback(async (suggestion) => {
    try {
      if (!suggestion?.placePrediction) return;

      const placePrediction = suggestion.placePrediction;
      clearPredictions();

      const place = await getPlaceDetails(placePrediction);

      if (place?.addressComponents) {
        const addressData = extractAddressComponents(place.addressComponents, PLACES_FIELD_MAPPING);

        // Update all fields directly
        setValue(addressData.address || '');
        setCityValue(addressData.city || '');
        setStateValue(addressData.state || '');
        setZipValue(addressData.zip || '');
        setCountryValue(addressData.country || '');
        
        // Clear errors
        setError('');
        setCityError('');
        setStateError('');
        setZipError('');
      }
    } catch (err) {
      console.error('Error selecting prediction:', err);
    } finally {
      setFocusedSuggestionIndex(-1); // Reset focus after selection
      // note: getPlaceDetails refreshes session token before returning place or error
    }
  }, [getPlaceDetails, clearPredictions, setValue, setCityValue, setStateValue, setZipValue, setCountryValue, setError, setCityError, setStateError, setZipError]);

  // --- Allow keyboard navigation of suggestions ---
  const handleKeyDown = useCallback((event) => {
    if (predictions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); // Prevent cursor moving in text input
        setFocusedSuggestionIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0 // Wrap to top
        );
        break;
      case 'ArrowUp':
        event.preventDefault(); // Prevent cursor moving in text input
        setFocusedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1 // Wrap to bottom
        );
        break;
      case 'Enter':
        event.preventDefault(); // Prevent form submission if inside a form
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < predictions.length) {
          handlePredictionSelect(predictions[focusedSuggestionIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault(); // Clear predictions, closing the Popper
        clearPredictions();
        setFocusedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  }, [predictions, focusedSuggestionIndex, handlePredictionSelect, clearPredictions]);

  return (
    <div className='address-autocomplete-form-field'>
      <TextField
        ref={textFieldRef}
        {...field}
        label={label}
        onFocus={() => setError('')}
        error={Boolean(touched && error)}
        helperText={touched && error ? error : ''}
        {...props}
        onBlur={field.onBlur}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown} 
      />

      <ClickAwayListener onClickAway={clearPredictions}>
        <Popper
          open={predictions.length > 0}
          anchorEl={textFieldRef.current}
          placement='bottom-start'
          style={{
            zIndex: 1300, // MUI's default modal z-index, ensures it's on top
            width: textFieldRef.current ? textFieldRef.current.clientWidth : undefined
          }}
        >
          <Paper elevation={3} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <List dense>
              {predictions.map((suggestion, index) => {
                const placePrediction = suggestion.placePrediction;
                const displayText = typeof placePrediction.text === 'string'
                  ? placePrediction.text
                  : placePrediction.text?.toString();

                return (
                  <ListItemButton
                    key={placePrediction.placeId || `suggestion-${index}`}
                    selected={index === focusedSuggestionIndex}
                    onClick={() => handlePredictionSelect(suggestion)}
                  >
                    <ListItemText primary={displayText || "Invalid suggestion format"} />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </Popper>
      </ClickAwayListener>
    </div>
  );
});

// helpers

const extractAddressComponents = (addressComponents, fieldMapping) => {
  if (!addressComponents) return {};
  
  return Object.entries(fieldMapping).reduce((fields, [fieldName, componentTypes]) => {
    const value = componentTypes.map(type => {
        const component = addressComponents.find(c => c.types.includes(type));
        return component?.shortText || component?.longText || '';
      }).join(' ').trim();
    
    return { ...fields, [fieldName]: value };
  }, {});
};
