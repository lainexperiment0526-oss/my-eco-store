import { Languages } from 'lucide-react';
import { LANGUAGES, useTranslation } from '@/contexts/TranslationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage, translating } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`} data-no-translate>
      <Languages className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="h-9 flex-1 rounded-full bg-background">
          <SelectValue aria-label="Language" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {LANGUAGES.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {translating && (
        <span className="text-xs text-muted-foreground animate-pulse">…</span>
      )}
    </div>
  );
}
