import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useField } from 'formik';
import { TextField, Box } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const defaultFilterOptions = createFilterOptions({
  matchFrom: 'any',
  stringify: (option) => `${option?.fullName || ''} ${option?.abbreviation || ''}`
});

export const AutocompleteInput = ({ label, name, suggestions = [], filterOptions = defaultFilterOptions, ...props }) => {
  const [field, { touched, error }, { setValue, setError, setTouched }] = useField(name);
  const [open, setOpen] = useState(false);
  const wasManuallyTriggered = useRef(false);
  const isAutofilling = useRef(false);
  const textFieldRef = useRef(null);
  const isFreeSoloActive = props.freeSolo !== false;

  const textFieldStyles = { mb: '.3rem', ...(props.width && { width: props.width })};

  const getOptionLabel = (option) => typeof option === 'string' ? option : option?.abbreviation || '';

  let autocompleteValue = null;
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
      return option.abbreviation === value.abbreviation || option.fullName === value.fullName;
    }
    return false;
  };

  const handleAutocompleteInputChange = (event, newValue, reason) => {
    if (reason === 'input') {
      const isLikelyAutofill = !wasManuallyTriggered.current && (!event || (event && event.type !== 'keydown' && event.type !== 'paste'));

      if (wasManuallyTriggered.current) {
        if (newValue.length > 0) {
          if (!open) setOpen(true);
        } else {
          if (open) setOpen(false);
        }
        wasManuallyTriggered.current = false;
      } else if (isLikelyAutofill) {
        isAutofilling.current = true;
        if (open) setOpen(false);
        // reset isAutofilling.current shortly after to avoid blocking future opens
        setTimeout(() => {
          isAutofilling.current = false;
        }, 100);
      }
    } else if (reason === 'clear') { // when the input is cleared
      if (open) setOpen(false);
      wasManuallyTriggered.current = false;
      isAutofilling.current = false;
    }
    // For 'reset' (when an option is selected and input text is updated),
    // `onChange` handles the value, and `onClose` (if triggered) handles the `open` state.

    setValue(newValue);
    setError('');
  };

  const handleAutocompleteBlur = (event) => {
    setTouched(true);
    const value = event.target.value || '';
    const foundOption = suggestions.find(opt => opt.fullName?.toLowerCase() === value.toLowerCase() || opt.abbreviation?.toLowerCase() === value.toLowerCase());
    if (foundOption) setValue(foundOption.abbreviation);
  };

  const handleAutocompleteOpen = () => {
    if (isAutofilling.current) {
      isAutofilling.current = false; // reset flag
      return;
    }
    if (!open) setOpen(true);
  };

  const handleAutocompleteClose = () => {
    if (open) setOpen(false);
    wasManuallyTriggered.current = false; // reset flag
    isAutofilling.current = false; // reset flag
  };

  // Some browsers trigger 'animationstart' event on inputs during autofill
  useEffect(() => {
    const inputElement = textFieldRef.current;
    const handleAutofillAnimation = (event) => {
      if (event.animationName === 'mui-auto-fill' || event.animationName === 'mui-auto-fill-cancel') {
        isAutofilling.current = true;
        if (open) setOpen(false);
        setTimeout(() => {
          isAutofilling.current = false;
        }, 100);
      }
    };
    if (inputElement) inputElement.addEventListener('animationstart', handleAutofillAnimation);
    return () => {
      if (inputElement) inputElement.removeEventListener('animationstart', handleAutofillAnimation);
    };
  }, [open]);

  const handleLocalKeyDown = useCallback((event) => {
    if ((event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) || ['Backspace', 'Delete'].includes(event.key)) {
      wasManuallyTriggered.current = true;
      isAutofilling.current = false;
    }
  }, []);

  const handleLocalPaste = useCallback(() => {
    wasManuallyTriggered.current = true;
    isAutofilling.current = false;
  }, []);

  return (
    <Autocomplete
      open={open}
      onOpen={handleAutocompleteOpen}
      onClose={handleAutocompleteClose}
      onInputChange={handleAutocompleteInputChange}
      id={`${name}-autocomplete`}
      options={suggestions}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      value={autocompleteValue}
      renderOption={(renderOptionProps, option) => (
        <Box component='li' {...renderOptionProps} key={option.id || option.abbreviation}>
          {option.fullName}
        </Box>
      )}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => {
        const { InputProps: paramsInputProps, ...restParams } = params;
        return (
          <TextField
            name={field.name}
            onFocus={() => setError('')}
            sx={textFieldStyles}
            label={label}
            variant='standard'
            error={Boolean(touched && error)}
            helperText={touched && error}
            {...restParams}
            inputRef={textFieldRef}
            InputProps={{
              ...paramsInputProps,
              onKeyDownCapture: handleLocalKeyDown,
              onPaste: handleLocalPaste,
            }}
            required={props.required}
            autoComplete={props.autoComplete}
            fullWidth={props.fullWidth}
          />
        );
      }}
      freeSolo={isFreeSoloActive}
      onBlur={handleAutocompleteBlur}
      disabled={props.disabled}
    />
  );
}