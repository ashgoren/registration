#!/bin/bash

# require 1 argument
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <path-to-template> <path-to-old-project>"
    exit 1
fi

SOURCE_DIR=$1
TARGET_DIR=$2

echo "Backing up critical files in $TARGET_DIR"
mkdir -p $TARGET_DIR/backup
if [ -f "$TARGET_DIR/.firebaserc" ]; then
  cp "$TARGET_DIR/.firebaserc" "$TARGET_DIR/backup/old-firebaserc"
fi
if [ -f "$TARGET_DIR/.env" ]; then
  cp "$TARGET_DIR/.env" "$TARGET_DIR/backup/old-env"
fi
if [ -f "$TARGET_DIR/functions/.env" ]; then
  cp "$TARGET_DIR/functions/.env" "$TARGET_DIR/backup/old-functions-env"
fi
if [ -f "$TARGET_DIR/public" ]; then
  cp -R "$TARGET_DIR/public/" "$TARGET_DIR/backup/old-public"
fi
if [ -f "$TARGET_DIR/scripts/keys" ]; then
  cp -R "$TARGET_DIR/scripts/keys/" "$TARGET_DIR/backup/old-scripts-keys"
fi

echo "Removing old files in $TARGET_DIR"
rm -rf $TARGET_DIR/public/
rm -rf $TARGET_DIR/src/
rm -rf $TARGET_DIR/build/
rm -rf $TARGET_DIR/node_modules/
rm -rf $TARGET_DIR/functions/
rm -rf $TARGET_DIR/.github/
rm $TARGET_DIR/*.yaml
rm $TARGET_DIR/*.json
rm $TARGET_DIR/*.sh
rm $TARGET_DIR/*.md
rm $TARGET_DIR/.gitignore
rm $TARGET_DIR/.env.example

echo "Copying files from $SOURCE_DIR to $TARGET_DIR"
rsync -av --progress $SOURCE_DIR $TARGET_DIR --exclude '.git' --exclude '.env' --exclude '.vscode' --exclude '.firebaserc'
