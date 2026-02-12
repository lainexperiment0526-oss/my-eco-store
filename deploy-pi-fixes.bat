@echo off
echo ========================================
echo   Pi Network Mainnet Fix Deployment
echo ========================================
echo.
echo This script will:
echo 1. Update Supabase secrets with new Pi API key
echo 2. Apply database migration to fix duplicates
echo 3. Redeploy Edge Functions
echo 4. Rebuild frontend
echo.
pause

echo.
echo [Step 1/4] Updating Supabase secrets...
echo ----------------------------------------
call npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz
call npx supabase secrets set PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
echo ✅ Secrets updated!
echo.

echo [Step 2/4] Applying database migration...
echo ----------------------------------------
call npx supabase db push
echo ✅ Migration applied!
echo.

echo [Step 3/4] Redeploying Edge Functions...
echo ----------------------------------------
echo Deploying pi-payment-approve...
call npx supabase functions deploy pi-payment-approve
echo.
echo Deploying pi-payment-complete...
call npx supabase functions deploy pi-payment-complete
echo ✅ Edge Functions redeployed!
echo.

echo [Step 4/4] Rebuilding frontend...
echo ----------------------------------------
call npm run build
echo ✅ Frontend rebuilt!
echo.

echo ========================================
echo   ✅ DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Open your app in Pi Browser
echo 2. Test a subscription payment
echo 3. Verify no timeout errors
echo.
echo Check PI_MAINNET_FIXES_CRITICAL.md for troubleshooting
echo.
pause
