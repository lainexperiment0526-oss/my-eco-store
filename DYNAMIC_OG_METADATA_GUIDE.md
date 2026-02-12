# Dynamic Open Graph (OG) & Twitter Metadata Implementation

## Overview

This implementation provides dynamic Open Graph (OG) and Twitter metadata for user profile pages on Droplink. When users share their profile URL (`https://droplink.space/@username`) on social platforms (Telegram, Facebook, X, LinkedIn, etc.), the preview will display:

- ✅ **Username** (as title: `@username on Droplink`)
- ✅ **Bio/Description** (user's bio text from profile)
- ✅ **Profile Image** (user's avatar_url)
- ✅ **Correct URL** (profile page URL)
- ✅ **Server-side rendering** (metadata in initial HTML, not client-side)
- ✅ **Safe fallbacks** (for missing profiles and broken images)

## Architecture

### Components

#### 1. **Metadata Generator** (`server/metadataGenerator.js`)
Responsible for:
- Fetching user profile data from Supabase
- Validating and sanitizing text and URLs
- Generating properly formatted metadata object
- Handling 404 cases with fallback metadata

**Key Functions:**
- `generateProfileMetadata(username)` - Main function to generate metadata
- `fetchUserProfile(username)` - Queries Supabase for profile data
- `validateImageUrl(url)` - Ensures image URLs are safe and valid
- `sanitizeMetaText(text)` - Escapes HTML special characters

#### 2. **HTML Template Generator** (`server/htmlTemplate.js`)
Responsible for:
- Creating complete HTML pages with injected metadata
- Properly escaping all text values for HTML attributes
- Generating OG meta tags (for Facebook, Pinterest, LinkedIn)
- Generating Twitter Card meta tags (for X, Twitter)
- Redirecting to React app after social crawlers read metadata

**Key Functions:**
- `createMetadataHtmlPage(metadata)` - Generates HTML with metadata
- `createNotFoundHtmlPage(username)` - Generates 404 page with metadata

#### 3. **Express Routes** (`server.js`)
Added two new routes:
- `GET /@:username` - Returns HTML with metadata for social crawlers
- `GET /api/metadata/:username` - JSON API for metadata (debug/testing)

## How It Works

### Flow Diagram

```
User shares link: https://droplink.space/@alice
          ↓
Social crawler (Facebook, X, Telegram, etc.) requests the URL
          ↓
Express server catches GET /@alice request
          ↓
generateProfileMetadata('alice') is called
          ↓
Server queries Supabase: SELECT username, display_name, bio, avatar_url FROM profiles WHERE username='alice'
          ↓
Metadata object is created with:
  - title: "@alice on Droplink"
  - description: user's bio
  - ogImage: user's avatar URL
  - twitterImage: user's avatar URL
  - url: https://droplink.space/@alice
          ↓
HTML page is generated with meta tags injected in <head>
          ↓
HTML is sent to crawler (status 200 for found, 404 for not found)
          ↓
Crawler reads metadata from <head> tags
          ↓
Social preview displays username, bio, and avatar!
```

### Metadata Structure

The generated metadata includes:

**Basic Tags:**
```html
<title>@username | Droplink</title>
<meta name="title" content="@username | Droplink" />
<meta name="description" content="User's bio text" />
```

**Open Graph (Facebook, LinkedIn, Pinterest):**
```html
<meta property="og:type" content="profile" />
<meta property="og:url" content="https://droplink.space/@username" />
<meta property="og:title" content="@username on Droplink" />
<meta property="og:description" content="User's bio text" />
<meta property="og:image" content="https://avatar-url.com/image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Droplink" />
<meta property="og:locale" content="en_US" />
```

**Twitter Card (X, Twitter):**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://droplink.space/@username" />
<meta name="twitter:title" content="@username on Droplink" />
<meta name="twitter:description" content="User's bio text" />
<meta name="twitter:image" content="https://avatar-url.com/image.jpg" />
<meta name="twitter:image:alt" content="User's Display Name's profile on Droplink" />
<meta name="twitter:creator" content="@DropLinkApp" />
```

## Security Features

### Input Validation
- Username format validation: only `a-z`, `A-Z`, `0-9`, `-`, `_`
- Image URL validation: only `https://` and `http://` protocols allowed
- All text is HTML-escaped before injection into meta tags

### XSS Protection
- Special characters in text are escaped:
  - `&` → `&amp;`
  - `"` → `&quot;`
  - `<` → `&lt;`
  - `>` → `&gt;`
  - etc.
- Text is limited to 500 characters max
- Newlines are stripped from description text

### Safe Fallbacks
- If user profile not found: returns default Droplink metadata
- If avatar URL is invalid: uses default Droplink logo
- If bio is missing: uses fallback description
- All errors are handled gracefully

## Usage

### For Sharing

Users can share their profile URL directly:
```
https://droplink.space/@alice
```

When they paste this in Telegram, Facebook, X, etc., the preview will show:
- Title: `@alice on Droplink`
- Description: Alice's bio
- Image: Alice's avatar

### For Testing/Debugging

**Check metadata via API:**
```bash
curl https://droplink.space/api/metadata/alice
```

Response:
```json
{
  "title": "@alice | Droplink",
  "description": "Alice's bio text",
  "ogTitle": "@alice on Droplink",
  "ogDescription": "Alice's bio text",
  "ogImage": "https://avatar-url.com/alice.jpg",
  "twitterTitle": "@alice on Droplink",
  "twitterDescription": "Alice's bio text",
  "twitterImage": "https://avatar-url.com/alice.jpg",
  "url": "https://droplink.space/@alice",
  "username": "alice",
  "displayName": "Alice Johnson",
  "notFound": false
}
```

**Check metadata for non-existent user:**
```bash
curl https://droplink.space/api/metadata/nonexistent
```

Response (404):
```json
{
  "title": "Profile Not Found | Droplink",
  "description": "User profile not found on Droplink",
  "ogImage": "https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png",
  "url": "https://droplink.space/@nonexistent",
  "notFound": true
}
```

## Testing on Social Platforms

### Facebook / Instagram
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter: `https://droplink.space/@username`
3. Click "Fetch new scrape information"
4. Verify metadata appears correctly

### X (Twitter)
1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter: `https://droplink.space/@username`
3. Click "Validate"
4. Verify Twitter Card metadata

### Telegram
1. Open Telegram Web
2. Paste: `https://droplink.space/@username`
3. Preview should show username, bio, and avatar

### LinkedIn
1. LinkedIn automatically shows metadata
2. Paste URL in a post
3. Preview should update

### General Browser Test
1. Visit `https://droplink.space/@username` in browser
2. Right-click → View Page Source
3. Search for `og:title` and `twitter:title`
4. Verify metadata is present in `<head>`

## Performance Considerations

- **Caching**: Consider implementing Redis caching for frequently accessed profiles
- **Database queries**: Uses indexed username field for fast lookups
- **Image optimization**: Store avatar URLs as HTTPS for best performance
- **Timeout**: Metadata generation has built-in error handling (no 30+ second waits)

## Environment Variables Required

The following must be set in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## File Structure

```
droplink-testnet-35167-8/
├── server.js                          # Main Express server (MODIFIED)
├── server/
│   ├── metadataGenerator.js          # NEW: Metadata generation
│   ├── htmlTemplate.js               # NEW: HTML template generation
│   └── piPayments.js                 # Existing
└── ...
```

## Troubleshooting

### Metadata not showing in social preview
1. Check that profile exists in Supabase
2. Visit `/api/metadata/username` to debug
3. Ensure avatar_url is a valid HTTPS URL
4. Wait 24-48 hours for social platforms to re-cache

### 404 status for existing users
- This is intentional for SEO purposes
- Social crawlers still receive proper metadata
- The 404 doesn't prevent preview generation

### Image not showing in preview
1. Check that `avatar_url` is valid and public
2. Verify image is HTTPS (not HTTP)
3. Ensure image is 1200x630 or similar aspect ratio
4. Test with [Open Graph Image Validator](https://www.opengraph.xyz/)

### Text contains special characters
- All special characters are automatically escaped
- Unicode is supported and preserved

## Future Enhancements

Potential improvements:
- [ ] Cache metadata in Redis for high-traffic profiles
- [ ] Add dynamic OG image generation (username + avatar overlay)
- [ ] Support custom metadata per user (allow users to set preview text)
- [ ] Add analytics tracking for share clicks
- [ ] Implement metadata for other routes (e.g., products, posts)
- [ ] Add canonical tags for SEO
- [ ] Support multi-language metadata

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Open Graph Image Specifications](https://www.opengraph.xyz/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Test via `/api/metadata/username` endpoint
3. Review server logs for errors
4. Contact the development team
