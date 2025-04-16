# Deployment script for etracking

# Step 1: Build the project
Write-Host "Building the project..." -ForegroundColor Green
npm run build

# Step 2: Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Green
npx vercel --prod

Write-Host "Deployment complete!" -ForegroundColor Green
