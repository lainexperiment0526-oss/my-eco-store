/**
 * Bio Template Configuration
 * Defines different layout styles for public bio pages
 */

export type BioTemplate = 'minimal' | 'cards' | 'grid' | 'gallery';

export interface TemplateConfig {
  id: BioTemplate;
  name: string;
  description: string;
  icon: string;
  category: 'compact' | 'visual' | 'professional';
  features: string[];
  preview: {
    backgroundColor: string;
    accentColor: string;
    layout: 'vertical' | 'grid' | 'masonry';
  };
}

export const bioTemplates: Record<BioTemplate, TemplateConfig> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, lightweight, and fast loading. Perfect for simple profiles.',
    icon: '📋',
    category: 'compact',
    features: [
      'Fast loading time',
      'Compact list layout',
      'Minimal animations',
      'Mobile optimized',
      'Simple and elegant',
    ],
    preview: {
      backgroundColor: 'bg-white dark:bg-slate-950',
      accentColor: 'text-gray-900 dark:text-white',
      layout: 'vertical',
    },
  },
  
  cards: {
    id: 'cards',
    name: 'Cards',
    description: 'Professional card-based layout. Each section in its own card with shadows.',
    icon: '🎴',
    category: 'professional',
    features: [
      'Professional appearance',
      'Card-based sections',
      'Shadow effects',
      'Clear separation',
      'Interactive hover',
    ],
    preview: {
      backgroundColor: 'bg-gray-50 dark:bg-slate-900',
      accentColor: 'text-slate-800 dark:text-slate-100',
      layout: 'vertical',
    },
  },
  
  grid: {
    id: 'grid',
    name: 'Grid',
    description: 'Modern 2-3 column grid layout. Great for visual content and products.',
    icon: '🔲',
    category: 'visual',
    features: [
      'Modern grid layout',
      '2-3 column responsive',
      'Visual focus',
      'Best for products',
      'Eye-catching design',
    ],
    preview: {
      backgroundColor: 'bg-white dark:bg-slate-950',
      accentColor: 'text-blue-600 dark:text-blue-400',
      layout: 'grid',
    },
  },
  
  gallery: {
    id: 'gallery',
    name: 'Gallery',
    description: 'Image-focused masonry layout. Showcase images and content beautifully.',
    icon: '🖼️',
    category: 'visual',
    features: [
      'Image-first design',
      'Masonry grid layout',
      'Beautiful animations',
      'Premium feel',
      'Showcase content',
    ],
    preview: {
      backgroundColor: 'bg-black dark:bg-slate-900',
      accentColor: 'text-white',
      layout: 'masonry',
    },
  },
};

export function getTemplateById(id: BioTemplate): TemplateConfig {
  return bioTemplates[id] || bioTemplates.cards;
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(bioTemplates);
}

export function getTemplatesByCategory(
  category: 'compact' | 'visual' | 'professional'
): TemplateConfig[] {
  return Object.values(bioTemplates).filter((t) => t.category === category);
}

export const DEFAULT_TEMPLATE: BioTemplate = 'cards';
