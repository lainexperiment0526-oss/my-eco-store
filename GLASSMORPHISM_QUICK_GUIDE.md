# Quick Integration Guide: Applying Glassmorphism to Components

This guide shows you how to quickly apply glassmorphism to your existing components.

## Importing Glassmorphism Utilities

```tsx
// Option 1: Import the full glassmorphism object
import { glassmorphism } from '@/lib/glassmorphism';

// Option 2: Import specific utilities
import { createGlassComponent, glassClasses, glassPresets } from '@/lib/glassmorphism';

// Option 3: Use CSS class names directly (no imports needed)
// Just add class names like "glass-card", "glass-btn", etc.
```

## Common Component Updates

### Dashboard/Main Container
```tsx
// Before
<div className="min-h-screen bg-background p-4">
  {/* content */}
</div>

// After
<div className="min-h-screen page-glass p-4">
  {/* content */}
</div>
```

### Navigation/Header
```tsx
// Before
<header className="border-b bg-background sticky top-0 z-40">
  {/* nav content */}
</header>

// After
<header className={glassmorphism.presets.header}>
  {/* nav content */}
</header>

// Or manually
<header className="glass-navbar border-b border-white/20 bg-white/8 backdrop-blur-2xl sticky top-0 z-40">
  {/* nav content */}
</header>
```

### Card Components
```tsx
// The Card component from ui/card.tsx is already updated
// Just use it normally:
<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content with automatic glass styling
  </CardContent>
</Card>

// Or apply custom glass styling:
<Card className="glass-deep">
  Custom glass card
</Card>
```

### Form Elements
```tsx
// Input - already updated
<Input placeholder="Enter text..." />

// Textarea - already updated
<Textarea placeholder="Enter description..." />

// Checkbox/Switch
<Switch className="glass-btn" />

// Custom input styling
<Input className={glassmorphism.presets.input} />
```

### Buttons
```tsx
// Using updated Button component with variants
<Button variant="glass">Glass Button</Button>
<Button variant="glass-secondary">Secondary Glass Button</Button>

// Manual glass button
<button className={glassmorphism.presets.primaryButton}>
  Glass Button
</button>
```

### Modals/Dialogs
```tsx
// Dialog component is already updated
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Content - automatically has glass styling */}
  </DialogContent>
</Dialog>

// Or use the preset
<div className={glassmorphism.presets.modal}>
  Modal content
</div>
```

### Tabs
```tsx
// Before
<Tabs defaultValue="tab1" className="w-full">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
</Tabs>

// After - Add glass styling to container
<div className="glass-panel p-4 rounded-lg">
  <Tabs defaultValue="tab1" className="w-full">
    <TabsList className="glass-container">
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

### Dropdown/Menu
```tsx
// Dropdowns automatically inherit glass styling from popover
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent className={glassmorphism.presets.dropdown}>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Badges
```tsx
// Using updated Badge component
<Badge variant="glass">Glass Badge</Badge>

// Manual glass badge
<div className={glassmorphism.presets.badge}>
  Badge Text
</div>
```

### Lists
```tsx
// Before
<div className="list-item border bg-background">
  Item 1
</div>

// After
<div className={glassmorphism.presets.listItem}>
  Item 1
</div>

// Or manually
<div className="glass-list-item border border-white/15 bg-white/8 backdrop-blur-lg hover:bg-white/15">
  Item 1
</div>
```

### Tooltips
```tsx
// Tooltip component is already updated
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    Tooltip text with glass styling
  </TooltipContent>
</Tooltip>
```

### Popover
```tsx
// Popover component is already updated
<Popover>
  <PopoverTrigger>Click me</PopoverTrigger>
  <PopoverContent>
    Popover content with glass styling
  </PopoverContent>
</Popover>
```

## Page-Level Updates

### Dashboard Page Example
```tsx
import { glassmorphism } from '@/lib/glassmorphism';

export function Dashboard() {
  return (
    <div className="page-glass min-h-screen">
      {/* Header */}
      <header className={glassmorphism.presets.header}>
        <h1>Dashboard</h1>
      </header>

      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className={glassmorphism.presets.sidebar}>
          {/* Navigation items */}
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-deep">
              Card 1
            </Card>
            <Card className="glass-deep">
              Card 2
            </Card>
            <Card className="glass-deep">
              Card 3
            </Card>
          </div>

          {/* Form Section */}
          <div className={glassmorphism.presets.panel + " mt-6 p-6 rounded-lg"}>
            <h2>Form</h2>
            <Input className={glassmorphism.presets.input} />
            <Button className={glassmorphism.presets.primaryButton}>
              Submit
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Profile Page Example
```tsx
export function Profile() {
  return (
    <div className="page-glass min-h-screen p-6">
      {/* Hero Section */}
      <div className="hero-glass p-8 rounded-lg mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className={glassmorphism.presets.card + " mb-6"}>
        <div className="flex gap-4">
          <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full" />
          <div>
            <h2>{name}</h2>
            <p>{bio}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className={glassmorphism.presets.panel + " p-6 rounded-lg"}>
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
        <div className="space-y-4">
          <Input className={glassmorphism.presets.input} placeholder="Name" />
          <Textarea className={glassmorphism.presets.input} placeholder="Bio" />
          <Button className={glassmorphism.presets.primaryButton}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Glassmorphism

Apply different glass effects based on screen size:

```tsx
import { glassmorphism } from '@/lib/glassmorphism';

export function ResponsiveComponent() {
  return (
    <div className="space-y-4">
      {/* Mobile: Reduced blur for performance */}
      <div className="md:hidden">
        <div className="glass-soft p-4">
          Mobile glass (subtle blur)
        </div>
      </div>

      {/* Tablet: Medium blur */}
      <div className="hidden md:block lg:hidden">
        <div className="glass-card p-4">
          Tablet glass
        </div>
      </div>

      {/* Desktop: Full blur */}
      <div className="hidden lg:block">
        <div className="glass-premium p-4">
          Desktop glass (maximum blur)
        </div>
      </div>
    </div>
  );
}
```

## Dark Mode Glassmorphism

Dark mode automatically adjusts transparency:

```tsx
import { glassmorphism } from '@/lib/glassmorphism';

export function ThemedComponent() {
  return (
    <div className="dark">
      {/* Automatically uses dark mode glass colors */}
      <Card className="glass-card">
        <p>Dark mode glass styling</p>
      </Card>
    </div>
  );
}
```

## Custom Glassmorphism Components

Create reusable glass components:

```tsx
// GlassCard.tsx
import { createGlassComponent } from '@/lib/glassmorphism';

interface GlassCardProps {
  variant?: 'default' | 'deep' | 'soft';
  children: React.ReactNode;
}

export function GlassCard({ variant = 'default', children }: GlassCardProps) {
  const variants = {
    default: createGlassComponent('card'),
    deep: createGlassComponent('card', 'glass-deep'),
    soft: createGlassComponent('card', 'glass-soft'),
  };

  return (
    <div className={variants[variant] + ' p-6 rounded-lg'}>
      {children}
    </div>
  );
}

// Usage
<GlassCard variant="deep">
  Custom glass card
</GlassCard>
```

## Animation with Glassmorphism

```tsx
import { glassmorphism } from '@/lib/glassmorphism';

export function AnimatedGlassCard() {
  return (
    <div 
      className={
        glassmorphism.presets.card + 
        ' ' + 
        glassmorphism.animations.fadeIn +
        ' transition-all duration-300 hover:shadow-glass-lg'
      }
    >
      Animated glass card
    </div>
  );
}
```

## Performance Optimization

```tsx
// Light glass for performance-critical areas
<Card className="glass-soft">
  {/* Reduced blur for better performance */}
</Card>

// Heavy glass for hero sections
<div className="hero-glass">
  {/* Full blur effect */}
</div>

// Mobile optimization
<Card className="md:glass-card lg:glass-premium">
  {/* Adaptive blur based on screen size */}
</Card>
```

## Testing Glassmorphism

```tsx
// Test different glass effects
export function GlassTestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1>Glassmorphism Test</h1>
      
      <div className="glass p-4">glass</div>
      <div className="glass-card p-4">glass-card</div>
      <div className="glass-premium p-4">glass-premium</div>
      <div className="glass-frosted p-4">glass-frosted</div>
      <div className="glass-soft p-4">glass-soft</div>
      <div className="glass-deep p-4">glass-deep</div>
      
      <div className="glass-modal p-4">glass-modal</div>
      <div className="glass-panel p-4">glass-panel</div>
      <div className="glass-container p-4">glass-container</div>
      
      <button className="glass-btn p-2">glass-btn</button>
      <button className="glass-btn-secondary p-2">glass-btn-secondary</button>
      
      <input className="glass-input p-2 w-full" placeholder="glass-input" />
      <textarea className="glass-input p-2 w-full" placeholder="glass-textarea"></textarea>
    </div>
  );
}
```

## Troubleshooting

### Glass Effect Not Showing
1. Check that background elements are visible
2. Ensure parent has a background color or gradient
3. Verify blur is not `backdrop-blur-0`
4. Check browser support for `backdrop-filter`

### Text Not Readable
1. Increase `bg-white/*` value (use `bg-white/15` instead of `bg-white/5`)
2. Add text shadow if needed: `text-shadow: 0 2px 4px rgba(0,0,0,0.2)`
3. Use darker text color: `text-foreground` or `text-black/80`

### Performance Issues
1. Reduce blur value: use `backdrop-blur-lg` instead of `backdrop-blur-3xl`
2. Limit animated glass elements
3. Use `glass-soft` on mobile instead of `glass-premium`
4. Consider removing backdrop filter on mobile with media queries

## Next Steps

1. Apply glassmorphism presets to main page layouts
2. Update form components with glass input styling
3. Replace existing modal/dialog backdrops with glass-backdrop
4. Update navigation with glass-navbar
5. Apply to sidebar components
6. Update card components throughout pages
7. Test responsive behavior on mobile devices
8. Fine-tune opacity/blur values for your design

---

For more details, see [GLASSMORPHISM_IMPLEMENTATION.md](./GLASSMORPHISM_IMPLEMENTATION.md)
