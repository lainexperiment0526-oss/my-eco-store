# Commands Quick Reference - Dynamic OG Metadata

## ⚡ Essential Commands

### Restart Server
```bash
# Stop current server
npm stop

# Start fresh (will load new code)
npm start

# Or if using pm2:
pm2 restart all
```

### Verify Files Were Added
```bash
# Check metadata generator exists
ls -la server/metadataGenerator.js

# Check template generator exists
ls -la server/htmlTemplate.js

# Or on Windows:
dir server\metadataGenerator.js
dir server\htmlTemplate.js
```

---

## 🧪 Testing Commands

### Test Metadata API
```bash
# Simple test - get metadata for a user
curl https://droplink.space/api/metadata/alice

# Pretty print JSON (requires jq)
curl https://droplink.space/api/metadata/alice | jq .

# Test non-existent user
curl https://droplink.space/api/metadata/nonexistentuser
```

### Test HTML Route
```bash
# Get full HTML response
curl https://droplink.space/@alice

# Check for specific meta tags
curl https://droplink.space/@alice | grep "og:title"
curl https://droplink.space/@alice | grep "twitter:card"
curl https://droplink.space/@alice | grep "og:image"

# Count meta tags
curl https://droplink.space/@alice | grep -c "meta property"
```

### Test Error Cases
```bash
# Invalid username
curl https://droplink.space/@!!!invalid

# Very long username
curl https://droplink.space/@verylongusernamethatdoesnotexist12345678

# Special characters
curl "https://droplink.space/@test%20user"
```

### Windows PowerShell Testing
```powershell
# Run test script
.\test-og-metadata.ps1

# Or with custom parameters
.\test-og-metadata.ps1 -BaseUrl "https://droplink.space" -TestUsername "alice"

# Or for local testing
.\test-og-metadata.ps1 -BaseUrl "http://localhost:3000" -TestUsername "testuser"
```

### Linux/Mac Bash Testing
```bash
# Run test script
chmod +x test-og-metadata.sh
./test-og-metadata.sh

# Or with custom parameters
./test-og-metadata.sh https://droplink.space alice

# Or for local testing
./test-og-metadata.sh http://localhost:3000 testuser
```

---

## 🔍 Debugging Commands

### Check Server Logs
```bash
# If running with npm
npm start  # Logs will appear in console

# If using pm2
pm2 logs

# Follow logs in real time
pm2 logs --lines 50
```

### Check Database Connection
```bash
# Test Supabase connection via API endpoint
curl https://droplink.space/api/metadata/testuser

# If this works, database connection is fine
```

### Inspect HTTP Headers
```bash
# Check response headers
curl -i https://droplink.space/@alice

# Check Content-Type header specifically
curl -i https://droplink.space/@alice | grep -i "content-type"

# Should show: Content-Type: text/html; charset=utf-8
```

### Check HTML Content
```bash
# View first 50 lines of HTML response
curl https://droplink.space/@alice | head -50

# Count meta tags
curl https://droplink.space/@alice | grep -c "<meta"

# Find all og: tags
curl https://droplink.space/@alice | grep "property=\"og:"

# Find all twitter: tags
curl https://droplink.space/@alice | grep "name=\"twitter:"
```

### Test with Different Usernames
```bash
# Test multiple users
for user in alice bob charlie; do
  echo "Testing @$user:"
  curl https://droplink.space/api/metadata/$user | jq '.title'
done
```

---

## 🚀 Deployment Commands

### Pre-Deployment Checks
```bash
# Verify environment variables are set
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Should output non-empty values

# Or check .env file
grep "SUPABASE_URL" .env
grep "SUPABASE_SERVICE_ROLE_KEY" .env
```

### Deploy to Production
```bash
# 1. Commit changes
git add .
git commit -m "Add dynamic OG metadata implementation"

# 2. Stop old server
npm stop

# 3. Start new server
npm start

# 4. Verify it's running
curl https://droplink.space/api/metadata/alice
```

### Deploy with PM2
```bash
# Restart app
pm2 restart all

# Or restart specific app
pm2 restart "app-name"

# Check status
pm2 status

# View logs
pm2 logs
```

---

## 📱 Testing on Social Platforms

### Facebook Sharing Debugger
```bash
# Opens in browser, then paste URL
https://developers.facebook.com/tools/debug/

# URL to test:
https://droplink.space/@alice
```

### Twitter Card Validator
```bash
# Opens in browser, then paste URL
https://cards-dev.twitter.com/validator

# URL to test:
https://droplink.space/@alice
```

### Telegram Web
```bash
# Opens Telegram Web, paste URL in message
https://web.telegram.org

# URL to test:
https://droplink.space/@alice
```

### LinkedIn
```bash
# Create new post at linkedin.com/feed
# Paste URL:
https://droplink.space/@alice

# Preview should update automatically
```

---

## 🔧 Troubleshooting Commands

### If Routes Not Found
```bash
# Check server is running
netstat -tuln | grep 3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Restart server
npm stop
npm start

# Check if routes are registered (look in logs)
```

### If Metadata Not in HTML
```bash
# Check route exists
curl -i https://droplink.space/@alice

# Should show 200 OK (or 404 for not found)
# Should have <meta> tags in response

# Check raw HTML
curl https://droplink.space/@alice | cat -A

# Look for "og:title" or "twitter:card"
```

### If Database Error
```bash
# Check Supabase connection
curl https://droplink.space/api/metadata/testuser

# If error: check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
grep "SUPABASE_" .env

# Verify Supabase project is accessible
# Log into https://app.supabase.com and check project status
```

### If Avatar Not Loading
```bash
# Check avatar URL in database
curl https://droplink.space/api/metadata/alice | jq '.ogImage'

# Test URL directly in browser
# Should load without errors
# Must be HTTPS
# Must not require authentication
```

---

## 📊 Monitoring Commands

### Monitor in Real Time
```bash
# Watch server logs
pm2 logs -f

# Or with npm
npm start  # Logs appear here

# Watch for errors
watch "curl https://droplink.space/@alice | grep error"
```

### Performance Monitoring
```bash
# Measure response time
time curl https://droplink.space/@alice > /dev/null

# Test multiple requests
for i in {1..10}; do
  echo "Request $i:"
  time curl -s https://droplink.space/api/metadata/alice > /dev/null
done
```

### Monitor Database Queries
```bash
# Check Supabase logs at:
https://app.supabase.com/project/jzzbmoopwnvgxxirulga/logs/explorer

# Or check local logs if self-hosted
```

---

## 🎯 Common Workflows

### Complete Setup & Test
```bash
# 1. Restart server
npm stop
npm start

# 2. Wait for server to start (3-5 seconds)
sleep 5

# 3. Test metadata API
curl https://droplink.space/api/metadata/alice

# 4. Test HTML endpoint
curl https://droplink.space/@alice | grep "og:title"

# 5. Run full test script
.\test-og-metadata.ps1  # Windows
./test-og-metadata.sh   # Linux/Mac
```

### Test New User
```bash
# 1. Create user in database (or use existing)
# 2. Check metadata is generated
curl https://droplink.space/api/metadata/newuser

# 3. Share URL on social platform
https://droplink.space/@newuser

# 4. Verify preview shows correct info
```

### Debug Issue
```bash
# 1. Check server is running
npm start

# 2. Test API endpoint
curl https://droplink.space/api/metadata/testuser

# 3. If error, check logs
npm start  # Shows logs

# 4. Verify environment variables
grep "SUPABASE" .env

# 5. Test specific features
curl https://droplink.space/@testuser | grep "og:image"
```

---

## 🔒 Security Commands

### Verify Input Validation
```bash
# Test invalid username (should be rejected)
curl https://droplink.space/@test!!!user

# Test with special characters
curl "https://droplink.space/@test%20space"

# Both should return safe responses
```

### Check HTML Escaping
```bash
# Look for escaped quotes in HTML
curl https://droplink.space/@alice | grep "&quot;"

# Look for escaped less-than signs
curl https://droplink.space/@alice | grep "&lt;"

# Should properly escape all special characters
```

---

## 📝 Log Inspection

### Find Errors in Logs
```bash
# Search for errors
npm start 2>&1 | grep -i error

# Or with pm2
pm2 logs | grep -i "metadata route error"
```

### View Recent Logs
```bash
# Last 100 lines
pm2 logs --lines 100

# Continuous monitoring
pm2 logs -f --lines 50
```

---

## 🎬 One-Liner Commands

```bash
# Start server and test immediately
npm start & sleep 3 && curl https://droplink.space/api/metadata/alice

# Test and show only title
curl https://droplink.space/api/metadata/alice | jq '.title'

# Test all meta tags
curl https://droplink.space/@alice | grep -o '<meta[^>]*>'

# Count responses
for i in {1..5}; do curl -s https://droplink.space/api/metadata/alice | jq . > /dev/null && echo "Success $i"; done

# Test connection
curl -v https://droplink.space/@alice 2>&1 | head -20
```

---

## 📞 Getting Help

### Check Status
```bash
# Is server running?
npm start  # If shows "Server running on port 3000" → Yes
pm2 status  # Shows all processes

# Is database connected?
curl https://droplink.space/api/metadata/alice

# Does HTML have metadata?
curl https://droplink.space/@alice | grep "og:"
```

### Review Documentation
```bash
# View documentation files
ls -la *.md | grep -i "og\|metadata"

# Read quick start
cat QUICK_START_OG_METADATA.md

# View troubleshooting
grep -A 20 "Troubleshooting" DYNAMIC_OG_METADATA_GUIDE.md
```

---

## ✅ Verification Checklist

```bash
# 1. Files exist
[ -f "server/metadataGenerator.js" ] && echo "✓ Generator exists" || echo "✗ Missing"
[ -f "server/htmlTemplate.js" ] && echo "✓ Template exists" || echo "✗ Missing"

# 2. Server running
curl -s https://droplink.space/api/metadata/alice > /dev/null && echo "✓ Server running" || echo "✗ Server down"

# 3. Metadata generated
curl -s https://droplink.space/api/metadata/alice | jq '.title' && echo "✓ Metadata working" || echo "✗ Metadata error"

# 4. HTML has meta tags
curl -s https://droplink.space/@alice | grep -q "og:title" && echo "✓ HTML has OG tags" || echo "✗ Missing OG tags"

# All checks
echo "=== Verification ===" && \
[ -f "server/metadataGenerator.js" ] && echo "✓ Files" || echo "✗ Files" && \
curl -s https://droplink.space/api/metadata/alice | jq '.title' > /dev/null && echo "✓ API" || echo "✗ API" && \
curl -s https://droplink.space/@alice | grep -q "og:title" && echo "✓ HTML" || echo "✗ HTML"
```

---

## 🎉 Summary

**Everything you need to test, deploy, and verify the dynamic OG metadata implementation.**

Use these commands to:
- ✅ Deploy the feature
- ✅ Test it works
- ✅ Debug issues
- ✅ Monitor performance
- ✅ Verify on social platforms

**For more details, see the documentation files:**
- QUICK_START_OG_METADATA.md
- DYNAMIC_OG_METADATA_GUIDE.md
- INDEX_OG_METADATA_DOCS.md

---

*Ready to go! 🚀*
