'use client';

import { useTranslation } from '@/lib/i18n';
import type { SupportedLocale } from '@beauty/shared-i18n';

const localeLabels: Record<SupportedLocale, string> = {
  'pt-BR': 'PT',
  'es-ES': 'ES',
  'en': 'EN',
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const locales: SupportedLocale[] = ['pt-BR', 'es-ES', 'en'];

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            locale === loc
              ? 'bg-brand-rose text-white'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
