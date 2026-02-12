# Floating Action Bar - Complete Guide

## Overview
The dashboard profile tab now features a **sticky floating action bar** at the top right that stays visible while scrolling. This makes it easy to save and preview without scrolling back up.

## Features

### 1. **Save Button** (Emerald Green)
- **Function**: Manually save profile changes instantly
- **Status**:
  - `Save` - Ready to save
  - `Saving...` (with spinner) - Currently saving
  - Disabled during save operation
- **Feedback**: 
  - "Profile saved successfully!" toast
  - Status indicator shows checkmark when complete
  - Automatically resets after 2 seconds

### 2. **Preview Toggle Button** (Sky Blue)
- **Function**: Show/hide the live phone preview
- **States**:
  - `Show Preview` (with Eye icon) - Preview is hidden
  - `Hide Preview` (with EyeOff icon) - Preview is visible
- **Responsive**: Only visible on mobile and tablet (hidden on desktop via `lg:hidden`)

### 3. **Save Status Indicator**
- **Saving State**: Blue pulse animation + "Saving..." text
- **Saved State**: Green checkmark + "Saved" text
- **Auto-hide**: Disappears after 2 seconds of successful save
- **Visual**: Smooth fade transition, color-coded feedback

## Layout & Positioning

```
Mobile/Tablet View (lg:hidden):
┌─────────────────────────────────────────────┐
│  Profile Tab Header                          │
├─────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ │ Saving...    │ │ Save Button  │ │ Preview Btn  │
│ │ (blue pulse) │ │ (emerald)    │ │ (sky blue)   │
│ └──────────────┘ └──────────────┘ └──────────────┘
├─────────────────────────────────────────────┤
│ Business Details Form                        │
│ ... (scrollable content)                     │
└─────────────────────────────────────────────┘

Desktop View:
- Floating action bar is HIDDEN (lg:hidden)
- Users can use header preview button instead
```

## Styling Details

### Save Button
- **Colors**: 
  - Normal: `emerald-500` → `emerald-600` (hover)
  - Disabled: `emerald-400` with 75% opacity
- **Effects**: 
  - Backdrop blur for glassmorphism
  - Scale 105% on hover, 95% on click
  - Smooth shadow transition

### Preview Button
- **Colors**:
  - Normal: `sky-500` → `sky-600` (hover)
- **Effects**: Same as save button with interactive feedback

### Status Indicator
- **Saving**: Blue-100 background, blue-700 text, pulse animation
- **Saved**: Green-100 background, green-700 text, checkmark icon
- **Dark Mode**: Adjusted opacity for dark backgrounds

## User Experience Flow

### Example: Saving Changes
1. User edits profile (e.g., changes business name)
2. Click the **Save** button
3. Button becomes disabled, shows spinner
4. Blue "Saving..." indicator appears
5. Save completes
6. Green "Saved ✓" indicator appears with checkmark
7. Toast confirms "Profile saved successfully!"
8. After 2 seconds, indicator disappears
9. Button returns to normal

### Auto-Save Still Works
- Auto-save triggers every 3 seconds automatically
- Users don't need to use the manual save button
- Manual save is for immediate feedback when needed

## Keyboard Integration (Future)

Could add keyboard shortcut later:
- `Ctrl+S` (or `Cmd+S` on Mac) to trigger manual save
- `P` key to toggle preview

## Responsive Behavior

### Mobile (< 640px)
✅ Floating action bar **visible**
- Takes full width of available space
- Wraps buttons if needed (flex-wrap)
- Sticky at top-16 position

### Tablet (640px - 1024px)
✅ Floating action bar **visible**
- Same layout as mobile
- More horizontal space available

### Desktop (≥ 1024px)
❌ Floating action bar **hidden** (lg:hidden)
- Users have larger screens and sidebar
- Can see preview in adjacent column
- Header has alternative preview button

## CSS Classes Used

```tsx
// Main container
"lg:hidden sticky top-16 z-20 mb-4 flex gap-2 justify-end items-center flex-wrap"

// Button base styling
"inline-flex items-center gap-2 px-4 py-2.5 rounded-full 
 text-white font-medium text-sm shadow-lg hover:shadow-xl 
 transition-all duration-300 transform hover:scale-105 active:scale-95 
 backdrop-blur-sm border"

// Color-specific variants
// Save: "bg-emerald-500 hover:bg-emerald-600 border-emerald-400/50"
// Preview: "bg-sky-500 hover:bg-sky-600 border-sky-400/50"
```

## State Management

### `saveStatus` State
```tsx
type SaveStatus = 'idle' | 'saving' | 'saved'
```

### `handleManualSave()` Function
```tsx
const handleManualSave = async () => {
  setSaveStatus('saving');
  try {
    await autoSave.save(); // Triggers the auto-save logic
    setSaveStatus('saved');
    toast.success('Profile saved successfully!');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    setSaveStatus('idle');
    toast.error('Failed to save profile');
  }
};
```

## Benefits

✅ **No Scrolling Required** - Always accessible at top
✅ **Save Status Feedback** - Users know when save is in progress
✅ **Quick Preview Toggle** - See changes instantly
✅ **Mobile Optimized** - Fits naturally in mobile layout
✅ **Responsive Design** - Hidden on desktop where not needed
✅ **Visual Feedback** - Animations and status indicators
✅ **Accessible** - Large touch targets, clear labels
✅ **Non-Intrusive** - Doesn't block content on mobile

## Future Enhancements

1. **Keyboard Shortcuts**
   - `Ctrl+S` to save
   - `P` to toggle preview

2. **Batch Save** 
   - Combine multiple field changes
   - Show unsaved indicator

3. **Save History**
   - Show last saved time
   - Undo/redo functionality

4. **Other Tabs**
   - Add floating bar to Design, Monetization, Analytics tabs
   - Consistent saving experience across dashboard

## Troubleshooting

**Problem**: Save button disabled and showing "Saving..."
- **Solution**: Wait for save to complete (shows "Saved ✓")

**Problem**: Floating bar overlapping content
- **Solution**: Adjust `top-16` value or `mb-4` margin

**Problem**: Not seeing save status
- **Solution**: Manual save is optional; auto-save still works

**Problem**: Button cuts off on very small screens
- **Solution**: Use `flex-wrap` allows wrapping; adjust padding if needed

