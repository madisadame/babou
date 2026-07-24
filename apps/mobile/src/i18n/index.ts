import type { Locale } from '@/domain/locale';

import { fr } from './fr';
import { shimaore } from './shimaore';

// Clés de traduction dérivées du français (source de vérité) : toute clé
// passée à t() doit exister dans `fr`, sinon erreur de typage.
export type TranslationKey = keyof typeof fr;

// Le shimaoré est partiel : les clés absentes retombent sur le français.
export const dictionaries: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  fr,
  shimaore,
};
