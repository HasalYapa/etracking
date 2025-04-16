# Deployment Instructions for etracking.store

This document provides instructions for deploying the etracking.store application to Vercel.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Vercel CLI installed (`npm install -g vercel`)
- Vercel account linked to your GitHub repository

## Deployment Steps

### 1. Push Your Changes to GitHub

```bash
git add .
git commit -m "Updated Supabase client for production"
git push origin master
```

### 2. Deploy to Vercel

#### Option 1: Using the Deployment Script

Run the deployment script:

```bash
# On Windows
.\deploy.ps1

# On macOS/Linux
chmod +x deploy.sh
./deploy.sh
```

#### Option 2: Manual Deployment

Build the project:

```bash
npm run build
```

Deploy to Vercel:

```bash
npx vercel --prod
```

### 3. Verify Environment Variables in Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your etracking project
3. Go to "Settings" > "Environment Variables"
4. Ensure the following environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`: https://slujerwtublzuxtzdtyw.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWplcnd0dWJsenV4dHpkdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTUzNDYsImV4cCI6MjA2MDIzMTM0Nn0.5irKk2XDrs0ItDWcnN2dOzUBT6KG3Pppg6Slh2fb4CA
   - `NEXT_PUBLIC_BASE_URL`: https://etracking.vercel.app

## Troubleshooting

### Database Connection Issues

If you're experiencing issues with the database connection:

1. Check the browser console for error messages
2. Verify that the Supabase credentials are correct
3. Ensure that the RLS (Row Level Security) policies in Supabase are properly configured
4. Check if the Supabase project is active and not in maintenance mode

### Deployment Failures

If deployment fails:

1. Check the Vercel build logs for errors
2. Ensure all dependencies are properly installed
3. Verify that the build script completes successfully locally
4. Check for any TypeScript or ESLint errors

## Support

If you encounter any issues, please contact:
- Email: dimanthayapa2001@gmail.com
- Phone: +94760061600
