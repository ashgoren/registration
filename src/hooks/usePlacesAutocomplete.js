import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export const usePlacesAutocomplete = (apiKey) => {
  const [placesApi, setPlacesApi] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);

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
          setPlacesApi(placesLibrary);
          setError(null);
        } else {
          console.error('Places API could not be initialized');
          setError('Places API could not be initialized');
        }
      } catch (err) {
        console.error(`Failed to load Google Places API: ${err.message}`);
        setError(`Failed to load Google Places API: ${err.message}`);
      }
    };

    loadPlacesAPI();
  }, [apiKey]);

  // Create initial token when placesApi is first set
  useEffect(() => {
    if (placesApi) refreshToken();
  }, [placesApi, refreshToken]);
  
  // Fetch address predictions based on user input
  const getPredictions = useCallback(async (input) => {
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
      console.error(`Error fetching suggestions: ${err.message}`);
      setPredictions([]);
      return [];
    }
  }, [placesApi, sessionToken]);


  // Get place details from a place prediction
  const getPlaceDetails = useCallback(async (placePrediction) => {
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