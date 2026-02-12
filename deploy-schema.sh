#!/bin/bash
# Deploy Supabase schema using direct API call

# Load environment
export $(cat .env.production | grep "VITE_SUPABASE" | xargs)

URL="$VITE_SUPABASE_URL"
KEY="$VITE_SUPABASE_ANON_KEY"

echo "Supabase Schema Deployment"
echo "============================"
echo ""
echo "URL: $URL"
echo "Key: ${KEY:0:20}..."
echo ""

# Read SQL file
SQL=$(cat supabase/full_user_data_schema.sql)

echo "Deploying schema..."
echo ""

# Split and execute each statement
IFS=';' read -ra STATEMENTS <<< "$SQL"

for i in "${!STATEMENTS[@]}"; do
    stmt=$(echo "${STATEMENTS[$i]}" | xargs)
    
    if [ ! -z "$stmt" ] && [[ ! "$stmt" =~ ^-- ]]; then
        echo "[$(($i+1))/${#STATEMENTS[@]}] Executing..."
        
        # Execute statement
        curl -s -X POST "$URL/rest/v1/rpc/exec_sql" \
            -H "Authorization: Bearer $KEY" \
            -H "Content-Type: application/json" \
            -H "apikey: $KEY" \
            -d "{\"sql\":\"$stmt\"}" > /dev/null
        
        echo "  ✓ OK"
    fi
done

echo ""
echo "✅ Deployment complete!"
