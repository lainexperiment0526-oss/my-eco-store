# Migration Guide: From Lovable to Vercel + Supabase

This guide will help you migrate your DropLink application from Lovable to your own infrastructure using Vercel for hosting and Supabase for the database.

## What's Been Prepared

✅ **Vercel Configuration**: `vercel.json` has been created with optimal settings
✅ **Lovable Dependencies Removed**: Cleaned up `lovable-tagger` and references
✅ **AI Service Updated**: Changed from Lovable AI to OpenAI API
✅ **Environment Variables Template**: `.env.example` created for deployment
✅ **Domain Configuration**: Updated custom domain examples to use Vercel

## Step-by-Step Migration Process

### 1. Create Production Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Create a new project** for your production environment
3. **Note down your new project details**:
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon Key: Available in Settings > API
   - Service Role Key: Available in Settings > API (keep this secret!)

### 2. Migrate Database Schema

You have two options to set up your production database:

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# Push your migrations to production
supabase db push
```

#### Option B: Manual SQL Migration
1. Copy the SQL from your migration files in `supabase/migrations/`
2. Run them manually in your production Supabase SQL editor
3. Deploy your Edge Functions manually

### 3. Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your project**:
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel**:
   Go to your Vercel project dashboard and add these environment variables:
   
   ```env
   VITE_SUPABASE_URL=https://your-production-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   VITE_PI_API_KEY=your-pi-network-api-key
   PI_API_SECRET=your-pi-network-secret
   OPENAI_API_KEY=your-openai-api-key
   NODE_ENV=production
   ```

### 4. Update Supabase Edge Functions

Your Edge Functions need to be deployed to your production Supabase project:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy ai-chat
supabase functions deploy pi-auth
supabase functions deploy pi-payment-approve
supabase functions deploy pi-payment-complete
supabase functions deploy profile-update
supabase functions deploy wallet-increment
```

### 5. Configure Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project settings
   - Add your custom domain
   - Follow Vercel's DNS configuration instructions

2. **Update DNS Records**:
   - Set CNAME record to point to your Vercel app URL
   - Example: `your-domain.com` → `your-vercel-app.vercel.app`

### 6. Environment Configuration

#### Development (.env.local):
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-dev-anon-key
VITE_PI_API_KEY=your-pi-sandbox-api-key
OPENAI_API_KEY=your-openai-api-key
```

#### Production (Vercel Environment Variables):
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
VITE_PI_API_KEY=your-pi-production-api-key
PI_API_SECRET=your-pi-production-secret
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=production
```

## Data Migration (If needed)

If you have existing data in your current setup that needs to be migrated:

1. **Export data** from your current database
2. **Import into new Supabase project** using SQL or the dashboard
3. **Verify all relationships and constraints** are working correctly

## Testing Your Migration

1. **Test locally** with your new Supabase project
2. **Verify all features work**:
   - User authentication
   - Profile management
   - Pi Network integration
   - AI chat functionality
   - Payment processing

3. **Test the production deployment** on Vercel

## Benefits of This Migration

✅ **Full Ownership**: You own and control your infrastructure
✅ **Cost Control**: Pay only for what you use
✅ **Scalability**: Vercel and Supabase scale automatically
✅ **Performance**: Edge functions and CDN for optimal speed
✅ **Reliability**: Enterprise-grade infrastructure
✅ **Flexibility**: Easy to customize and extend

## Post-Migration Checklist

- [ ] Production Supabase project created and configured
- [ ] Database schema migrated successfully
- [ ] Edge Functions deployed and working
- [ ] Vercel project deployed
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] All features tested and working
- [ ] DNS records updated
- [ ] Old Lovable project can be decommissioned

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your Supabase project allows requests from your Vercel domain
2. **Environment Variables**: Double-check all environment variables are set correctly
3. **Edge Functions**: Make sure all functions are deployed and have the right permissions
4. **DNS Propagation**: Custom domain changes can take up to 48 hours to propagate

### Support Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Cost Estimation

**Vercel**: 
- Free tier includes generous limits
- Pro plan: $20/month per team member (if needed)

**Supabase**:
- Free tier: 500MB database, 2GB bandwidth
- Pro plan: $25/month + usage

**OpenAI**:
- Pay per API call (typically $0.002-0.06 per 1K tokens)

Your migration is now complete! You have full control over your infrastructure while maintaining all the functionality of your DropLink application.