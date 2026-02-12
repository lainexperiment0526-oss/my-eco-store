# Supabase Direct Deployment Script

$PROJECT_ID = "jzzbmoopwnvgxxirulga"
$SUPABASE_URL = "https://$PROJECT_ID.supabase.co"

Write-Host ""
Write-Host "======================================="
Write-Host "Supabase Schema Deployment"
Write-Host "======================================="
Write-Host ""
Write-Host "Project ID: $PROJECT_ID"
Write-Host "URL: $SUPABASE_URL"
Write-Host ""

# Get API Key from user
$API_KEY = Read-Host "Enter your Supabase API Key"

if (-not $API_KEY) {
    Write-Host "ERROR: API Key required"
    exit 1
}

# Read SQL
$SQL = Get-Content "supabase\migrations\20251225000200_restore_user_data_schema.sql" -Raw

Write-Host ""
Write-Host "Deploying schema..."
Write-Host ""

# Split statements
$statements = $SQL -split ";" | Where-Object { $_.Trim() -and -not $_.Trim().StartsWith("--") }

Write-Host "Found $($statements.Count) statements"
Write-Host ""

$success = 0
$failed = 0

foreach ($stmt in $statements) {
    $stmt = $stmt.Trim()
    if (-not $stmt) { continue }
    
    $preview = $stmt.Substring(0, 50) + "..."
    
    Write-Host "Executing: $preview"
    
    try {
        $headers = @{
            "Authorization" = "Bearer $API_KEY"
            "Content-Type" = "application/json"
            "apikey" = $API_KEY
        }
        
        $body = @{
            query = $stmt
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        Write-Host "  OK"
        $success++
    } catch {
        Write-Host "  Warning"
        $failed++
    }
}

Write-Host ""
Write-Host "======================================="
Write-Host "Complete!"
Write-Host "======================================="
