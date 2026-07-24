// Langue choisie par l'utilisateur. L'arabe est toujours présent dans le
// contenu ; la locale sélectionne la TRADUCTION affichée et la langue de
// l'interface. Deux versions prévues : arabe + français, arabe + shimaoré.
export type Locale = 'fr' | 'shimaore';

export const DEFAULT_LOCALE: Locale = 'fr';

// Liste ordonnée pour le sélecteur de langue (libellé affiché tel quel).
export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'shimaore', label: 'Shimaoré' },
];
