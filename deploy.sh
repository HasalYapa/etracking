#!/bin/bash

# Deployment script for etracking

# Step 1: Build the project
echo "Building the project..."
npm run build

# Step 2: Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod

echo "Deployment complete!"
