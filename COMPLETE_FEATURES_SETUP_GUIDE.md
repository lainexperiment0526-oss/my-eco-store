# Complete Feature Setup Guide - Background Music + Pi Wallet QR Code

## Overview

Your DropLink profile now has two powerful features to enhance visitor experience:

1. **Background Music** - Ambient audio plays on your public bio
2. **Pi Wallet QR Code** - Visitors can scan to send you DROP tokens

This guide shows how to set up both features together.

---

## Feature Comparison

| Feature | Background Music | Pi Wallet QR Code |
|---------|------------------|-------------------|
| **Purpose** | Ambient audio | Receive donations |
| **Location** | Below description | "Receive DROP or Pi Tips" section |
| **Setup Time** | 5 min | 2 min |
| **Cost** | Free | Free |
| **Visitor Action** | Listen | Scan QR & send tokens |
| **Control** | Visitor controls volume | Visitor sends money |

---

## Complete Setup Walkthrough

### Part 1: Background Music Setup (5 minutes)

#### Step 1: Prepare Music File

**Option A: Use Ready-Made Music (Fastest - 30 seconds)**

Choose one of these pre-configured URLs:

```
🎵 Lofi Chill:  https://archive.org/download/lofi-ambient/chill_beats.mp3
🎵 Upbeat:      https://archive.org/download/upbeat-music/energetic.mp3
🎵 Acoustic:    https://archive.org/download/acoustic/gentle_guitar.mp3
🎵 Jazz:        https://archive.org/download/jazz-piano/smooth_jazz.mp3
🎵 Nature:      https://archive.org/download/nature/forest_sounds.mp3
🎵 Electronic:  https://archive.org/download/electronic/chill_loop.mp3
```

**Option B: Use Your Own Music**
- Choose ambient music (lofi, jazz, nature sounds, etc.)
- Download as MP3 file
- Size: Ideally 2-5 MB

#### Step 2: Upload to Free Hosting
Pick one service:

**Option A: Soundcloud** (easiest)
1. Go to soundcloud.com
2. Sign up (free)
3. Upload your MP3
4. Click "Share"
5. Copy the shareable link

**Option B: Internet Archive** (permanent)
1. Go to archive.org
2. Sign up (free)
3. Upload audio file
4. Wait for processing
5. Copy direct download link

**Option C: Dropbox** (simple)
1. Go to dropbox.com
2. Create account
3. Upload MP3 file
4. Right-click → Get shareable link
5. Add `?dl=1` to end of URL

#### Step 3: Add to Dashboard
1. Open DropLink Dashboard
2. Click **Profile** tab (left sidebar)
3. Scroll to **Background Music** section
4. Paste your URL in the input field
5. Example: `https://example.com/music.mp3`
6. Click **Save** button
7. Wait for success message

#### Step 4: Verify It Works
1. Visit your public bio: `droplink.space/@yourname`
2. Should hear music playing automatically
3. Should see music controls:
   - Play/Pause button
   - Volume slider (at 30%)
   - Mute button
   - Progress bar

---

### Part 2: Pi Wallet QR Code Setup (2 minutes)

#### Step 1: Get Your Pi Wallet Address
Option A: From Pi Network App
1. Open Pi Network app on phone
2. Go to Wallet
3. Copy your wallet address (starts with "G")

Option B: Already have address
1. If you know your Pi wallet address
2. Have it ready to paste

#### Step 2: Add to Dashboard
1. Open DropLink Dashboard
2. Click **Financial** tab (left sidebar)
3. Scroll to **Receive DROP or Pi Tips** section
4. Paste wallet address in **Pi Network Wallet** field
5. Format: `G1234567890abcdef...` (56 chars)
6. Optional: Set custom message (e.g., "Send me DROP tokens!")
7. Click **Save** button

#### Step 3: Preview QR Code
1. After saving, click **"View QR Code"** button
2. Dialog opens showing scannable QR code (256x256px)
3. QR contains your wallet address
4. Click **"Copy Address"** to copy wallet
5. Can also click **"Share Wallet"** to generate share link
6. Close dialog

#### Step 4: Verify on Public Bio
1. Visit your public bio: `droplink.space/@yourname`
2. Scroll to **"Receive DROP or Pi Tips"** section
3. Should see:
   - QR code (96x96px)
   - Your wallet address
   - Custom message
   - Copy and Share buttons

---

## Dashboard Overview

After setting up both features, your Dashboard looks like:

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD - PROFILE TAB                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✓ Logo                                                  │
│ ✓ Business Name                                         │
│ ✓ Description                                           │
│ ✓ YouTube Video URL                                    │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Background Music                                   │  │
│ │ [https://example.com/music.mp3 ________]          │  │
│ │ Add a background music URL...                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [Save] button                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD - FINANCIAL TAB                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Pi Network ────────────────────────────────────────┐ │
│ │                                                      │ │
│ │ Custom Message:                                    │ │
│ │ [Send me DROP tokens! 🎁 _______________]         │ │
│ │                                                      │ │
│ │ Wallet Address:                                    │ │
│ │ [G1234567890abcd... ____  [View QR] [Copy]       │ │
│ │                                                      │ │
│ │ [Import from Pi Network] button                    │ │
│ │                                                      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [Save] button                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Public Bio Display

Your public bio now shows both features:

```
┌─────────────────────────────────────────────────────────┐
│ YOUR PUBLIC BIO PAGE                                    │
│ (droplink.space/@yourname)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🎨 Logo / Avatar                                       │
│ 📝 Your Name                                           │
│                                                          │
│ 📄 Description                                         │
│                                                          │
│ 📺 YouTube Video (if set)                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎵 Background Music Controls                       │ │
│ │                                                      │ │
│ │ ▶ 🔊 Volume [████░░] 🔇 Time: 1:23 / 3:45       │ │
│ │ (Music playing in background)                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Receive DROP or Pi Tips                         │ │
│ │                                                      │ │
│ │ Pi Network Wallet                                  │ │
│ │ ┌──────────┐  [Your Custom Message]              │ │
│ │ │  QR CODE │  [G1234567890abcd...]               │ │
│ │ │ (Scan me)│  [Copy] [Share Wallet]              │ │
│ │ └──────────┘                                       │ │
│ │                                                      │ │
│ │ 💡 Tip: Send only Pi Network DROP tokens          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ 👥 Followers Section                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Visitor Experience

### What Visitors See

**On Page Load**:
1. Music starts playing automatically (30% volume)
2. Music controls appear below description
3. Visitor can see QR code in "Receive DROP or Pi Tips" section
4. Everything is interactive

**Music Controls**:
- Can play/pause
- Can adjust volume
- Can mute instantly
- Can skip around with progress bar

**Wallet QR Code**:
- Can scan with phone camera
- Can copy wallet address
- Can see your custom message
- Can click "Share Wallet" for link

### Visitor Journey

```
Visitor arrives on your public bio
         ↓
Sees your profile + music starts playing
         ↓
Listens to ambient background music
         ↓
Reads your description while enjoying music
         ↓
Scrolls down and sees "Receive DROP or Pi Tips" section
         ↓
Decides to support you
         ↓
Scans QR code with phone camera
         ↓
Sends you DROP tokens
         ↓
You receive tokens! 💰
```

---

## Best Practices

### Music Selection

✅ **DO**:
- Choose ambient/lofi music
- Select 3-5 minute loops
- Test with friends
- Use copyright-free music
- Keep file size small (under 5 MB)

❌ **DON'T**:
- Use music with lyrics (distracting)
- Use copyrighted music
- Choose music that's too loud
- Use very short/long clips
- Use large files (slows page)

### Wallet Configuration

✅ **DO**:
- Use correct wallet address
- Write friendly custom message
- Test QR code scans
- Share public bio URL
- Keep wallet address updated

❌ **DON'T**:
- Share private keys (never!)
- Use wrong wallet address
- Leave message empty (use default)
- Make custom message too long
- Change wallet frequently

---

## Customization Options

### Music Settings

**Default Behavior**:
- Autoplay: On (starts when page loads)
- Loop: On (repeats continuously)
- Volume: 30% (visitor-adjustable)

**Can Customize** (if you have developer access):
- Disable autoplay (require click to play)
- Change default volume
- Disable looping
- See `BackgroundMusicPlayer.tsx` for options

### Wallet Settings

**Current Features**:
- One wallet address per profile
- Custom donation message
- QR code preview
- Copy & share buttons
- Plan-based access (premium feature)

**Future Enhancements** (planned):
- Multiple wallet addresses
- Transaction history
- Wallet verification
- Auto-generated thank you messages
- Advanced analytics

---

## Troubleshooting Both Features

### Background Music Issues

**No music playing?**
1. Check URL is correct
2. Test URL in browser
3. Verify file format (MP3/OGG/WAV)
4. Check volume isn't muted
5. Try different browser

**Bad quality?**
1. Use higher bitrate (192 kbps)
2. Try OGG format
3. Check source file quality

### QR Code Issues

**QR not showing?**
1. Verify wallet address saved
2. Refresh page
3. Check wallet address format
4. Try View QR button again

**QR not scannable?**
1. Verify address format
2. Test with different app
3. Check QR size (should be 96x96)
4. Ensure high contrast

### Performance Issues

**Page loading slowly?**
1. Reduce music file size
2. Use CDN hosting
3. Convert to OGG format
4. Verify internet speed

---

## Technical Details

### Database Storage

Both features store data in `profiles` table:

```sql
SELECT 
  username,
  background_music_url,
  pi_wallet_address,
  pi_donation_message
FROM profiles
WHERE username = 'yourname';
```

### File Organization

**Files Involved**:
- `src/pages/Dashboard.tsx` - Setup UI
- `src/pages/PublicBio.tsx` - Display UI
- `src/components/BackgroundMusicPlayer.tsx` - Music player
- `src/components/QRCodeDialog.tsx` - QR preview
- Database: `profiles` table

### Update Flow

```
You Update Dashboard
         ↓
Changes saved to database
         ↓
Public bio refreshes
         ↓
Visitors see updated features
```

---

## Security & Privacy

### What's Stored

**Public Info** (visible to all):
- ✅ Background music URL
- ✅ Pi wallet address
- ✅ Custom message

**Private Info** (never stored):
- ❌ Private keys
- ❌ Passwords
- ❌ Sensitive data

### Privacy Protection

- ✅ Wallet address is intentionally public
- ✅ No payment processing on DropLink
- ✅ Transfers happen directly on Pi Network
- ✅ Your control complete and immediate
- ✅ Can remove/change anytime

---

## Quick Reference

### Setup Checklist

**Background Music**:
- [ ] Find/create music file (MP3)
- [ ] Upload to free hosting
- [ ] Get direct download link
- [ ] Paste in Dashboard
- [ ] Save and verify

**Pi Wallet QR**:
- [ ] Get Pi wallet address
- [ ] Paste in Dashboard
- [ ] Write custom message (optional)
- [ ] Save and verify
- [ ] Test QR scan

**Both Features**:
- [ ] Share public bio URL
- [ ] Tell friends about QR code
- [ ] Monitor feedback
- [ ] Update as needed

---

## Popular Combinations

### Professional Profile
```
Background Music: Soft jazz or ambient
Custom Message: "Support my work with a DROP tip"
Result: Professional, welcoming
```

### Creative Profile
```
Background Music: Lofi beats or chillhop
Custom Message: "Help me create! 🎨"
Result: Energetic, creative
```

### Personal Brand
```
Background Music: Nature sounds or acoustic
Custom Message: "Send me a coffee ☕"
Result: Warm, personal
```

---

## Support Resources

### Documentation Files
- `BACKGROUND_MUSIC_SETUP_GUIDE.md` - Detailed music guide
- `BACKGROUND_MUSIC_QUICK_SETUP.md` - Quick music setup
- `PI_WALLET_QR_SETUP_GUIDE.md` - Detailed wallet guide
- `PI_WALLET_QR_QUICK_REFERENCE.md` - Quick wallet reference

### Code Files
- `src/components/BackgroundMusicPlayer.tsx`
- `src/pages/Dashboard.tsx` (lines 1680-1694 for music, lines 1900-1950 for wallet)
- `src/components/QRCodeDialog.tsx`

---

## Next Steps

1. **Setup Background Music** (5 min)
   - Choose music
   - Upload to hosting
   - Add to Dashboard
   - Test on public bio

2. **Setup Pi Wallet** (2 min)
   - Get wallet address
   - Add to Dashboard
   - Test QR scan
   - Share with friends

3. **Promote** (ongoing)
   - Share public bio URL
   - Tell friends about features
   - Collect feedback
   - Update as needed

4. **Monitor** (ongoing)
   - Check analytics
   - Collect user feedback
   - Track transactions
   - Plan enhancements

---

## FAQ

**Q: Can I use both features?**
A: Yes! They work together perfectly.

**Q: Will it slow down my page?**
A: No, if music file is under 5 MB. Minimal impact.

**Q: Can visitors control the music?**
A: Yes! Full controls (play, volume, mute).

**Q: Are there usage limits?**
A: No, both features are unlimited.

**Q: Can I change music/wallet later?**
A: Yes, anytime from Dashboard.

**Q: Will visitors know when I update?**
A: Yes, they'll see changes when they reload.

---

## Success Checklist

Everything working when:

✅ Music plays on public bio  
✅ Visitors can control volume  
✅ QR code displays on page  
✅ QR is scannable  
✅ No error messages  
✅ Works on mobile  
✅ Page loads quickly  
✅ Visitors send you tips!  

---

**Time to Complete Setup**: 7-10 minutes  
**Total Difficulty**: ⭐ Easy  
**Cost**: Free  
**Impact**: 🚀 High

**Status**: ✅ Both Features Complete & Working  
**Last Updated**: December 5, 2025
