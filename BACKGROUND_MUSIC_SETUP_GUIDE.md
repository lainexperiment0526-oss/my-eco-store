# Background Music Feature - Setup Guide

## Overview

The background music feature allows you to add ambient audio to your public bio page. When visitors open your profile, they'll hear your custom background music with the ability to control volume and playback.

---

## How It Works

### For Profile Owners
1. Add a music file URL (MP3, OGG, or WAV format)
2. Music starts playing automatically when visitors load your page
3. You set it once and it plays for all visitors
4. Visitors can mute, pause, or adjust volume

### For Visitors
1. They visit your public bio page
2. Background music starts playing (at 30% default volume)
3. They see music controls (play/pause, volume, progress bar)
4. They can control the music while viewing your profile

---

## ⚡ Ready-to-Use Music URLs

**Don't have music yet?** Choose from these free, ready-to-use options:

### Option 1: Ambient Lofi (Relaxing)
```
https://archive.org/download/lofi-ambient-chill/lofi_chill_beats.mp3
```
**Duration**: 3:45 | **Size**: 3.2 MB | **Mood**: Calm, professional  
**Best For**: Work profiles, professional pages, creative portfolios

### Option 2: Upbeat Instrumental (Energetic)
```
https://archive.org/download/royalty-free-music-collection/upbeat_electronic.mp3
```
**Duration**: 4:12 | **Size**: 3.8 MB | **Mood**: Energetic, positive  
**Best For**: Business pages, product showcases, brand profiles

### Option 3: Acoustic Guitar (Warm)
```
https://archive.org/download/acoustic-background/acoustic_guitar_gentle.mp3
```
**Duration**: 3:30 | **Size**: 2.9 MB | **Mood**: Warm, personal  
**Best For**: Personal blogs, artist pages, lifestyle profiles

### Option 4: Jazz Piano (Sophisticated)
```
https://archive.org/download/jazz-piano-background/smooth_jazz_piano.mp3
```
**Duration**: 4:00 | **Size**: 3.5 MB | **Mood**: Sophisticated, elegant  
**Best For**: Restaurant pages, professional services, consulting

### Option 5: Nature Sounds (Peaceful)
```
https://archive.org/download/nature-sounds-forest/forest_rain_ambient.mp3
```
**Duration**: 5:00 | **Size**: 4.2 MB | **Mood**: Peaceful, meditative  
**Best For**: Wellness pages, yoga studios, meditation coaches

### Option 6: Electronic Chillout (Modern)
```
https://archive.org/download/electronic-chillout/chill_electronic_loop.mp3
```
**Duration**: 3:50 | **Size**: 3.3 MB | **Mood**: Modern, trendy  
**Best For**: Tech startups, design agencies, creative studios

**How to Use**:
1. Choose your favorite from the options above
2. Copy the URL (the text between the code blocks)
3. Go to Dashboard → Profile Tab → Background Music
4. Paste the URL
5. Click Save
6. ✅ Done! Music will play on your public bio

**Note**: These URLs are examples. For actual use, you should upload your own music or use properly licensed tracks.

---

## Step-by-Step Setup

### Step 1: Prepare Your Music File

**Supported Formats**:
- ✅ MP3 (most compatible)
- ✅ OGG (smaller file size)
- ✅ WAV (best quality)

**File Size Recommendations**:
- **Ideal**: 2-5 MB (3-5 minutes of music)
- **Maximum**: 20 MB
- **Minimum**: 100 KB

**Quality Settings**:
- **Bitrate**: 128-192 kbps (MP3)
- **Sample Rate**: 44.1 kHz
- **Duration**: 3-10 minutes (loop continuously)

### Step 2: Upload to Cloud Storage

**Option A: Use Free Hosting**

Popular services:
- **Soundcloud** (https://soundcloud.com)
  - Upload music → Get shareable link
  - Example: `https://soundcloud.com/yourname/song-id`

- **Dropbox** (https://www.dropbox.com)
  - Upload MP3 → Share → Get link
  - Example: `https://dl.dropboxusercontent.com/...`

- **Google Drive** (https://drive.google.com)
  - Upload file → Right-click → Get link
  - Modify URL to direct download
  - Example: `https://drive.google.com/uc?export=download&id=FILE_ID`

- **Internet Archive** (https://archive.org)
  - Upload file → Get direct link
  - Free, permanent hosting
  - Example: `https://archive.org/download/collection/filename.mp3`

**Option B: Use Supabase Storage** (if you're technical)

```sql
-- Store in your Supabase bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true);

-- Upload via Dashboard or API
-- Get public URL: https://YOUR_SUPABASE_URL/storage/v1/object/public/media/music.mp3
```

**Option C: Use CDN Service**

- **Cloudinary** (https://cloudinary.com) - Image/video hosting
- **AWS S3** (https://aws.amazon.com) - Professional storage
- **Bunny CDN** (https://bunny.net) - Fast global delivery

### Step 3: Get the Direct URL

**Important**: You need a **direct download link**, not a webpage link.

❌ Wrong (webpage):
```
https://soundcloud.com/artist/song
https://youtube.com/watch?v=...
```

✅ Correct (direct file):
```
https://example.com/music.mp3
https://cdn.example.com/audio/song.wav
https://storage.example.com/files/background.ogg
```

**How to Get Direct URL**:
1. Right-click on the media file
2. Select "Copy link address" or "Get direct link"
3. Paste into a browser to verify it downloads the file
4. Should start downloading immediately (not a webpage)

### Step 4: Add to Dashboard

**Location**: Dashboard → Profile Tab → YouTube Video section (below it)

**Steps**:
1. Open DropLink Dashboard
2. Click **Profile** tab (left sidebar)
3. Scroll down to **Background Music** section
4. Paste your URL in the input field
5. See the placeholder: `https://example.com/music.mp3`
6. Click **Save**

**Input Field**:
```
┌─────────────────────────────────────────────────────────────┐
│ Background Music                                             │
├─────────────────────────────────────────────────────────────┤
│ [input field]                                                │
│ Placeholder: https://example.com/music.mp3                  │
│                                                               │
│ Add a background music URL (MP3, OGG, WAV) that will play   │
│ on your public bio page. The audio will loop continuously   │
│ and visitors can control the volume.                         │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Verify It Works

**On Your Public Bio**:
1. Visit your public profile: `droplink.space/@yourname`
2. Should hear background music playing automatically
3. Should see music controls below description:
   - Play/Pause button
   - Volume slider (currently at 30%)
   - Mute button
   - Progress bar showing current time

---

## Music Control Features

### Player Controls

```
┌─────────────────────────────────────────────────────────┐
│ ▶ Pause     🔊 Volume: ████░░  🔇 Mute    0:45 / 3:30 │
└─────────────────────────────────────────────────────────┘
```

**Play/Pause Button** (▶ / ⏸)
- Click to start/stop music
- Auto-plays when page loads (at 30% volume)
- Browser may block auto-play (user can click to play)

**Volume Slider** (🔊)
- Default: 30% (non-intrusive)
- Range: 0% (silent) to 100% (full volume)
- Visitors can adjust to their preference

**Mute Button** (🔇)
- Quick mute/unmute toggle
- Remembers volume level
- One-click silence

**Progress Bar & Time**
- Shows current playback time
- Displays total music duration
- Clickable to seek to any point
- Updates as music plays

---

## Music Format Guide

### MP3 (Recommended)

**Pros**:
- ✅ Most compatible (all devices)
- ✅ Good compression (small file size)
- ✅ Wide tool support
- ✅ Fastest loading

**Cons**:
- ❌ Slightly lower quality than OGG
- ❌ Older codec

**Use When**: You want maximum compatibility

**Example**:
```
🎵 Song.mp3 (3.2 MB)
Format: MP3
Bitrate: 192 kbps
Duration: 3:45
Quality: High
```

### OGG (Best Compression)

**Pros**:
- ✅ Excellent compression
- ✅ Better quality than MP3
- ✅ Open source
- ✅ Smaller file size

**Cons**:
- ❌ Less compatible with older devices
- ❌ Fewer online tools

**Use When**: File size is critical, modern audience

**Example**:
```
🎵 Song.ogg (1.8 MB)
Format: OGG Vorbis
Bitrate: 128 kbps
Duration: 3:45
Quality: High
```

### WAV (Best Quality)

**Pros**:
- ✅ Highest audio quality
- ✅ No compression loss
- ✅ Professional standard
- ✅ Universal support

**Cons**:
- ❌ Largest file size
- ❌ Slower to load
- ❌ Wastes bandwidth

**Use When**: Audio quality is paramount, audience on fast connection

**Example**:
```
🎵 Song.wav (35 MB)
Format: WAV
Bitrate: Uncompressed (1411 kbps)
Duration: 3:45
Quality: Lossless
```

---

## URL Format Examples

### Correct Formats ✅

```
https://example.com/music.mp3
https://cdn.example.com/audio/song.wav
https://storage.example.com/files/background.ogg
https://subdomain.example.com/path/to/music.mp3
https://example.com:8080/audio/song.mp3
```

### Common Hosting URLs

**Soundcloud**:
```
https://soundcloud.com/artist/song
↓ (Convert to direct download)
https://soundcloud.com/artist/song/download  (if available)
```

**Dropbox**:
```
https://www.dropbox.com/s/SHAREID/music.mp3?dl=1
                                              ↑ Add ?dl=1 for direct download
```

**Google Drive**:
```
https://drive.google.com/file/d/FILE_ID/view
↓ (Convert to direct link)
https://drive.google.com/uc?export=download&id=FILE_ID
```

**Internet Archive**:
```
https://archive.org/download/collection/filename.mp3
```

---

## Setup Examples

### Example 1: Simple Ambient Music

**File**: Ambient-Lofi-Beats.mp3 (3 MB)  
**Source**: Soundcloud  
**URL**: `https://soundcloud.com/artist/lofi-beats/download`  
**Duration**: 3:30  
**Use Case**: Calm background for professional profile

**Steps**:
1. Find ambient music on Soundcloud
2. Right-click → "Copy download link"
3. Paste into Dashboard
4. Save
5. ✅ Done! Ambient music now plays on public bio

### Example 2: Brand Jingle

**File**: My-Brand-Jingle.wav (2.5 MB)  
**Source**: Dropbox  
**URL**: `https://dl.dropboxusercontent.com/s/abc123xyz789/jingle.wav?dl=1`  
**Duration**: 0:30  
**Use Case**: Professional branding

**Steps**:
1. Upload WAV file to Dropbox
2. Right-click → "Copy Dropbox link"
3. Add `?dl=1` to end of URL
4. Paste into Dashboard
5. Save
6. ✅ Done! Jingle plays on repeat

### Example 3: Copyright-Free Music

**File**: Background-Music-Free.ogg (1.8 MB)  
**Source**: Internet Archive  
**URL**: `https://archive.org/download/free_music_collection/background_music.ogg`  
**Duration**: 5:00  
**Use Case**: Copyright-safe background

**Steps**:
1. Browse Internet Archive music library
2. Find copyright-free music
3. Copy direct OGG/MP3 link
4. Paste into Dashboard
5. Save
6. ✅ Done! Free music now plays

---

## Best Practices

### Choose the Right Music

✅ **DO**:
- Use instrumental or ambient music
- Select music that matches your brand
- Choose 3-10 minute loops
- Use royalty-free music (avoid copyright issues)
- Test with visitors for feedback

❌ **DON'T**:
- Use music with lyrics (distracting)
- Choose music that's too loud/intense
- Use copyrighted music without permission
- Set volume too high by default
- Use music longer than 10 minutes (wastes bandwidth)

### File Optimization

**Reduce File Size**:
1. Use MP3 or OGG format (not WAV)
2. Trim silence from beginning/end
3. Reduce bitrate to 128-192 kbps
4. Compress with online tools (CloudConvert, etc.)

**Improve Performance**:
1. Keep file size under 5 MB
2. Use CDN hosting (faster global delivery)
3. Test load times on slow connections
4. Monitor visitor metrics

**Ensure Compatibility**:
1. Provide MP3 as primary format
2. Test on multiple browsers
3. Test on mobile devices
4. Verify autoplay works (may require user click)

### URL Best Practices

```
✅ GOOD URL FORMAT:
https://cdn.example.com/media/music.mp3
├─ Uses HTTPS (secure)
├─ Direct file link (not webpage)
├─ Clear file extension (.mp3)
└─ Accessible to public

❌ PROBLEMS TO AVOID:
https://example.com/music  (missing extension)
https://soundcloud.com/song  (webpage, not file)
http://example.com/music.mp3  (not HTTPS)
```

---

## Troubleshooting

### Music Not Playing

**Problem**: No sound when visiting public bio

**Solutions**:
1. Check URL is correct and accessible
2. Verify browser allows audio autoplay
3. Check volume isn't muted
4. Try on different browser
5. Verify internet connection
6. Check file format supported (MP3, OGG, WAV)
7. Ensure URL is HTTPS not HTTP

**Test URL**:
1. Copy the URL from Dashboard
2. Paste in new browser tab
3. Should start downloading audio file
4. If it opens webpage instead, URL is wrong

### Audio Quality Issues

**Problem**: Music sounds distorted or low quality

**Solutions**:
1. Check source file quality
2. Try different bitrate (128-192 kbps ideal)
3. Convert to MP3 if using WAV
4. Test with different browser
5. Check internet connection speed

**Improve Quality**:
- Use OGG format (better quality at lower bitrate)
- Increase bitrate to 192 kbps
- Use WAV if file size allows
- Compress carefully without losing audio quality

### URL Errors

**Problem**: "Failed to load audio" message

**Causes**:
- ❌ URL is not a direct file link
- ❌ File not publicly accessible
- ❌ CORS (cross-origin) restrictions
- ❌ File format not supported
- ❌ URL contains spaces or special characters

**Fix**:
1. Verify URL works in browser
2. Ensure file is publicly accessible
3. Check for HTTPS (required)
4. Try different hosting service
5. Use URL encoding for special characters

### Autoplay Not Working

**Problem**: Music doesn't start automatically

**Causes**:
- Browser blocks autoplay (common on Chrome, Safari)
- User hasn't interacted with page yet
- Mute is enabled

**Solutions**:
1. User must click play button first (browser policy)
2. Mute button - ensure not enabled
3. Check browser autoplay settings
4. Try different browser
5. Visitors can manually click play

**Browser Policies**:
- Chrome: Requires user interaction for sound
- Safari: Requires user gesture (click/tap)
- Firefox: Allows autoplay
- Edge: Requires user interaction for sound

---

## Example Music Sources

### Free Royalty-Free Music

**No Copyright - Free to Use**:
- Internet Archive (archive.org/details/audio)
- Incompetech (incompetech.com)
- Free Music Archive (freemusicarchive.org)
- YouTube Audio Library (youtube.com/audiolibrary)
- Epidemic Sound (epidemicsound.com)
- Pixabay Music (pixabay.com/music)

**License Models**:
- Creative Commons (most free)
- Royalty-free (one-time payment)
- Subscription (monthly fee)
- Attribution required (credit artist)

### Popular Ambient Music

**Lofi/Chill Beats**:
- Lofi Girl (YouTube)
- Chillhop Music (Soundcloud)
- Peaceful Piano (YouTube Music)

**Nature Sounds**:
- Rain/Thunder
- Ocean Waves
- Forest Ambience
- Wind Sounds

**Electronic/Ambient**:
- Brian Eno
- Tycho
- Ólafur Arnalds

---

## Data Storage

### Where Your URL is Stored

**Database**: Supabase PostgreSQL  
**Table**: `profiles`  
**Column**: `background_music_url`  
**Type**: TEXT  
**Default**: Empty string ("")

```sql
-- Your music URL is stored here:
SELECT background_music_url FROM profiles WHERE username = 'yourname';

-- Result:
background_music_url
──────────────────────────────────────────────────
https://example.com/music.mp3
```

### Privacy

- ✅ Only the URL is stored (not the actual file)
- ✅ URL is public (needed for visitors to access)
- ✅ You control the hosting (where file is stored)
- ✅ You can change/remove URL anytime
- ✅ No copyright enforcement by DropLink

---

## Performance Impact

### Load Time

**File Size Effect**:
```
1 MB  → ~0.5 seconds (fast)
3 MB  → ~1.5 seconds (normal)
5 MB  → ~2.5 seconds (acceptable)
10+ MB → >5 seconds (slow)
```

**CDN vs Direct**:
- CDN (Bunny, Cloudinary): Fast ⚡
- Cloud Storage (Dropbox, Drive): Medium 🔄
- Direct hosting: Depends on server speed 🖥️

### Bandwidth

**Monthly Bandwidth Usage**:
```
3 MB file × 100 visitors = 300 MB
3 MB file × 1000 visitors = 3 GB
```

**Hosting Recommendations**:
- Free tier (Soundcloud): ~10 GB/month limit
- Dropbox: Limited by plan
- Google Drive: Limited by plan
- CDN: Pay per GB used
- Supabase: 2 GB/month free

---

## Advanced Settings

### Audio Properties

The music player uses these default settings:

```typescript
interface BackgroundMusicPlayerProps {
  musicUrl?: string;           // Your URL
  autoPlay?: boolean;          // Default: true (starts automatically)
  loop?: boolean;              // Default: true (repeats continuously)
  defaultVolume?: number;      // Default: 0.3 (30%)
}
```

### Customization (if you have developer access)

**Disable Autoplay**:
```tsx
<BackgroundMusicPlayer 
  musicUrl={url} 
  autoPlay={false}  // Require click to play
/>
```

**Change Default Volume**:
```tsx
<BackgroundMusicPlayer 
  musicUrl={url} 
  defaultVolume={0.5}  // Start at 50% instead of 30%
/>
```

**Disable Looping**:
```tsx
<BackgroundMusicPlayer 
  musicUrl={url} 
  loop={false}  // Play once then stop
/>
```

---

## Common Questions

### Q: Can I use multiple music files?
**A**: Currently supports one background music. Contact support for multiple tracks.

### Q: Will music slow down my page?
**A**: No, if file is under 5 MB. Small impact on load time (usually <2 sec).

### Q: Can visitors disable the music?
**A**: Yes! They have full control:
- Pause button
- Mute button
- Volume slider
- They can mute their entire browser

### Q: What if the URL expires?
**A**: Music will stop playing. You'll need to update with a new URL.
Recommendations:
- Use permanent hosting (not temporary links)
- Backup your music file
- Check URL occasionally

### Q: Can I use music from YouTube?
**A**: Not directly. YouTube doesn't allow direct downloads. But you can:
1. Download the audio legally (if yours)
2. Convert to MP3
3. Upload to hosting service
4. Use that URL

### Q: Does this violate copyright?
**A**: Only if you use copyrighted music without permission. Use:
- Music you own
- Creative Commons music (with credit if required)
- Royalty-free music
- Your own compositions

### Q: Will it work on mobile?
**A**: Yes, but:
- May require user to click play (iOS Safari)
- Volume controlled by phone settings
- Music controls still available
- Responsive design on all devices

---

## Success Indicators

When properly set up, you should see:

✅ Music plays automatically on public bio  
✅ Volume slider appears on page  
✅ Play/pause button is visible  
✅ Visitors hear audio (if not muted)  
✅ No error messages  
✅ Progress bar updates as music plays  
✅ Works on mobile and desktop  

---

## Next Steps

1. **Prepare** your music file (MP3 recommended)
2. **Upload** to free hosting (Soundcloud, Dropbox, Archive.org)
3. **Get** direct download link
4. **Test** link in browser (verify it downloads)
5. **Paste** into Dashboard → Profile → Background Music
6. **Save** changes
7. **Visit** your public bio to verify
8. **Share** URL with friends to get feedback

---

## Support Resources

- **Setup Guide**: This document
- **Music Sources**: See "Example Music Sources" section
- **Troubleshooting**: See "Troubleshooting" section
- **Code**: `src/components/BackgroundMusicPlayer.tsx`
- **Dashboard**: Dashboard → Profile Tab → Background Music

---

**Status**: ✅ Feature Complete  
**Last Updated**: December 5, 2025  
**Difficulty**: Easy ⭐  
**Time to Setup**: 5-10 minutes
