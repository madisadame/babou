import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { baseContentRepository } from '@/data/content-repository';
import {
  downloadBook,
  downloadsList,
  initOffline,
  isDownloaded,
  removeBook,
  subscribeOffline,
} from '@/data/offline-store';

// État réactif du mode hors-ligne, pour l'UI (bouton de téléchargement,
// progression, suppression). S'appuie sur le magasin `offline-store`.

type Status = 'idle' | 'downloading' | 'done' | 'error';
export type DownloadEntry = { status: Status; progress: number };

type DownloadsContextValue = {
  ready: boolean;
  count: number;
  entryFor: (bookId: string) => DownloadEntry;
  download: (bookId: string) => Promise<void>;
  remove: (bookId: string) => Promise<void>;
};

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [entries, setEntries] = useState<Record<string, DownloadEntry>>({});

  const refresh = useCallback(() => {
    const list = downloadsList();
    setCount(list.length);
    setEntries((prev) => {
      const next = { ...prev };
      const ids = new Set(list.map((m) => m.bookId));
      // marque « fait » les livres présents dans l'index (sauf en cours)
      for (const meta of list) {
        if (next[meta.bookId]?.status !== 'downloading') {
          next[meta.bookId] = { status: 'done', progress: 1 };
        }
      }
      // nettoie ceux qui ne sont plus téléchargés
      for (const id of Object.keys(next)) {
        if (!ids.has(id) && next[id].status !== 'downloading') delete next[id];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    initOffline().then(() => {
      if (!active) return;
      setReady(true);
      refresh();
    });
    const unsubscribe = subscribeOffline(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const download = useCallback(async (bookId: string) => {
    setEntries((p) => ({ ...p, [bookId]: { status: 'downloading', progress: 0 } }));
    try {
      await downloadBook(bookId, baseContentRepository, (fraction) =>
        setEntries((p) => ({ ...p, [bookId]: { status: 'downloading', progress: fraction } })),
      );
      setEntries((p) => ({ ...p, [bookId]: { status: 'done', progress: 1 } }));
    } catch {
      setEntries((p) => ({ ...p, [bookId]: { status: 'error', progress: 0 } }));
    }
  }, []);

  const remove = useCallback(async (bookId: string) => {
    await removeBook(bookId);
    setEntries((p) => {
      const next = { ...p };
      delete next[bookId];
      return next;
    });
  }, []);

  const entryFor = useCallback(
    (bookId: string): DownloadEntry => {
      const e = entries[bookId];
      if (e) return e;
      return isDownloaded(bookId) ? { status: 'done', progress: 1 } : { status: 'idle', progress: 0 };
    },
    [entries],
  );

  const value = useMemo(
    () => ({ ready, count, entryFor, download, remove }),
    [ready, count, entryFor, download, remove],
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads doit être utilisé dans un DownloadsProvider');
  return ctx;
}
