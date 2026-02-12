import React, { useState } from 'react';
import { BioTemplate, bioTemplates, getTemplateById } from '@/config/bioTemplates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: BioTemplate;
  onTemplateChange: (template: BioTemplate) => void;
  onPreviewChange?: (show: boolean) => void;
}

export function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
  onPreviewChange,
}: TemplateSelectorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const templates = Object.values(bioTemplates);
  const currentTemplate = getTemplateById(selectedTemplate);

  const handleTemplateSelect = (template: BioTemplate) => {
    onTemplateChange(template);
  };

  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
    onPreviewChange?.(!showPreview);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl w-full mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Bio Page Templates
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Choose how your public bio page looks. Change anytime!
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{templates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer transition-all duration-300 transform active:scale-95 sm:hover:scale-105 ${
              selectedTemplate === template.id ? 'ring-2 ring-sky-500' : ''
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <Card className={`h-full p-4 sm:p-6 text-center space-y-2 sm:space-y-4 ${
              selectedTemplate === template.id
                ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-500'
                : 'hover:shadow-lg'
            }`}>
              {/* Icon */}
              <div className="text-3xl sm:text-4xl">{template.icon}</div>

              {/* Name */}
              <div>
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mt-1">
                  {template.category}
                </p>
              </div>

              {/* Description - Hide on very small screens */}
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {template.description}
              </p>

              {/* Features - Hide on mobile, show on larger screens */}
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 hidden md:block">
                {template.features.slice(0, 2).map((feature, idx) => (
                  <li key={idx} className="flex items-center justify-center gap-2">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Selected Badge */}
              {selectedTemplate === template.id && (
                <div className="pt-1 sm:pt-2 flex justify-center">
                  <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-sky-500 text-white text-xs font-semibold">
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Selected</span>
                    <span className="sm:hidden">✓</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* Current Template Details */}
      <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {currentTemplate.name} Template
          </h3>

          {/* Template Info Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Layout Type */}
            <div>
              <Label className="text-xs uppercase font-semibold text-gray-600 dark:text-gray-400">
                Layout Style
              </Label>
              <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize">
                {currentTemplate.preview.layout}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs uppercase font-semibold text-gray-600 dark:text-gray-400">
                Category
              </Label>
              <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize">
                {currentTemplate.category}
              </div>
            </div>
          </div>

          {/* Full Features List */}
          <div className="mt-4 sm:mt-6">
            <Label className="text-xs uppercase font-semibold text-gray-600 dark:text-gray-400">
              Key Features
            </Label>
            <ul className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
              {currentTemplate.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-700 dark:text-gray-300"
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-xs flex-shrink-0">
                    ✓
                  </span>
                  <span className="text-sm sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <div className="flex gap-2 sm:gap-3">
          <div className="text-xl sm:text-2xl flex-shrink-0">💡</div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Preview Before Changing</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Switch to the preview tab to see your changes live. Your profile data stays the same!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
