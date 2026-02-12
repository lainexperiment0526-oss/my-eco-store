/**
 * Droplink-Style Template Themes for DropLink Public Bio
 * Provides pre-built visual templates for enhanced profile customization
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  buttonStyle: 'filled' | 'outlined' | 'glass' | 'gradient';
  iconStyle: 'rounded' | 'square' | 'circle';
  font?: string;
  premium?: boolean;
}

export const TEMPLATE_THEMES: TemplateTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark elegant theme with blue accents',
    preview: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
    colors: {
      primary: '#3b82f6',
      background: '#0f0f23',
      text: '#ffffff',
      accent: '#60a5fa'
    },
    buttonStyle: 'filled',
    iconStyle: 'rounded'
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm orange and pink gradient',
    preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    colors: {
      primary: '#ff6b6b',
      background: '#2d1b1b',
      text: '#ffffff',
      accent: '#feca57'
    },
    buttonStyle: 'gradient',
    iconStyle: 'circle'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green earth tones',
    preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    colors: {
      primary: '#22c55e',
      background: '#0a1f0a',
      text: '#ffffff',
      accent: '#71b280'
    },
    buttonStyle: 'filled',
    iconStyle: 'rounded'
  },
  {
    id: 'minimal',
    name: 'Minimal White',
    description: 'Clean minimalist design',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    colors: {
      primary: '#111827',
      background: '#ffffff',
      text: '#111827',
      accent: '#6b7280'
    },
    buttonStyle: 'outlined',
    iconStyle: 'square'
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Vibrant neon cyberpunk style',
    preview: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 100%)',
    colors: {
      primary: '#a855f7',
      background: '#0f0f0f',
      text: '#ffffff',
      accent: '#22d3ee'
    },
    buttonStyle: 'glass',
    iconStyle: 'rounded',
    premium: true
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calm oceanic blue palette',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: {
      primary: '#3b82f6',
      background: '#0c1929',
      text: '#ffffff',
      accent: '#06b6d4'
    },
    buttonStyle: 'filled',
    iconStyle: 'circle'
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    description: 'Elegant rose gold theme',
    preview: 'linear-gradient(135deg, #f4e4d4 0%, #d4a574 100%)',
    colors: {
      primary: '#be7c4d',
      background: '#1a1412',
      text: '#ffffff',
      accent: '#f4e4d4'
    },
    buttonStyle: 'gradient',
    iconStyle: 'rounded',
    premium: true
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool icy blue tones',
    preview: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)',
    colors: {
      primary: '#0ea5e9',
      background: '#0c1929',
      text: '#ffffff',
      accent: '#38bdf8'
    },
    buttonStyle: 'glass',
    iconStyle: 'circle'
  }
];

interface TemplatePickerProps {
  selectedTemplate: string;
  onSelect: (template: TemplateTheme) => void;
  hasPremium?: boolean;
}

export const TemplatePicker = ({ selectedTemplate, onSelect, hasPremium }: TemplatePickerProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {TEMPLATE_THEMES.map((template) => {
        const isSelected = selectedTemplate === template.id;
        const isLocked = template.premium && !hasPremium;
        
        return (
          <button
            key={template.id}
            onClick={() => !isLocked && onSelect(template)}
            disabled={isLocked}
            className={cn(
              "relative rounded-xl overflow-hidden transition-all duration-300 group",
              isSelected 
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" 
                : "hover:scale-102 hover:shadow-lg",
              isLocked && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Preview */}
            <div 
              className="aspect-[3/4] w-full flex flex-col items-center justify-center p-4 gap-2"
              style={{ background: template.preview }}
            >
              {/* Mock profile elements */}
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur" />
              <div className="w-16 h-2 rounded bg-white/30" />
              <div className="w-12 h-1 rounded bg-white/20" />
              
              {/* Mock buttons */}
              <div className="w-full space-y-2 mt-2 px-2">
                <div 
                  className={cn(
                    "h-6 rounded-lg",
                    template.buttonStyle === 'outlined' 
                      ? "border-2 bg-transparent" 
                      : template.buttonStyle === 'glass'
                      ? "bg-white/20 backdrop-blur"
                      : ""
                  )}
                  style={{ 
                    backgroundColor: template.buttonStyle !== 'outlined' && template.buttonStyle !== 'glass' 
                      ? template.colors.primary 
                      : undefined,
                    borderColor: template.buttonStyle === 'outlined' 
                      ? template.colors.primary 
                      : undefined
                  }}
                />
                <div 
                  className={cn(
                    "h-6 rounded-lg",
                    template.buttonStyle === 'outlined' 
                      ? "border-2 bg-transparent" 
                      : template.buttonStyle === 'glass'
                      ? "bg-white/20 backdrop-blur"
                      : ""
                  )}
                  style={{ 
                    backgroundColor: template.buttonStyle !== 'outlined' && template.buttonStyle !== 'glass' 
                      ? template.colors.primary 
                      : undefined,
                    borderColor: template.buttonStyle === 'outlined' 
                      ? template.colors.primary 
                      : undefined
                  }}
                />
              </div>
            </div>
            
            {/* Template name */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
              <p className="text-white text-xs font-medium truncate">{template.name}</p>
              {template.premium && (
                <span className="text-yellow-400 text-[10px]">Premium</span>
              )}
            </div>
            
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            {/* Lock indicator */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs">🔒 Premium</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const getTemplateById = (id: string): TemplateTheme | undefined => {
  return TEMPLATE_THEMES.find(t => t.id === id);
};

export const applyTemplateToProfile = (template: TemplateTheme) => {
  return {
    primaryColor: template.colors.primary,
    backgroundColor: template.colors.background,
    iconStyle: template.iconStyle,
    buttonStyle: template.buttonStyle,
  };
};
