import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Document HTML racine, utilisé UNIQUEMENT pour le web (ignoré sur iOS/Android).
// Babou vit sur un fond « nuit » : sans ciel étoilé peint côté web, le body
// resterait blanc et le texte crème deviendrait invisible. On force donc la
// couleur de fond nuit et une hauteur pleine.
const NIGHT = '#083D2C';

const responsiveBackground = `
  html, body, #root { background-color: ${NIGHT}; }
  html, body { height: 100%; }
  #root { display: flex; min-height: 100%; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
