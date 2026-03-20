import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, defaultLocale } from '@beauty/shared-i18n';

i18next.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18next;
