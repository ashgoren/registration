#!/bin/bash

rm .env
rm .env.config.js
cp .env.config.js.example .env.config.js

rm functions/.env
rm functions/.env.local
# rm functions/.env.<PROJECT_ID>
cp functions/.env.example functions/.env

rm .firebaserc
rm -rf .firebase
rm -rf node_modules
rm -rf functions/node_modules
rm firebase-service-key.json
rm scripts/keys/*
git remote rm origin

echo "Also be sure to delete the functions/.env.<PROJECT_ID> file!"
