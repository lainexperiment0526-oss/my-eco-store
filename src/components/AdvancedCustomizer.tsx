import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  MousePointer, 
  Monitor, 
  Wallpaper,
  Sparkles,
  Settings,
  Upload,
  Image,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface AdvancedCustomizerProps {
  onSettingsChange: (settings: CustomizationSettings) => void;
  currentSettings: CustomizationSettings;
}

export interface CustomizationSettings {
  header: {
    layout: 'centered' | 'left' | 'split';
    showProfileImage: boolean;
    showBio: boolean;
    backgroundType: 'color' | 'gradient' | 'image';
    backgroundColor: string;
    backgroundGradient: string;
    backgroundImage: string;
  };
  wallpaper: {
    type: 'color' | 'gradient' | 'image' | 'gif' | 'pattern';
    value: string;
    opacity: number;
    blur: number;
    overlay: string;
  };
  text: {
    fontFamily: string;
    titleSize: number;
    bodySize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
    titleWeight: number;
    bodyWeight: number;
  };
  buttons: {
    style: 'filled' | 'outline' | 'ghost' | 'glass' | 'gradient';
    roundness: number;
    spacing: number;
    animation: 'none' | 'hover-lift' | 'hover-glow' | 'pulse';
    gradient: string;
    shadow: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  presets: {
    name: string;
    category: 'minimal' | 'vibrant' | 'professional' | 'creative' | 'modern';
  };
}

const AdvancedCustomizer: React.FC<AdvancedCustomizerProps> = ({
  onSettingsChange,
  currentSettings
}) => {
  const [activeTab, setActiveTab] = useState<'header' | 'wallpaper' | 'text' | 'buttons' | 'colors' | 'presets'>('header');

  const tabs = [
    { id: 'header', label: 'Header', icon: Monitor },
    { id: 'wallpaper', label: 'Wallpaper', icon: Wallpaper },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'buttons', label: 'Buttons', icon: MousePointer },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'presets', label: 'Presets', icon: Sparkles }
  ];

  const fontFamilies = [
    'Inter', 'Helvetica', 'Arial', 'Georgia', 'Times New Roman', 
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Source Sans Pro', 'Nunito', 'Playfair Display', 'Oswald'
  ];

  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ];

  const colorPresets = [
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#06b6d4',
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#0f172a',
        muted: '#64748b'
      }
    },
    {
      name: 'Sunset Orange',
      colors: {
        primary: '#f97316',
        secondary: '#ea580c',
        accent: '#fb923c',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#1c1917',
        muted: '#78716c'
      }
    },
    {
      name: 'Forest Green',
      colors: {
        primary: '#16a34a',
        secondary: '#15803d',
        accent: '#22c55e',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#14532d',
        muted: '#6b7280'
      }
    },
    {
      name: 'Royal Purple',
      colors: {
        primary: '#a855f7',
        secondary: '#9333ea',
        accent: '#c084fc',
        background: '#faf5ff',
        surface: '#ffffff',
        text: '#581c87',
        muted: '#6b7280'
      }
    }
  ];

  const updateSettings = (section: keyof CustomizationSettings, updates: any) => {
    const newSettings = {
      ...currentSettings,
      [section]: { ...currentSettings[section], ...updates }
    };
    onSettingsChange(newSettings);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-800">Advanced Customization</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Header Customization */}
      {activeTab === 'header' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Header Layout</label>
            <div className="grid grid-cols-3 gap-3">
              {['centered', 'left', 'split'].map((layout) => (
                <button
                  key={layout}
                  onClick={() => updateSettings('header', { layout })}
                  className={`p-4 border rounded-lg text-sm font-medium transition-all ${
                    currentSettings.header.layout === layout
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentSettings.header.showProfileImage}
                onChange={(e) => updateSettings('header', { showProfileImage: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 mr-2"
              />
              <span className="text-sm text-gray-700">Show Profile Image</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentSettings.header.showBio}
                onChange={(e) => updateSettings('header', { showBio: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 mr-2"
              />
              <span className="text-sm text-gray-700">Show Bio</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Header Background</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['color', 'gradient', 'image'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateSettings('header', { backgroundType: type })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                    currentSettings.header.backgroundType === type
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type === 'color' && <Palette className="w-4 h-4 mx-auto mb-1" />}
                  {type === 'gradient' && <Layers className="w-4 h-4 mx-auto mb-1" />}
                  {type === 'image' && <Image className="w-4 h-4 mx-auto mb-1" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {currentSettings.header.backgroundType === 'color' && (
              <input
                type="color"
                value={currentSettings.header.backgroundColor}
                onChange={(e) => updateSettings('header', { backgroundColor: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-300"
              />
            )}

            {currentSettings.header.backgroundType === 'gradient' && (
              <select
                value={currentSettings.header.backgroundGradient}
                onChange={(e) => updateSettings('header', { backgroundGradient: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                {gradientPresets.map((gradient, index) => (
                  <option key={index} value={gradient}>
                    Gradient {index + 1}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Wallpaper Customization */}
      {activeTab === 'wallpaper' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Wallpaper Type</label>
            <div className="grid grid-cols-5 gap-2">
              {['color', 'gradient', 'image', 'gif', 'pattern'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateSettings('wallpaper', { type })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                    currentSettings.wallpaper.type === type
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={currentSettings.wallpaper.opacity}
                onChange={(e) => updateSettings('wallpaper', { opacity: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.wallpaper.opacity}%</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blur</label>
              <input
                type="range"
                min="0"
                max="20"
                value={currentSettings.wallpaper.blur}
                onChange={(e) => updateSettings('wallpaper', { blur: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.wallpaper.blur}px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Color</label>
            <input
              type="color"
              value={currentSettings.wallpaper.overlay}
              onChange={(e) => updateSettings('wallpaper', { overlay: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Text Customization */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select
              value={currentSettings.text.fontFamily}
              onChange={(e) => updateSettings('text', { fontFamily: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title Size</label>
              <input
                type="range"
                min="16"
                max="48"
                value={currentSettings.text.titleSize}
                onChange={(e) => updateSettings('text', { titleSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.text.titleSize}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body Size</label>
              <input
                type="range"
                min="12"
                max="20"
                value={currentSettings.text.bodySize}
                onChange={(e) => updateSettings('text', { bodySize: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.text.bodySize}px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Text Alignment</label>
            <div className="flex gap-2">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight }
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateSettings('text', { alignment: value })}
                  className={`p-3 border rounded-lg transition-all ${
                    currentSettings.text.alignment === value
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
            <input
              type="color"
              value={currentSettings.text.color}
              onChange={(e) => updateSettings('text', { color: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Button Customization */}
      {activeTab === 'buttons' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Button Style</label>
            <div className="grid grid-cols-5 gap-2">
              {['filled', 'outline', 'ghost', 'glass', 'gradient'].map((style) => (
                <button
                  key={style}
                  onClick={() => updateSettings('buttons', { style })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                    currentSettings.buttons.style === style
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roundness</label>
              <input
                type="range"
                min="0"
                max="24"
                value={currentSettings.buttons.roundness}
                onChange={(e) => updateSettings('buttons', { roundness: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.buttons.roundness}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
              <input
                type="range"
                min="8"
                max="32"
                value={currentSettings.buttons.spacing}
                onChange={(e) => updateSettings('buttons', { spacing: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{currentSettings.buttons.spacing}px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Animation</label>
            <div className="grid grid-cols-4 gap-2">
              {['none', 'hover-lift', 'hover-glow', 'pulse'].map((animation) => (
                <button
                  key={animation}
                  onClick={() => updateSettings('buttons', { animation })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                    currentSettings.buttons.animation === animation
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {animation === 'none' ? 'None' : animation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={currentSettings.buttons.shadow}
              onChange={(e) => updateSettings('buttons', { shadow: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 mr-2"
            />
            <span className="text-sm text-gray-700">Add Drop Shadow</span>
          </div>
        </div>
      )}

      {/* Color Customization */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Color Presets</label>
            <div className="grid grid-cols-2 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateSettings('colors', preset.colors)}
                  className="p-4 border rounded-lg text-left hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(preset.colors).slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentSettings.colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateSettings('colors', { [key]: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateSettings('colors', { [key]: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">Style Presets</h4>
            <div className="grid grid-cols-1 gap-4">
              {['minimal', 'vibrant', 'professional', 'creative', 'modern'].map((category) => (
                <button
                  key={category}
                  className="p-4 border rounded-lg text-left hover:border-purple-300 transition-colors"
                >
                  <div className="font-medium text-gray-800 mb-1">
                    {category.charAt(0).toUpperCase() + category.slice(1)} Style
                  </div>
                  <div className="text-sm text-gray-600">
                    {category === 'minimal' && 'Clean, simple design with plenty of whitespace'}
                    {category === 'vibrant' && 'Bold colors and dynamic animations'}
                    {category === 'professional' && 'Business-focused with elegant typography'}
                    {category === 'creative' && 'Artistic layouts with unique visual elements'}
                    {category === 'modern' && 'Contemporary design with latest trends'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCustomizer;