#!/bin/bash

# Read each line in the .env file
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Trim whitespace from the key and value
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Skip blank lines and comments
    [[ -z "$key" || "$key" == \#* ]] && continue

    # Skip the VITE_USE_FIREBASE_EMULATOR key
    [[ "$key" == "VITE_USE_FIREBASE_EMULATOR" ]] && continue

    # Set each key-value pair as a GitHub secret
    echo "Setting secret for $key"
    echo "$value" | gh secret set "$key"
done < .env
