#!/bin/bash

cd ..
git reset --hard
git pull origin main
git checkout main

yarn
yarn build

# Create a release folder
folder=release-$(git rev-parse HEAD)-$(date '+%Y-%m-%d-%H-%M-%S')

# Copy built files into the release folder
cp -r .output "${folder}"

# Symlink the built files
ln -snf "${folder}" current

# Cleanup old releases
for old in `ls -d release-* | grep -v ${folder} | head -n-5`; do
    rm -rf "${old}"/
done

pm2 startOrReload ecosystem.config.cjs