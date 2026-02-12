# Glassmorphism Visual Reference & Examples

This document provides visual examples and descriptions of glassmorphism effects implemented in your application.

## What is Glassmorphism?

Glassmorphism is a modern UI design trend that creates the appearance of **frosted glass** with:
- **Transparency**: Semi-transparent backgrounds (5-25% white opacity)
- **Blur**: Backdrop blur effect (12px-40px) creating a frosted look
- **Gradients**: Subtle linear gradients for depth
- **Borders**: Subtle white borders for definition
- **Shadows**: Soft, diffused shadows for elevation

---

## Visual Examples

### 1. Basic Glass Card
```
┌─────────────────────────────┐
│ ▌ Glass Card (blur: 24px)   │  ← Semi-transparent with blur
│                             │
│ Background elements show    │  ← Blurred through glass
│ through with frosted effect │
│                             │
│ white/10 background         │  ← Light transparency
│ white/20 border             │  ← Subtle border
└─────────────────────────────┘
```

**CSS Classes**: `glass-card border border-white/20 bg-white/10 backdrop-blur-xl`

### 2. Glass Premium (Strong Effect)
```
┌─────────────────────────────┐
│ ╔ Glass Premium (40px blur) ╗ ← Strongest blur effect
│                             │
│ Very frosted glass look     │
│ Maximum transparency effect │
│                             │
│ white/20 background         │ ← Stronger transparency
│ white/30 border             │ ← More visible border
└─────────────────────────────┘
```

**CSS Classes**: `glass-premium border border-white/30 bg-white/20 backdrop-blur-3xl`

### 3. Glass Soft (Subtle Effect)
```
┌─────────────────────────────┐
│ ░ Glass Soft (12px blur)    │  ← Minimal blur effect
│                             │
│ Subtle frosted look         │
│ Minimal transparency        │
│                             │
│ white/5 background          │  ← Very subtle
│ white/10 border             │  ← Faint border
└─────────────────────────────┘
```

**CSS Classes**: `glass-soft border border-white/10 bg-white/5 backdrop-blur-lg`

### 4. Glass Deep (Strong Look)
```
┌─────────────────────────────┐
│ ▌▌ Glass Deep (40px blur)  ▌▌ ← Strong frosted appearance
│                             │
│ Deep frosted glass effect   │
│ High contrast with border   │
│                             │
│ white/25 background         │  ← Strong background
│ white/40 border             │  ← Prominent border
└─────────────────────────────┘
```

**CSS Classes**: `glass-deep border border-white/40 bg-white/25 backdrop-blur-3xl`

---

## Component-Specific Examples

### Glass Button
```
┌─────────────────────┐
│   Glass Button      │  ← Frosted glass appearance
│ (white/15 bg)       │  ← Semi-transparent background
└─────────────────────┘
  ↓ Hover Effect ↓
┌─────────────────────┐
│   Glass Button      │  ← Background becomes opaque
│ (white/25 bg)       │  ← Stronger white overlay
└─────────────────────┘
```

**Default**: `border border-white/30 bg-white/15 backdrop-blur-xl`  
**Hover**: `bg-white/25` with `shadow-glass-lg`

### Glass Input Field
```
┌─────────────────────────────────┐
│ ▌ Glass Input                   │  ← Frosted input field
│ (white/10 bg, 24px blur)        │
└─────────────────────────────────┘
  ↓ Focus Effect ↓
┌─────────────────────────────────┐
│ ▌│ Glass Input (focused)        │  ← Focused state
│ (white/15 bg, more opaque)      │  ← Stronger background
└─────────────────────────────────┘
```

**Default**: `border border-white/20 bg-white/10 backdrop-blur-xl`  
**Focus**: `border-white/40 bg-white/15 shadow-lg`

### Glass Modal/Dialog
```
                    ▓▓▓▓▓▓▓▓▓▓▓▓▓ ← Dark frosted backdrop
              ▓▓▓▓▓▓▓             ▓▓▓▓▓▓▓
            ▓▓▓▓ ┌─────────────────┐ ▓▓▓▓
          ▓▓▓▓   │ ▌ Modal Title   │   ▓▓▓▓
        ▓▓▓▓     │                 │     ▓▓▓▓ ← Glass modal
      ▓▓▓▓       │ Modal content   │       ▓▓▓▓  (40px blur)
      ▓▓         │ with glass      │         ▓▓
      ▓▓       └─────────────────┘       ▓▓
        ▓▓▓▓                           ▓▓▓▓
          ▓▓▓▓                       ▓▓▓▓
            ▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓
              ▓▓▓▓▓▓▓     ▓▓▓▓▓▓▓
```

**Modal**: `glass-modal border border-white/30 bg-white/10 backdrop-blur-3xl`  
**Backdrop**: `glass-backdrop backdrop-blur-sm bg-black/20`

### Glass Navigation Bar
```
═════════════════════════════════════════
║ ▌ Logo  │ Home │ About │ Contact │    ║  ← Glass navbar
║ (white/8 bg, 15px blur, sticky)       ║
═════════════════════════════════════════
```

**Classes**: `glass-navbar border-b border-white/20 bg-white/8 backdrop-blur-2xl`

### Glass Sidebar
```
┌─────────────────┐
│ ▌ Navigation    │
│ │ Dashboard     │ ← Glass sidebar
│ │ Profile       │ (white/5 bg, 12px blur)
│ │ Settings      │
│ │ Logout        │
├─────────────────┤
│ ▌ Other Links   │
│ │ Help          │
│ │ About         │
│                 │
└─────────────────┘
```

**Classes**: `glass-container border-r border-white/15 bg-white/5 backdrop-blur-xl`

### Glass List Item
```
┌─────────────────────────────┐
│ ▌ Item 1                    │ ← Glass list item
│ (white/8 bg, 16px blur)     │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ▌ Item 2                    │ ← Hover effect
│ (white/15 bg, stronger)     │
└─────────────────────────────┘
```

**Default**: `glass-list-item border border-white/15 bg-white/8 backdrop-blur-lg`  
**Hover**: `bg-white/15 border-white/25`

---

## Color Opacity Scale

### Semi-Transparent White Values

| Value | RGB | Usage |
|-------|-----|-------|
| white/5 | rgba(255,255,255,0.05) | Very subtle backgrounds (sidebar) |
| white/8 | rgba(255,255,255,0.08) | Subtle backgrounds (navbar) |
| white/10 | rgba(255,255,255,0.1) | Card/panel backgrounds |
| white/12 | rgba(255,255,255,0.12) | Panel containers |
| white/15 | rgba(255,255,255,0.15) | Button/badge backgrounds |
| white/20 | rgba(255,255,255,0.2) | Border colors (cards) |
| white/25 | rgba(255,255,255,0.25) | Button hover states |
| white/30 | rgba(255,255,255,0.3) | Button/modal borders |
| white/40 | rgba(255,255,255,0.4) | Strong borders, focus states |
| white/50 | rgba(255,255,255,0.5) | Very prominent effects |

---

## Blur Intensity Scale

### Backdrop Blur Values

| Class | Pixel Value | Effect | Best For |
|-------|-------------|--------|----------|
| backdrop-blur-xs | 2px | Barely noticeable | Subtle overlays |
| backdrop-blur-sm | 4px | Minimal blur | Mobile cards |
| backdrop-blur | 8px | Light blur | Default effect |
| backdrop-blur-md | 12px | Moderate blur | Sidebars |
| backdrop-blur-lg | 16px | Strong blur | Lists, inputs |
| backdrop-blur-xl | 24px | Very strong | Cards, buttons |
| backdrop-blur-2xl | 32px | Extreme | Panels, headers |
| backdrop-blur-3xl | 40px | Maximum | Modals, hero |

---

## Color & Blur Combinations

### Recommended Pairings

**Subtle Glass** (Mobile-friendly)
```
border: white/10
background: white/5
blur: backdrop-blur-sm (4px)
→ Minimal performance impact
```

**Soft Glass** (Balance)
```
border: white/15
background: white/8
blur: backdrop-blur-lg (16px)
→ Good visibility without heavy blur
```

**Standard Glass** (Default)
```
border: white/20
background: white/10
blur: backdrop-blur-xl (24px)
→ Balanced and modern
```

**Premium Glass** (Desktop focus)
```
border: white/30
background: white/15
blur: backdrop-blur-3xl (40px)
→ Maximum frosted glass effect
```

**Deep Glass** (Strong effect)
```
border: white/40
background: white/25
blur: backdrop-blur-3xl (40px)
→ High contrast, very visible
```

---

## Common Layout Examples

### Full-Page Layout with Glassmorphism
```
┌────────────────────────────────────────┐
│ ▌ Navigation Bar (glass-navbar)        │  ← Sticky header
├─────────────┬──────────────────────────┤
│ ▌ Sidebar   │ ▌ Main Content           │
│ (glass-     │ (page-glass background)  │
│ container)  │                          │
│             │ ┌──────────────────────┐ │
│             │ │ ▌ Card 1 (glass)     │ │
│             │ └──────────────────────┘ │
│             │ ┌──────────────────────┐ │
│             │ │ ▌ Card 2 (glass)     │ │
│             │ └──────────────────────┘ │
│             │ ┌──────────────────────┐ │
│             │ │ ▌ Card 3 (glass)     │ │
│             │ └──────────────────────┘ │
│             │                          │
└─────────────┴──────────────────────────┘
```

### Form with Glassmorphism
```
┌──────────────────────────────┐
│ ▌ Form Container             │ ← glass-panel
│ (white/12 bg, 16px blur)     │
│                              │
│ ┌────────────────────────┐   │
│ │ Name: [input] ▌        │   │ ← glass-input
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ Email: [input] ▌       │   │ ← glass-input
│ └────────────────────────┘   │
│                              │
│ ┌────────────────────────┐   │
│ │ Message:               │   │
│ │ [textarea] ▌           │   │ ← glass-input
│ │                        │   │
│ └────────────────────────┘   │
│                              │
│ ┌────────────────┐           │
│ │ ▌ Submit      │           │ ← glass-btn
│ └────────────────┘           │
│                              │
└──────────────────────────────┘
```

---

## Animation Effects

### Glass Fade-In
```
Frame 1:  ░░░░░░░░░░░  (very transparent)
Frame 2:  ▌░░░░░░░░░░  (becoming visible)
Frame 3:  ▌▌░░░░░░░░░  (more visible)
Frame 4:  ▌▌▌░░░░░░░░  (almost opaque)
Frame 5:  ▌▌▌▌░░░░░░░  (fully visible)
```

### Glass Shimmer
```
Static:   ▌▌▌▌▌▌▌▌▌▌▌
Shimmer:  ░▌▌▌▌▌▌▌▌▌░  ← Light passes through
```

### Hover Elevation
```
Normal:   ▌ Card ▌           (shadow-glass)
Hover:    ▌ Card ▌▌▌         (shadow-glass-lg)
          ▌▌▌▌▌▌▌▌▌
```

---

## Transparency Layers Example

### Multiple Glass Layers
```
Layer 1 (Background): Solid color or image
Layer 2 (Backdrop blur): 12-40px blur
Layer 3 (White overlay): white/5 to white/25
Layer 4 (Border): white/10 to white/40
Layer 5 (Content): Text and interactive elements
```

### Stacking Effect
```
Background Image
   ↓ (transparent white overlay)
Frosted Glass Effect
   ↓ (semi-transparent background)
Subtle Border
   ↓
Content (Text, Buttons, etc.)
```

---

## Performance Indicators

### Good Performance
- ✅ Cards with `backdrop-blur-xl` on desktop
- ✅ Mobile with `backdrop-blur-sm` or `backdrop-blur-lg`
- ✅ 3-5 animated glass elements per page
- ✅ Smooth 60 FPS scrolling
- ✅ No layout shift on interaction

### Poor Performance
- ❌ Heavy blur on multiple elements
- ❌ Excessive blur animation
- ❌ More than 10 glass elements animating
- ❌ `backdrop-blur-3xl` on mobile
- ❌ Blur changes during scroll

---

## Dark Mode Comparison

### Light Mode
```
Background: white
Glass border: white/20
Glass background: white/10
Border opacity: Reduced to blend with white
```

### Dark Mode
```
Background: dark gray/black
Glass border: white/15 (automatically reduced)
Glass background: white/8 (automatically reduced)
Border opacity: Automatically adjusted for contrast
```

---

## Real-World Application Examples

### E-commerce Product Card
```
┌─────────────────────────┐
│ ▌ [Product Image]       │ ← Semi-transparent overlay
│ │                       │
│ ├─────────────────────┤
│ │ ▌ Product Name      │ ← Glass section
│ │ Price: $99.99       │
│ │ ★★★★★ (5 reviews)   │
│ └─────────────────────┘
│ ┌─────────────────────┐
│ │ ▌ Add to Cart       │ ← Glass button
│ └─────────────────────┘
└─────────────────────────┘
```

### SaaS Dashboard
```
┌────────────────────────────────────────┐
│ ▌ Dashboard (glass-navbar)             │
├──────────┬──────────────────────────────┤
│ ▌ Menu   │ ▌ Welcome Back!              │
│ │ Profile│ (hero-glass section)         │
│ │ Settings                              │
│ │ Billing│ ┌────────────┐ ┌────────────┐│
│ │ Logout │ │ ▌ Metric 1 │ │ ▌ Metric 2 ││
│          │ │ 1,234      │ │ 456        ││
│          │ └────────────┘ └────────────┘│
│          │ ┌────────────┐ ┌────────────┐│
│          │ │ ▌ Metric 3 │ │ ▌ Metric 4 ││
│          │ │ 789        │ │ 101        ││
│          │ └────────────┘ └────────────┘│
│          │ ┌──────────────────────────┐ │
│          │ │ ▌ Recent Activity        │ │
│          │ │ • Update 1 - 2 mins ago  │ │
│          │ │ • Update 2 - 5 mins ago  │ │
│          │ └──────────────────────────┘ │
└──────────┴──────────────────────────────┘
```

### Messaging Interface
```
┌────────────────────────────────────────┐
│ ▌ Messages (glass-navbar)              │
├──────────┬──────────────────────────────┤
│ ▌ Chats  │ ▌ Chat with John            │
│ • Chat 1 │                              │
│ • Chat 2 │ [Previous messages...]       │
│ • Chat 3 │                              │
│          │ ┌────────────────────────┐   │
│          │ │ ▌ Message: [input]    │   │ ← glass-input
│          │ └────────────────────────┘   │
│          │ ┌────────────┐               │
│          │ │ ▌ Send     │               │ ← glass-btn
│          │ └────────────┘               │
└──────────┴──────────────────────────────┘
```

---

## Browser Rendering

### What Happens Behind the Scenes

```
1. HTML/CSS Load
   ↓
2. Create Glass Elements with class names
   ↓
3. Apply backdrop-filter (if supported)
   ↓
4. Render with blur effect
   ↓
5. Layer transparency on top
   ↓
6. Draw border and content
   ↓
7. Display final glassmorphic element
```

### Fallback for Unsupported Browsers

If `backdrop-filter` not supported:
```css
/* Falls back to solid color */
.glass-card {
  background: hsl(var(--card));  /* Solid background */
  border: 1px solid hsl(var(--border));
  /* backdrop-filter is ignored */
}
```

---

## Summary of Effects

| Class | Transparency | Blur | Border | Use Case |
|-------|-------------|------|--------|----------|
| `.glass` | white/15 | 24px | white/20 | General components |
| `.glass-card` | white/10 | 24px | white/20 | Cards, containers |
| `.glass-premium` | white/20 | 40px | white/30 | Premium feel |
| `.glass-soft` | white/5 | 16px | white/10 | Subtle effects |
| `.glass-deep` | white/25 | 40px | white/40 | Strong presence |
| `.glass-modal` | white/10 | 40px | white/30 | Dialogs/modals |
| `.glass-btn` | white/15 | 24px | white/30 | Buttons |
| `.glass-input` | white/10 | 24px | white/20 | Form inputs |
| `.glass-navbar` | white/8 | 32px | white/20 | Navigation |
| `.glass-panel` | white/12 | 32px | white/25 | Content panels |

---

This visual reference should help you understand the glassmorphism design system and how to apply it throughout your application!

