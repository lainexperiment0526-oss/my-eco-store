# Deploy Edge Functions to Correct Project
Write-Host "🚀 Deploying to project jzzbmoopwnvgxxirulga..." -ForegroundColor Cyan

$functions = @("pi-auth", "pi-payment-approve", "pi-payment-complete", "financial-data", "subscription")

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor White
    supabase functions deploy $func --project-ref jzzbmoopwnvgxxirulga --no-verify-jwt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $func deployed" -ForegroundColor Green
    } else {
        Write-Host "❌ $func failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🧪 Testing functions..." -ForegroundColor Yellow
$url = "https://jzzbmoopwnvgxxirulga.supabase.co/functions/v1/pi-auth"
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwMzEyNSwiZXhwIjoyMDc0Nzc5MTI1fQ.BGsSUMxHQPHTNtrbKyPyRRx26CL2Qw3smDDOFYrjtTk"
    "Content-Type" = "application/json"
}

try {
    Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body '{}' | Out-Null
    Write-Host "✅ Functions working on correct project!" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.Value__
    if ($status -eq 400 -or $status -eq 422) {
        Write-Host "✅ Functions deployed and responding!" -ForegroundColor Green
    } else {
        Write-Host "❌ Status: $status" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔗 Dashboard: https://supabase.com/dashboard/project/jzzbmoopwnvgxxirulga/functions" -ForegroundColor Cyan