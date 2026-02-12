# Droplink Backend & Supabase Setup Guide

## 1. Supabase Project Setup
1. Create a new project at https://app.supabase.com/ if you haven’t already.
2. Get your Supabase URL and anon/public key from Project Settings > API.

## 2. Apply Database Migrations
1. In the Supabase dashboard, go to SQL Editor.
2. For each file in `supabase/migrations/`, open and run the SQL in order (oldest to newest).
   - This will create all tables, relationships, and functions needed for Droplink.

## 3. Configure Environment Variables
1. In your project root, create a `.env` file (or use your deployment platform’s env settings):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

2. Restart your dev server after setting these.

## 4. Verify Supabase Integration
- The Supabase client is set up in `src/integrations/supabase/client.ts` and uses the above env variables.
- All data access in your code (profiles, products, analytics, etc.) uses this client.

## 5. Local Development
- Run your frontend/backend as usual (e.g., `npm run dev`).
- All database operations will go through Supabase.

## 6. Deployment
- Deploy your frontend/backend to your preferred platform (Vercel, Netlify, etc.).
- Set the same environment variables in your deployment platform.

## 7. Testing
- Sign up, login, and use all features to ensure data is saved and loaded from Supabase.
- Check the Supabase dashboard for live data changes.

## 8. (Optional) Custom Backend/API
- If you need custom server logic, create an API (Node.js/Express, etc.) and connect it to Supabase using the same credentials.

---

**You’re ready!**
- All migrations, types, and integration code are present.
- If you need help with custom endpoints or advanced backend logic, let me know!