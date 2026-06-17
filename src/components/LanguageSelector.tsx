import { Globe } from 'lucide-react';
import { languages, useI18n } from '@/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-2" aria-label={t('selectLanguage')}>
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
        <SelectTrigger className={compact ? 'h-9 w-[132px]' : 'h-9 w-full'}>
          <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((item) => (
            <SelectItem key={item.code} value={item.code}>{item.nativeName}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
