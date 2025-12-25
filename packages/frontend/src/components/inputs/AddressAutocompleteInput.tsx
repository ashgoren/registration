import { memo, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useField } from 'formik';
import { TextField, Popper, Paper, List, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import { usePlacesAutocomplete } from 'hooks/usePlacesAutocomplete';
import { logErrorDebug } from 'src/logger';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { TextFieldProps } from '@mui/material';
const { VITE_GOOGLE_PLACES_API_KEY } = import.meta.env;

interface AddressAutocompleteInputProps extends Omit<TextFieldProps, 'name' | 'label'> {
  label: string;
  name: string;
}

interface AddressData {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// interface AddressComponent {
//   types: string[];
//   shortText?: string | null;
//   longText?: string | null;
// }

interface FieldUpdater {
  fieldName: string;
  setValue: (text: string) => void;
  setError: (text: string) => void;
}

interface FieldMapping {
  [key: string]: string[];
}

const PLACES_FIELD_MAPPING: FieldMapping = {
  address: ['street_number', 'route'],
  city: ['locality', 'sublocality_level_1'],
  state: ['administrative_area_level_1'],
  zip: ['postal_code'],
  country: ['country'],
};

export const AddressAutocompleteInput = memo(({ label, name, ...props }: AddressAutocompleteInputProps) => {
  // --- Formik field setup ---
  const [field, meta, helpers] = useField(name);
  const { touched, error } = meta;
  const { setError, setValue } = helpers;

  // Get field updaters for related fields
  const personIndex = name.split('[')[1].split(']')[0];
  const relatedFieldUpdaters = useRelatedFieldUpdaters(personIndex);

  // --- UI state ---
  const textFieldRef = useRef<HTMLDivElement>(null); // to anchor the Popper
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1); // index of the focused suggestion
  const wasManuallyTriggered = useRef(false);

  // Initialize Places API hook
  const { predictions, getPredictions, getPlaceDetails, clearPredictions } = usePlacesAutocomplete(VITE_GOOGLE_PLACES_API_KEY);

  // --- Fix for errors on these fields not disappearing after browser autofill ---
  useEffect(() => {
    if (field.value) {
      setError('');
      for (const { setError: setRelatedError } of relatedFieldUpdaters) {
        setRelatedError('');
      }
    }
  }, [field.value, relatedFieldUpdaters, setError]);

  // --- Handle Input Change & Fetch Predictions ---
  const handleInputChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setValue(inputValue);
    setFocusedSuggestionIndex(-1); // Reset focus when input text changes

    const isManualInput = wasManuallyTriggered.current;
    wasManuallyTriggered.current = false;

    if (inputValue.trim() && isManualInput) {
      await getPredictions(inputValue);
    } else {
      clearPredictions();
    }
  }, [getPredictions, clearPredictions, setValue]);

  // --- Handle Prediction Selection ---
  const handlePredictionSelect = useCallback(async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    try {
      if (!suggestion?.placePrediction) return;

      const placePrediction = suggestion.placePrediction;
      clearPredictions();

      const place = await getPlaceDetails(placePrediction);

      if (place?.addressComponents) {
        const addressData = extractAddressComponents(place.addressComponents, PLACES_FIELD_MAPPING);

        // set value for address field
        setValue(addressData.address || ''); // Set the main address field
        setError(''); // Clear error for the main address field

        // Set values for related fields (city, state, zip, country)
        for (const { fieldName, setValue: setRelatedValue, setError: setRelatedError } of relatedFieldUpdaters) {
          setRelatedValue(addressData[fieldName as keyof AddressData] || '');
          setRelatedError('');
        }
      }
    } catch (err) {
      logErrorDebug('Error selecting prediction:', err);
    } finally {
      setFocusedSuggestionIndex(-1); // Reset focus after selection
      // note: getPlaceDetails refreshes session token before returning place or error
    }
  }, [getPlaceDetails, clearPredictions, setValue, setError, relatedFieldUpdaters]);

  // --- Allow keyboard navigation of suggestions ---
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (
      (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) || // Printable characters
      event.key === 'Backspace' ||
      event.key === 'Delete'
    ) {
      wasManuallyTriggered.current = true;
    }

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
      case 'Tab':
        clearPredictions();
        setFocusedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  }, [predictions, focusedSuggestionIndex, handlePredictionSelect, clearPredictions]);

  // --- Trigger autocomplete suggestions on paste ---
  const handlePaste = useCallback(() => {
    wasManuallyTriggered.current = true;
  }, []);

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
        onPaste={handlePaste}
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
              {predictions.map((suggestion: google.maps.places.AutocompleteSuggestion, index: number) => {
                const placePrediction = suggestion.placePrediction;
                if (!placePrediction) {
                  logErrorDebug('Invalid suggestion format:', suggestion);
                  return null;
                }

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

const extractAddressComponents = (
  addressComponents: google.maps.places.AddressComponent[],
  fieldMapping: FieldMapping
): AddressData => {
  if (!addressComponents) return {};
  
  return Object.entries(fieldMapping).reduce((fields, [fieldName, componentTypes]) => {
    const value = componentTypes.map(type => {
        const component = addressComponents.find(c => c.types.includes(type));
        return component?.shortText || component?.longText || '';
      }).join(' ').trim();
    
    return { ...fields, [fieldName]: value };
  }, {} as AddressData);
};

const useRelatedFieldUpdaters = (personIndex: string): FieldUpdater[] => {
  const [, , cityHelpers] = useField(`people[${personIndex}].city`);
  const [, , stateHelpers] = useField(`people[${personIndex}].state`);
  const [, , zipHelpers] = useField(`people[${personIndex}].zip`);
  const [, , countryHelpers] = useField(`people[${personIndex}].country`);

  return useMemo(() => [
    {
      fieldName: 'city',
      setValue: (text: string) => cityHelpers.setValue(text || ''),
      setError: (text: string) => cityHelpers.setError(text || '')
    },
    {
      fieldName: 'state',
      setValue: (text: string) => stateHelpers.setValue(text || ''),
      setError: (text: string) => stateHelpers.setError(text || '')
    },
    {
      fieldName: 'zip',
      setValue: (text: string) => zipHelpers.setValue(text || ''),
      setError: (text: string) => zipHelpers.setError(text || '')
    },
    {
      fieldName: 'country',
      setValue: (text: string) => countryHelpers.setValue(text || ''),
      setError: (text: string) => countryHelpers.setError(text || '')
    }
  ], [cityHelpers, stateHelpers, zipHelpers, countryHelpers]);
};
