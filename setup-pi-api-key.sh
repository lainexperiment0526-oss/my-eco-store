 #!/bin/bash

# Setup script for Pi Network API Key in Supabase
# Run this script to set the PI_API_KEY environment variable

echo "Setting up Pi Network API Key for Supabase Edge Functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Mainnet API Key
PI_API_KEY="ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"

echo "Setting PI_API_KEY environment variable..."
supabase secrets set PI_API_KEY="$PI_API_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully set PI_API_KEY!"
    echo ""
    echo "The API key is now configured for all edge functions:"
    echo "  - pi-payment-approve"
    echo "  - pi-payment-complete"
    echo ""
    echo "You can verify by checking your Supabase Dashboard:"
    echo "  Project Settings → Edge Functions → Secrets"
else
    echo ""
    echo "❌ Failed to set API key. Please check your Supabase CLI configuration."
    exit 1
fi

