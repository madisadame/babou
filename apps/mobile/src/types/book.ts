/**
 * Modèle de données d'un livre de fiqh.
 * Utilisé pour les données fictives aujourd'hui ; sera alimenté par le backend
 * une fois celui-ci choisi et connecté (étape 6 de la feuille de route).
 */
export interface Book {
  id: string;
  title: string;
  description: string;
}
