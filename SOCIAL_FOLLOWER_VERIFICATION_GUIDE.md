# Social Follower Verification System

## Overview
This system prevents fake follower counts by fetching real-time follower data from social media APIs.

## Features
✅ **Real-time API Integration** - Fetches actual follower counts from social platforms
✅ **Verified Badge** - Shows ✓ checkmark for API-verified counts  
✅ **Automatic Updates** - Stores verified counts in database
✅ **Anti-Fake Protection** - Disables manual editing when verified

## Supported Platforms

### Currently Implemented
- **Twitter/X** - Requires Twitter API v2 Bearer Token
- **Instagram** - Requires Instagram Graph API or scraping
- **YouTube** - Requires YouTube Data API v3 Key
- **TikTok** - Requires third-party API (RapidAPI)
- **Twitch** - Can be implemented with Twitch API

## Setup Instructions

### 1. Get API Keys

**Twitter API:**
1. Go to https://developer.twitter.com/
2. Create a new app
3. Generate Bearer Token
4. Add to Supabase secrets: `TWITTER_BEARER_TOKEN`

**YouTube API:**
1. Go to https://console.cloud.google.com/
2. Enable YouTube Data API v3
3. Create API key
4. Add to Supabase secrets: `YOUTUBE_API_KEY`

**Instagram:**
- Official API requires Facebook Business account
- Alternative: Use third-party service like RapidAPI

### 2. Deploy Edge Function

```bash
cd supabase
supabase functions deploy verify-social-followers
```

### 3. Set Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions:
```bash
TWITTER_BEARER_TOKEN=your_twitter_token
YOUTUBE_API_KEY=your_youtube_key
```

### 4. Update Database Schema

The `social_links` JSONB column now includes:
```typescript
{
  platform: string;
  url: string;
  followers: number;           // User-entered count
  verified_followers: number;   // API-verified count
  last_verified: string;        // ISO timestamp
  is_verified: boolean;         // Verification status
}
```

## Usage

### From Dashboard
1. Add social media links
2. Click **"✓ Verify Followers"** button
3. System fetches real counts from APIs
4. Verified counts show with green ✓ badge
5. Manual editing is disabled for verified counts

### From Public Bio
- Shows verified follower counts automatically
- Displays total verified social followers
- Badge indicates verification status

## API Rate Limits

| Platform | Free Tier Limit | Reset Period |
|----------|----------------|--------------|
| Twitter | 500 requests/month | Monthly |
| YouTube | 10,000 units/day | Daily |
| Instagram | Limited | Requires business account |
| TikTok | Varies by provider | Varies |

## Security Features

1. **Server-Side Verification** - All API calls happen in Edge Functions
2. **Credential Protection** - API keys stored in Supabase secrets
3. **Rate Limiting** - Prevents API quota exhaustion
4. **Error Handling** - Graceful fallback if APIs fail

## Database Structure

```sql
-- Social links are stored as JSONB in profiles table
ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '[]';

-- Example structure:
[
  {
    "type": "twitter",
    "url": "https://x.com/username",
    "followers": 1000,
    "verified_followers": 1234,
    "last_verified": "2026-01-26T10:30:00Z",
    "is_verified": true
  }
]
```

## Error Handling

The system handles:
- Invalid URLs
- API authentication failures
- Rate limit exceeded
- Network timeouts
- Platform-specific errors

## Future Enhancements

- [ ] Automatic periodic re-verification (daily/weekly)
- [ ] Historical follower count tracking
- [ ] Growth rate analytics
- [ ] Verification badges on public profiles
- [ ] Admin dashboard for verification status
- [ ] Support for more platforms (Discord, Reddit, etc.)

## Troubleshooting

**Verification fails:**
1. Check API keys are set correctly in Supabase
2. Verify Edge Function is deployed
3. Check API quota hasn't been exceeded
4. Ensure URLs are valid and public

**Counts don't match:**
- API data may be cached (Twitter updates every 15 min)
- Private accounts cannot be verified
- Some platforms require additional permissions

## Cost Considerations

- Twitter API: Free tier available
- YouTube API: Free 10,000 units/day
- Instagram: Requires Facebook Business (paid)
- Third-party APIs: Varies (RapidAPI offers free tiers)

## Compliance

- Respects platform Terms of Service
- Uses official APIs where available
- Implements rate limiting
- No credential storage in client

