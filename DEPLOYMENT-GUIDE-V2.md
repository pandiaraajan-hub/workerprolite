# WorkerPro Vercel Deployment Guide V2 - Individual API Routes

## What Changed
Instead of using a single API handler, this version creates separate API route files for each endpoint:
- `api/stats.ts` - Dashboard statistics
- `api/workers.ts` - Worker management 
- `api/courses.ts` - Course management
- `api/certifications.ts` - Certification management

This eliminates the complex routing logic that was causing JSON parsing errors.

## Deployment Steps

1. **Upload to GitHub**
   - Create new repository or clear existing one
   - Upload ALL files from this deployment package
   - Maintain exact folder structure

2. **Connect to Vercel**
   - Import repository in Vercel
   - Auto-detection will work with new vercel.json

3. **Environment Variables**
   - Add `DATABASE_URL` in Vercel settings
   - Format: `postgresql://user:password@host:5432/database`

4. **Deploy**
   - Click Deploy
   - Each API route will be deployed as separate serverless function

## Expected API Endpoints After Deployment

- `GET /api/stats` - Dashboard statistics
- `GET /api/workers` - List workers 
- `POST /api/workers` - Create worker
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course  
- `GET /api/certifications` - List certifications
- `GET /api/certifications/expiring/30` - Expiring certifications
- `POST /api/certifications` - Create certification

## Why This Should Fix JSON Errors

1. **Simpler routing** - Each endpoint is isolated
2. **Direct responses** - No complex middleware chains
3. **Better error handling** - Cleaner error responses
4. **Native Vercel integration** - Uses standard serverless function pattern

If you still get JSON errors after this deployment, the issue might be with your DATABASE_URL or Vercel configuration itself.