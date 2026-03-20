import ptBR from './locales/pt-BR.json' with { type: 'json' };
import esES from './locales/es-ES.json' with { type: 'json' };
import en from './locales/en.json' with { type: 'json' };

export const resources = {
  'pt-BR': { translation: ptBR },
  'es-ES': { translation: esES },
  'en': { translation: en },
} as const;

export const defaultLocale = 'pt-BR';
export const supportedLocales = ['pt-BR', 'es-ES', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export { ptBR, esES, en };
