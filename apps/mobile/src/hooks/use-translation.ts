import { useCallback } from 'react';

import { dictionaries, type TranslationKey } from '@/i18n';
import { fr } from '@/i18n/fr';
import { usePreferences } from '@/hooks/use-preferences';

type Params = Record<string, string | number>;

// Remplace les jetons {{nom}} par les valeurs fournies.
function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in params ? String(params[key]) : `{{${key}}}`,
  );
}

export function useTranslation() {
  const { language } = usePreferences();

  // t(clé, params) : cherche la traduction dans la langue courante, retombe
  // sur le français si absente, puis interpole.
  const t = useCallback(
    (key: TranslationKey, params?: Params): string => {
      const template = dictionaries[language][key] ?? fr[key] ?? key;
      return interpolate(template, params);
    },
    [language],
  );

  return { t, locale: language };
}
