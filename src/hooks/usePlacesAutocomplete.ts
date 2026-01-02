/// <reference types='google.maps' />
import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { logErrorDebug } from 'src/logger';

// Type assertion due to mismatch b/t @googlemaps/js-api-loader and @types/google.maps definitions
type PlacesApiType = typeof google.maps.places;

export const usePlacesAutocomplete = (apiKey: string) => {
  const [placesApi, setPlacesApi] = useState<PlacesApiType | null>(null);
  const [sessionToken, setSessionToken] = useState<InstanceType<PlacesApiType['AutocompleteSessionToken']> | null>(null);
  const [predictions, setPredictions] = useState<InstanceType<PlacesApiType['AutocompleteSuggestion']>[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create or refresh session token
  const refreshToken = useCallback(() => {
    if (placesApi?.AutocompleteSessionToken) {
      setSessionToken(new placesApi.AutocompleteSessionToken());
    }
  }, [placesApi]);

  // Load Google Places API
  useEffect(() => {
    const loadPlacesAPI = async () => {
      if (!apiKey) {
        setError('API key is missing');
        return;
      }
      try {
        const loader = new Loader({ apiKey, version: 'weekly' });
        const placesLibrary = await loader.importLibrary('places');
        
        if (placesLibrary?.Place && placesLibrary?.AutocompleteSessionToken && placesLibrary?.AutocompleteService) {
          setPlacesApi(placesLibrary as PlacesApiType);
          setError(null);
        } else {
          logErrorDebug('Places API could not be initialized');
          setError('Places API could not be initialized');
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logErrorDebug(`Failed to load Google Places API: ${errMsg}`);
        setError(`Failed to load Google Places API: ${errMsg}`);
      }
    };

    loadPlacesAPI();
  }, [apiKey]);

  // Create initial token when placesApi is first set
  useEffect(() => {
    if (placesApi) refreshToken();
  }, [placesApi, refreshToken]);

  // Fetch address predictions based on user input
  const getPredictions = useCallback(async (input: string) => {
    if (!placesApi || !sessionToken || input.trim() === '') {
      setPredictions([]); // Clear any old predictions if input is empty or API is not ready
      return [];
    }
    try {
      const response = await placesApi.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken
      });
      const results = response.suggestions || [];
      setPredictions(results);
      return results;
    } catch (err) {
      logErrorDebug(`Error fetching suggestions: ${err instanceof Error ? err.message : String(err)}`);
      setPredictions([]);
      return [];
    }
  }, [placesApi, sessionToken]);


  // Get place details from a place prediction
const getPlaceDetails = useCallback(async (placePrediction: google.maps.places.PlacePrediction) => {
    if (!placesApi?.Place) throw new Error('Places API not initialized');
    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents'] });
      refreshToken(); // Reset token regardless of success/failure      
      return place;
    } catch (err) {
      refreshToken(); // Reset token regardless of success/failure
      throw err;
    }
  }, [placesApi, refreshToken]);

  return {
    placesApi,
    predictions,
    error,
    getPredictions,
    getPlaceDetails,
    refreshToken,
    clearPredictions: () => { setPredictions([]) }
  };
}