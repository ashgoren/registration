import React, { useState, useRef, useCallback } from 'react';
import { useField } from 'formik';
import { TextField, Box } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const defaultFilterOptions = createFilterOptions({
  matchFrom: 'any',
  stringify: (option) => `${option?.fullName || ''} ${option?.abbreviation || ''}`
});

export const AutocompleteInput = ({
  label,
  name,
  suggestions = [],
  filterOptions = defaultFilterOptions,
  // freeSolo is expected in props or defaulted below.
  // Add a prop to decide if dropdown opens on empty manual input.
  openDropdownOnManualEmptyInput = false,
  ...props
}) => {
  const [field, { touched, error }, { setValue, setError, setTouched }] = useField(name);
  const [open, setOpen] = useState(false);
  const wasManuallyTriggered = useRef(false);

  const handleFocus = () => {
    setError('');
    // We don't open on focus by default; we wait for a manual input trigger.
  };

  const textFieldStyles = {
    mb: '.3rem',
    ...(props.width && { width: props.width })
  };

  const getOptionValue = (option) => option?.abbreviation || '';
  const getOptionLabel = (option) => typeof option === 'string' ? option : option?.fullName || '';

  let autocompleteValue = null;
  const isFreeSoloActive = props.freeSolo !== false; // Default freeSolo to true if undefined or true

  if (field.value) {
    const foundOption = suggestions.find(opt => opt.abbreviation === field.value);
    if (foundOption) {
      autocompleteValue = foundOption;
    } else if (isFreeSoloActive) {
      autocompleteValue = field.value;
    }
  }

  const isOptionEqualToValue = (option, value) => {
    if (typeof value === 'string') {
      return option.abbreviation === value || option.fullName === value;
    }
    if (typeof value === 'object' && value !== null && option) {
      if (option.id !== undefined && value.id !== undefined) {
        return option.id === value.id;
      }
      return option.abbreviation === value.abbreviation;
    }
    return false;
  };

  // --- Manual Input Detection Handlers ---
  const handleLocalKeyDown = useCallback((event) => {
    if (
      (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) ||
      ['Backspace', 'Delete'].includes(event.key)
    ) {
      wasManuallyTriggered.current = true;
    }
    // Autocomplete's own keydown handlers will manage navigation (arrows, Enter, Escape)
    // which might trigger onOpen or onClose.
  }, []);

  const handleLocalPaste = useCallback(() => {
    wasManuallyTriggered.current = true;
  }, []);


  // --- Autocomplete Event Handlers ---
  const handleAutocompleteChange = (event, newValue, reason) => { // This is Autocomplete's `onChange`
    let formikValueToSet = '';
    if (typeof newValue === 'string') {
      formikValueToSet = newValue;
    } else if (newValue) {
      formikValueToSet = getOptionValue(newValue);
    }
    setValue(formikValueToSet);
    setError('');
    // `onClose` will be called if a selection closes the dropdown,
    // which will update our `open` state.
  };

  const handleAutocompleteBlur = () => { // This is Autocomplete's `onBlur`
    setTouched(true);
    // `onClose` will typically be called by Autocomplete if blurring causes it to close.
  };

  const handleAutocompleteInputChange = (event, newInputValue, reason) => {
    if (reason === 'input') { // Caused by typing, paste, or external change (like autofill)
      if (wasManuallyTriggered.current) {
        if (newInputValue.length > 0 || openDropdownOnManualEmptyInput) {
          setOpen(true);
        } else {
          setOpen(false); // Close if manual input resulted in empty field & not configured to open
        }
        wasManuallyTriggered.current = false; // Reset flag after use
      } else {
        // Input changed, but not by our detected manual triggers.
        // This is likely browser autofill or a programmatic change we didn't flag.
        // We explicitly DO NOT open the dropdown here.
        // If the dropdown was somehow open, we could even force it closed:
        // if (open) setOpen(false);

        // Autocomplete's internal inputValue is now `newInputValue`.
        // If `freeSolo` is active, on blur, Autocomplete will call its `onChange`
        // (our `handleAutocompleteChange`) with this `newInputValue`, updating Formik.
        // This ensures the autofilled value is accepted by Formik without popping the dropdown.
      }
    } else if (reason === 'clear') {
      // When the clear button is pressed.
      setOpen(false);
      wasManuallyTriggered.current = false; // Also reset flag
    }
    // For 'reset' (when an option is selected and input text is updated),
    // `onChange` handles the value, and `onClose` (if triggered) handles the `open` state.
  };

  return (
    <Autocomplete
      // Controlled open state
      open={open}
      onOpen={() => {
        // Triggered by Autocomplete (e.g., arrow click, sometimes arrow keys if it has items).
        // We consider this a valid reason to open.
        setOpen(true);
      }}
      onClose={(event, reason) => {
        setOpen(false);
        wasManuallyTriggered.current = false; // Always reset flag on close
      }}

      // Input change handling
      onInputChange={handleAutocompleteInputChange}

      id={`${name}-autocomplete`}
      options={suggestions}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      value={autocompleteValue}
      renderOption={(renderOptionProps, option) => (
        <Box component="li" {...renderOptionProps} key={option.id || option.abbreviation}>
          {option.fullName} ({option.abbreviation})
        </Box>
      )}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => {
        // Merge InputProps from Autocomplete with our custom event handlers
        const { InputProps: paramsInputProps, ...restParams } = params;
        return (
          <TextField
            name={field.name}
            onFocus={handleFocus}
            sx={textFieldStyles}
            label={label}
            variant='standard'
            error={Boolean(touched && error)}
            helperText={touched && error}
            {...restParams} // Spread other params (value, fullWidth, size, etc.)
            InputProps={{
              ...paramsInputProps, // Autocomplete's adornments, etc.
              onKeyDownCapture: handleLocalKeyDown, // Use capture for keydown
              onPaste: handleLocalPaste,
            }}
            {...props} // User-passed props like 'placeholder' to TextField
          />
        );
      }}
      onChange={handleAutocompleteChange}
      onBlur={handleAutocompleteBlur}
      // Default freeSolo to true if the prop is not explicitly passed as false
      freeSolo={isFreeSoloActive}
      // Pass down other Autocomplete-specific props from ...props
      {...props}
    />
  );
}