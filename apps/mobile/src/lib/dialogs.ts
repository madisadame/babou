import { Alert, Platform } from 'react-native';

// Dialogues cross-plateforme.
//
// Sur React Native Web, `Alert.alert` ne fonctionne pas : la boîte ne s'affiche
// pas et surtout les callbacks des boutons (confirmation de suppression, etc.)
// ne se déclenchent jamais. On utilise donc `window.alert` / `window.confirm`
// sur le web, et `Alert.alert` sur iOS/Android.

const isWeb = Platform.OS === 'web';

// Message simple (info / erreur).
export function notify(message: string, title?: string): void {
  if (isWeb) {
    globalThis.alert?.(title ? `${title}\n\n${message}` : message);
    return;
  }
  Alert.alert(title ?? '', message);
}

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

// Confirmation (ex. suppression). Exécute `onConfirm` seulement si l'utilisateur
// valide. Fonctionne sur les trois plateformes.
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
}: ConfirmOptions): void {
  if (isWeb) {
    const ok = globalThis.confirm?.(title ? `${title}\n\n${message}` : message);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title ?? '', message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
