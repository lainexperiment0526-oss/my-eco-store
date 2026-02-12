/**
 * Glassmorphism Design System
 * 
 * Comprehensive utilities and constants for implementing glassmorphism design
 * across the entire application.
 */

/**
 * Glassmorphism CSS classes for various components
 * Usage: Apply these classes to your components for consistent glass effects
 */
export const glassClasses = {
  // Base glass effects
  glass: "glass",
  glassPremium: "glass-premium",
  glassFrosted: "glass-frosted",
  glassSoft: "glass-soft",
  glassDeep: "glass-deep",

  // Specialized glass effects
  glassCard: "glass-card",
  glassModal: "glass-modal",
  glassButton: "glass-btn",
  glassButtonSecondary: "glass-btn-secondary",
  glassInput: "glass-input",
  glassBadge: "glass-badge",
  glassTooltip: "glass-tooltip",
  glassBackdrop: "glass-backdrop",

  // Container glass effects
  glassContainer: "glass-container",
  glassPanel: "glass-panel",
  glassHeader: "glass-header",
  glassNavbar: "glass-navbar",
  glassListItem: "glass-list-item",
  glassDivider: "glass-divider",

  // Transparent surface
  transparentSurface: "transparent-surface",
  glassSurface: "glass-surface",
} as const;

/**
 * Glassmorphism Tailwind utility classes
 * For use with Tailwind CSS className attribute
 */
export const glassTailwind = {
  // Backdrop blur values
  blurXs: "backdrop-blur-xs",
  blurSm: "backdrop-blur-sm",
  blur: "backdrop-blur",
  blurMd: "backdrop-blur-md",
  blurLg: "backdrop-blur-lg",
  blurXl: "backdrop-blur-xl",
  blur2xl: "backdrop-blur-2xl",
  blur3xl: "backdrop-blur-3xl",

  // Box shadows
  shadowGlass: "shadow-glass",
  shadowGlassLg: "shadow-glass-lg",
  shadowGlassSm: "shadow-glass-sm",

  // Glass variants
  variantGlass: "glass-btn",
  variantGlassSecondary: "glass-btn-secondary",
} as const;

/**
 * Glassmorphism color utilities
 * Semi-transparent white colors for glass effects
 */
export const glassColors = {
  white5: "rgba(255, 255, 255, 0.05)",
  white8: "rgba(255, 255, 255, 0.08)",
  white10: "rgba(255, 255, 255, 0.1)",
  white12: "rgba(255, 255, 255, 0.12)",
  white15: "rgba(255, 255, 255, 0.15)",
  white20: "rgba(255, 255, 255, 0.2)",
  white25: "rgba(255, 255, 255, 0.25)",
  white30: "rgba(255, 255, 255, 0.3)",
  white35: "rgba(255, 255, 255, 0.35)",
  white40: "rgba(255, 255, 255, 0.4)",
  white50: "rgba(255, 255, 255, 0.5)",
} as const;

/**
 * Glassmorphism border colors
 * For use with glass effects
 */
export const glassBorders = {
  border10: "border-white/10",
  border15: "border-white/15",
  border20: "border-white/20",
  border25: "border-white/25",
  border30: "border-white/30",
  border40: "border-white/40",
  border50: "border-white/50",
} as const;

/**
 * Glassmorphism background colors
 * For layering glass effects
 */
export const glassBackgrounds = {
  bg5: "bg-white/5",
  bg8: "bg-white/8",
  bg10: "bg-white/10",
  bg12: "bg-white/12",
  bg15: "bg-white/15",
  bg20: "bg-white/20",
  bg25: "bg-white/25",
} as const;

/**
 * Combines multiple glass effect classes
 * Useful for creating custom glass components
 */
export function combineGlassClasses(
  baseGlass: keyof typeof glassClasses,
  additionalClasses?: string
): string {
  const baseClass = glassClasses[baseGlass];
  return additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;
}

/**
 * Creates a custom glassmorphism style object
 * Useful for inline styles or CSS-in-JS
 */
export const glassStyles = {
  baseGlass: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
  },
  premiumGlass: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)",
    backdropFilter: "blur(40px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  softGlass: {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  deepGlass: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)",
    backdropFilter: "blur(40px)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
  },
  frostGlass: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
    backdropFilter: "blur(32px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
} as const;

/**
 * Animation classes for glass effects
 */
export const glassAnimations = {
  shimmer: "animate-glass-shimmer",
  fadeIn: "animate-in fade-in-0",
  slideUp: "animate-in slide-in-from-bottom-4",
  slideDown: "animate-in slide-in-from-top-4",
} as const;

/**
 * Responsive glassmorphism utilities
 * Apply different glass effects based on screen size
 */
export const glassResponsive = {
  // Mobile: Reduced blur for better performance
  mobile: "backdrop-blur-sm bg-white/5",
  // Tablet: Medium blur effect
  tablet: "backdrop-blur-lg bg-white/8",
  // Desktop: Full blur effect
  desktop: "backdrop-blur-3xl bg-white/10",
} as const;

/**
 * Composition function for creating glass component classNames
 */
export function createGlassComponent(
  variant: "card" | "button" | "input" | "modal" | "panel" | "navbar" = "card",
  customClasses?: string
): string {
  const baseClasses: Record<string, string> = {
    card: "glass-card border border-white/20 bg-white/10 backdrop-blur-xl shadow-glass",
    button: "glass-btn border border-white/30 bg-white/15 hover:bg-white/25 backdrop-blur-xl",
    input: "glass-input border border-white/20 bg-white/10 backdrop-blur-xl",
    modal: "glass-modal border border-white/30 bg-white/10 backdrop-blur-3xl shadow-glass-lg",
    panel: "glass-panel border border-white/25 bg-white/12 backdrop-blur-2xl shadow-glass",
    navbar: "glass-navbar border-b border-white/20 bg-white/8 backdrop-blur-2xl",
  };

  const baseClass = baseClasses[variant];
  return customClasses ? `${baseClass} ${customClasses}` : baseClass;
}

/**
 * Glassmorphism presets for common use cases
 */
export const glassPresets = {
  // Card component
  card: "glass-card border border-white/20 bg-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-lg hover:bg-white/15",

  // Button
  primaryButton:
    "glass-btn border border-white/30 bg-white/15 hover:bg-white/25 backdrop-blur-xl transition-all duration-200",
  secondaryButton:
    "glass-btn-secondary border border-white/20 bg-white/5 hover:bg-white/12 backdrop-blur-xl transition-all duration-200",

  // Input field
  input:
    "glass-input border border-white/20 bg-white/10 backdrop-blur-xl placeholder:text-white/50 focus:border-white/40 focus:bg-white/15",

  // Modal/Dialog
  modal: "glass-modal border border-white/30 bg-white/10 backdrop-blur-3xl shadow-glass-lg rounded-lg p-6",

  // Dropdown/Menu
  dropdown: "glass-panel border border-white/25 bg-white/12 backdrop-blur-2xl shadow-glass-lg",

  // Header/Navbar
  header: "glass-header border-b border-white/20 bg-white/10 backdrop-blur-2xl sticky top-0 z-40",

  // Sidebar
  sidebar:
    "glass-container border-r border-white/15 bg-white/5 backdrop-blur-xl min-h-screen sticky top-0",

  // List item
  listItem:
    "glass-list-item border border-white/15 bg-white/8 backdrop-blur-lg hover:bg-white/15 hover:border-white/25 transition-all duration-200",

  // Badge
  badge: "glass-badge border border-white/30 bg-white/15 backdrop-blur-lg px-3 py-1 rounded-full text-sm",

  // Tooltip
  tooltip: "glass-tooltip border border-white/40 bg-white/20 backdrop-blur-2xl shadow-glass-lg px-3 py-1.5 rounded",

  // Divider
  divider: "glass-divider h-px bg-gradient-to-r from-white/0 via-white/30 to-white/0",
} as const;

/**
 * Dark mode glassmorphism adjustments
 */
export const glassDarkMode = {
  cardDark: "glass-card border border-white/10 bg-white/5 backdrop-blur-xl",
  buttonDark: "glass-btn border border-white/25 bg-white/12 hover:bg-white/18",
  inputDark: "glass-input border border-white/15 bg-white/8 backdrop-blur-xl",
  modalDark: "glass-modal border border-white/20 bg-white/8 backdrop-blur-3xl",
} as const;

/**
 * Export all glassmorphism utilities as a single object
 */
export const glassmorphism = {
  classes: glassClasses,
  tailwind: glassTailwind,
  colors: glassColors,
  borders: glassBorders,
  backgrounds: glassBackgrounds,
  styles: glassStyles,
  animations: glassAnimations,
  responsive: glassResponsive,
  presets: glassPresets,
  darkMode: glassDarkMode,
  createComponent: createGlassComponent,
  combineClasses: combineGlassClasses,
} as const;

export default glassmorphism;
