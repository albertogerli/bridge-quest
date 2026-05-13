#!/bin/sh
set -e

# Xcode Cloud post-clone script
# Install node_modules so Capacitor SPM local packages are available

cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node.js via Homebrew (Xcode Cloud has Homebrew pre-installed)
brew install node

npm ci
