#!/bin/bash

# Droplink Production Deployment Script

echo "🚀 Starting Droplink deployment process..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Important: Show Pi Auth verification reminder
echo ""
echo "⚠️  IMPORTANT: Pi Authentication Setup Required"
echo ""
echo "Before deploying, ensure you've run these steps:"
echo "   1. Go to Supabase Dashboard > SQL Editor"
echo "   2. Run the content from: verify-pi-auth-schema.sql"
echo "   3. Run: NOTIFY pgrst, 'reload schema';"
echo "   4. Wait 30 seconds for cache refresh"
echo ""
echo "For automated setup, use: deploy-with-pi-auth-check.sh"
echo ""

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"
echo ""
echo "🎉 Your Droplink app is now live!"
echo ""
echo "📋 Remember to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Test public profile URLs: yourdomain.com/{username}"
echo "   3. Verify Pi Network integration works"
echo "   4. Check mobile responsiveness"
echo ""
echo "🔗 Public URL structure:"
echo "   - Dashboard: https://your-app.vercel.app/"
echo "   - Public Profiles: https://your-app.vercel.app/{username}"
echo "   - Authentication: https://your-app.vercel.app/auth"