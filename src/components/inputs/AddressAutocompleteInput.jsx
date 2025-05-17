import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { useField } from 'formik';
import { TextField, Popper, Paper, List, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// --- This hook is for Formik integration to set other related fields (city, state, etc.) ---
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

  // --- Formik Setup ---
  const [field, meta, helpers] = useField(name);
  const { touched, error } = meta;
  const { setError, setValue: setFormikFieldValue } = helpers;

  // --- Google Places API State ---
  const [placesApiModule, setPlacesApiModule] = useState(null); // Will hold the entire placesLibrary module
  const [sessionToken, setSessionToken] = useState(null); // Will hold the AutocompleteSessionToken instance
  const [predictions, setPredictions] = useState([]); // Will store Suggestion[] from the new API
  const [apiFailedToLoad, setApiFailedToLoad] = useState(false);

  // --- Ref for the TextField to anchor the Popper ---
  const textFieldRef = useRef(null);

  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);

  // --- For setting other address fields ---
  const personIndex = name.split('[')[1].split(']')[0];
  const {
    setAddressValue, setCityValue, setStateValue, setZipValue, setCountryValue,
    setAddressError, setCityError, setStateError, setZipError, setCountryError
  } = useAddressFields(personIndex);

  // --- Fix for errors on these fields not disappearing after browser autofill ---
  useEffect(() => {
    if (field.value) {
      setError('');
      setCityError('');
      setStateError('');
      setZipError('');
    }
  }, [field.value, setError, setCityError, setStateError, setZipError]);


  // --- Load Google Maps API ---
  useEffect(() => {
    if (!API_KEY) {
      console.error('ERROR: VITE_GOOGLE_PLACES_API_KEY is missing. Google Places Autocomplete will not function.');
      setApiFailedToLoad(true);
      return;
    }

    const loader = new Loader({ apiKey: API_KEY, version: 'weekly' });

    loader.importLibrary('places')
      .then((placesLibrary) => {
        if (placesLibrary?.Place && placesLibrary?.AutocompleteSessionToken && placesLibrary?.AutocompleteSuggestion) {
          console.log('Google Places API loaded successfully.');
          setPlacesApiModule(placesLibrary); // Store the entire placesLibrary module for later use
          setSessionToken(new placesLibrary.AutocompleteSessionToken()); // Instantiate the session token
          setApiFailedToLoad(false);
        } else {
          console.error('Google Places API could not be initialized. Autocomplete will not function.');
          setApiFailedToLoad(true);
        }
      })
      .catch(error => {
        console.error('Failed to load Google Places API. Autocomplete will not function:', error);
        setApiFailedToLoad(true);
      });
  }, []);
  

  // --- Handle Input Change & Fetch Predictions ---
  const handleInputChange = useCallback(async (event) => {
    const inputValue = event.target.value;
    setFormikFieldValue(inputValue);
    setFocusedSuggestionIndex(-1); // Reset focus when input text changes

    // Only proceed if API is ready and input is not empty
    if (apiFailedToLoad || !placesApiModule || !sessionToken || inputValue.trim() === '') {
      setPredictions([]); // Clear any old predictions
      return;
    }

    // Construct the request for fetchAutocompleteSuggestions
    const request = {
      input: inputValue,
      sessionToken: sessionToken
    };

    // console.log('Fetching suggestions for:', inputValue);
    try {
      const response = await placesApiModule.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      setPredictions(response.suggestions || []);
      // console.log("Suggestions received:", response.suggestions);
    } catch (e) {
      console.error("Error fetching suggestions:", e);
      setPredictions([]); // Clear predictions on error
    }
  }, [placesApiModule, sessionToken, apiFailedToLoad, setFormikFieldValue]);


  // --- Handle Prediction Selection ---
  const handlePredictionSelect = useCallback(async (suggestion) => {
    // suggestion is an object like { placePrediction: PlacePredictionV2 }
    // PlacePredictionV2 has .text (object with a toString() or direct string) and .toPlace()
    if (!suggestion?.placePrediction || !placesApiModule?.Place || !placesApiModule?.AutocompleteSessionToken) {
      console.error('Cannot process selection, essential API classes or prediction data missing.');
      setPredictions([]); // Clear suggestions
      return;
    }
    const placePrediction = suggestion.placePrediction;

    console.log("User selected suggestion:", placePrediction);
    setPredictions([]); // Clear suggestions, which will close the Popper

    try {
      // 1. Get a Place instance from the prediction
      const place = placePrediction.toPlace();

      // 2. Fetch the required fields for this Place.
      await place.fetchFields({ fields: ['addressComponents'] });

      console.log("Full place details fetched successfully:", place);
      console.log("Address Components:", place.addressComponents);

      // 3. Use the address components to set the Formik fields
      if (!place.addressComponents) {
        console.error("No address components found in the place details.");
        return;
      }

      const fieldToComponentMapping = {
        address: ['street_number', 'route'],
        city: ['locality', 'sublocality_level_1'],
        state: ['administrative_area_level_1'],
        zip: ['postal_code'],
        country: ['country'],
      };

      const getComponentValue = (addressComponents, componentTypes) => {
        return componentTypes.map(type => {
          const component = addressComponents.find(c => c.types.includes(type));
          console.log("Component found for type:", type, component);
          return component?.shortText || component?.longText || '';
        }).join(' ').trim();
      };

      const fieldValues = Object.keys(fieldToComponentMapping).reduce((acc, field) => {
        const componentTypes = fieldToComponentMapping[field];
        const value = getComponentValue(place.addressComponents, componentTypes);
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

    } catch (e) {
      console.error("Error fetching place details:", e);
    } finally {
      setFocusedSuggestionIndex(-1); // Reset focus after selection
      // End current session by generating new session token (must happen regardless of success/failure)
      if (placesApiModule?.AutocompleteSessionToken) {
        console.log("Concluding current autocomplete session and creating a new session token.");
        setSessionToken(new placesApiModule.AutocompleteSessionToken());
      }
    }
  }, [placesApiModule, setAddressValue, setCityValue, setStateValue, setZipValue, setCountryValue, setAddressError, setCityError, setStateError, setZipError, setCountryError]);


  // --- Allow keyboard navigation of suggestions ---
  const handleKeyDown = useCallback((event) => {
    // Only handle key events if there are predictions
    if (apiFailedToLoad || predictions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); // Prevent cursor moving in text input
        setFocusedSuggestionIndex(prevIndex =>
          prevIndex < predictions.length - 1 ? prevIndex + 1 : 0 // Wrap to top
        );
        break;
      case 'ArrowUp':
        event.preventDefault(); // Prevent cursor moving in text input
        setFocusedSuggestionIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : predictions.length - 1 // Wrap to bottom
        );
        break;
      case 'Enter':
        event.preventDefault(); // Prevent form submission if inside a form
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < predictions.length) {
          handlePredictionSelect(predictions[focusedSuggestionIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setPredictions([]); // Clear predictions, closing the Popper
        setFocusedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  }, [apiFailedToLoad, predictions, focusedSuggestionIndex, handlePredictionSelect, setPredictions]);


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

      <ClickAwayListener onClickAway={() => setPredictions([])}>
        <Popper
          open={!apiFailedToLoad && predictions.length > 0}
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
