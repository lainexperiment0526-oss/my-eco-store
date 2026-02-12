@echo off
REM Update Supabase secrets for Pi Network Mainnet API Key
REM Run this script to update the PI_API_KEY secret in Supabase

echo 🔐 Updating Supabase secrets for Pi Network Mainnet...
echo.

REM Set the new Pi API Key
call npx supabase secrets set PI_API_KEY=b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz

REM Set the validation key
call npx supabase secrets set PI_VALIDATION_KEY=7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a

echo.
echo ✅ Secrets updated successfully!
echo.
echo ⚠️ IMPORTANT: Edge Functions must be redeployed to use the new secrets
echo Run: npx supabase functions deploy pi-payment-approve
echo Run: npx supabase functions deploy pi-payment-complete
echo.
pause
