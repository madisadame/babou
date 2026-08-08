import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Book } from '@/domain/book';
import { useAccess } from '@/hooks/use-access';
import { useBook, useBooks } from '@/hooks/use-content';
import { useLastRead, type LastRead } from '@/hooks/use-last-read';
import { usePreferences } from '@/hooks/use-preferences';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useReview } from '@/hooks/use-review';
import { useStudyGoal } from '@/hooks/use-study-goal';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Normalise pour une recherche insensible à la casse ET aux accents :
// « priere » retrouve « Prière ». La décomposition NFD sépare chaque
// lettre de ses signes diacritiques combinants (points de code
// U+0300 à U+036F), qu'on retire ensuite.
const DIACRITIC_START = 0x0300;
const DIACRITIC_END = 0x036f;

function normalize(value: string) {
  let result = '';
  for (const char of value.normalize('NFD')) {
    const code = char.codePointAt(0) ?? 0;
    if (code < DIACRITIC_START || code > DIACRITIC_END) {
      result += char;
    }
  }
  return result.toLowerCase();
}

// Sentinelle interne « tout afficher » (valeur stable, libellé traduit à part).
const ALL_CATEGORIES = '__all__';

// Petit bouton ✕ pour masquer une carte (chaque carte a le sien).
function CardDismiss({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('library.hideCard')}
      style={styles.cardDismiss}>
      <ThemedText style={styles.cardDismissIcon}>✕</ThemedText>
    </Pressable>
  );
}

// Carte « régularité » : série de jours + progression de l'objectif du jour.
function StudyStreakCard({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation();
  const { streak, todaySeconds, goalMinutes, goalMet } = useStudyGoal();
  const todayMin = Math.floor(todaySeconds / 60);
  const value = goalMinutes > 0 ? Math.min(1, todaySeconds / (goalMinutes * 60)) : 0;
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakLeft}>
        <ThemedText style={styles.streakFlame}>🔥</ThemedText>
        <View>
          <ThemedText style={styles.streakNumber}>{streak}</ThemedText>
          <ThemedText style={styles.streakDays}>
            {t(streak > 1 ? 'study.daysOther' : 'study.daysOne')}
          </ThemedText>
        </View>
      </View>
      <View style={styles.streakRight}>
        <ThemedText type="smallBold" style={goalMet ? styles.streakDone : styles.streakTodayLabel}>
          {goalMet ? `✓ ${t('study.goalMet')}` : t('study.today')}
        </ThemedText>
        <ProgressBar value={value} />
        <ThemedText style={styles.streakMin}>
          {t('study.progress', { min: todayMin, goal: goalMinutes })}
        </ThemedText>
      </View>
      <CardDismiss onPress={onDismiss} />
    </View>
  );
}

// Carte « Réviser » : nombre de questions dues (révision espacée). Masquée
// quand il n'y a rien à réviser.
function ReviewCard({ onDismiss }: { onDismiss: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { getDueItems } = useReview();
  const count = getDueItems().length;
  if (count === 0) return null;
  return (
    <View style={styles.reviewCard}>
      <Pressable
        onPress={() => router.push('/review')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
        <ThemedText style={styles.reviewIcon}>📝</ThemedText>
        <View style={styles.reviewTextCol}>
          <ThemedText type="smallBold" style={styles.reviewEyebrow}>
            {t('review.title')}
          </ThemedText>
          <ThemedText style={styles.reviewCount}>
            {t(count > 1 ? 'review.dueOther' : 'review.dueOne', { count })}
          </ThemedText>
        </View>
      </Pressable>
      <CardDismiss onPress={onDismiss} />
    </View>
  );
}

// Carte « Découverte » : montrée au visiteur sans accès, qui ne voit que le
// livre vitrine. Explique pourquoi le catalogue paraît court et mène au
// paywall. Non masquable — c'est la seule explication qu'il reçoit.
function DiscoverCard() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={styles.discoverCard}>
      <Pressable
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        accessibilityLabel={t('library.discoverCta')}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
        <ThemedText style={styles.reviewIcon}>✨</ThemedText>
        <View style={styles.reviewTextCol}>
          <ThemedText type="smallBold" style={styles.reviewEyebrow}>
            {t('library.discoverEyebrow')}
          </ThemedText>
          <ThemedText style={styles.discoverText}>{t('library.discoverBody')}</ThemedText>
          <ThemedText style={styles.discoverCta}>{t('library.discoverCta')} ›</ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

// Carte « Reprendre la lecture » : rouvre le dernier chapitre ouvert.
function ContinueCard({ lastRead, onDismiss }: { lastRead: LastRead; onDismiss: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { getProgress } = useReadingProgress();
  const { book } = useBook(lastRead.bookId);
  const pct = Math.round(getProgress(lastRead.chapterId) * 100);
  const title = book?.title ? `${book.title} · ${lastRead.chapterTitle}` : lastRead.chapterTitle;

  return (
    <View style={styles.continueCard}>
      <Pressable
        onPress={() =>
          router.push({ pathname: '/chapter/[id]', params: { id: lastRead.chapterId } })
        }
        accessibilityRole="button"
        accessibilityLabel={t('home.continue.a11y', { title })}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
        <View style={styles.continueTextCol}>
          <ThemedText type="smallBold" style={styles.continueEyebrow}>
            {t('home.continue.eyebrow')}
          </ThemedText>
          <ThemedText style={styles.continueTitle} numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText style={styles.continueMeta}>
            {t('chapter.meta', { order: lastRead.order, pct })}
          </ThemedText>
        </View>
      </Pressable>
      <CardDismiss onPress={onDismiss} />
    </View>
  );
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { books, loading, failed, reload } = useBooks();
  const { hasAccess } = useAccess();
  const { lastRead } = useLastRead();
  const { showStudyCard, showReviewCard, showContinueCard, setShowCard } = usePreferences();
  const { hasProgress, resetAll } = useReadingProgress();
  // Catégorie passée en paramètre d'URL (ex. depuis le badge de l'écran détail).
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam ?? ALL_CATEGORIES);

  // Synchronise le filtre quand on arrive avec une catégorie en paramètre.
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Catégories dérivées des livres : le backend pourra en ajouter sans
  // toucher à cet écran. La sentinelle « toutes » en tête retire le filtre.
  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(books.map((book) => book.category)))],
    [books],
  );

  const visibleBooks = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = books.filter((book) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || book.category === selectedCategory;
      const matchesQuery = !q || normalize(`${book.title} ${book.description}`).includes(q);
      return matchesCategory && matchesQuery;
    });

    // Tri alphabétique par titre, insensible aux accents (via normalize).
    const sorted = [...filtered].sort((a, b) => {
      const titleA = normalize(a.title);
      const titleB = normalize(b.title);
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    return sortAscending ? sorted : sorted.reverse();
  }, [books, query, sortAscending, selectedCategory]);

  const handleResetAll = () => {
    Alert.alert(t('library.resetAllTitle'), t('library.resetAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('library.resetAllConfirm'), style: 'destructive', onPress: resetAll },
    ]);
  };

  // En-tête défilant : titre, cartes, filtres et tri défilent avec les livres.
  // Seules la barre (Accueil/Réglages) et la recherche restent figées en haut.
  const listHeader = (
    <View>
      <ThemedText type="title" style={styles.title}>
        {t('library.title')}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        {t('library.subtitle')}
      </ThemedText>

      {hasAccess ? null : <DiscoverCard />}

      {/* Cartes de progression : réservées à qui a accès. Sans abonnement,
          elles pointeraient toutes vers du contenu verrouillé et chaque tap
          rebondirait sur le paywall. */}
      {hasAccess && showStudyCard ? (
        <StudyStreakCard onDismiss={() => setShowCard('study', false)} />
      ) : null}
      {hasAccess && showReviewCard ? (
        <ReviewCard onDismiss={() => setShowCard('review', false)} />
      ) : null}
      {hasAccess && showContinueCard && lastRead ? (
        <ContinueCard lastRead={lastRead} onDismiss={() => setShowCard('continue', false)} />
      ) : null}

      <View style={styles.categories}>
        {categories.map((category) => {
          const selected = category === selectedCategory;
          const label = category === ALL_CATEGORIES ? t('library.categoryAll') : category;
          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: selected ? '#0C5A44' : theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setSortAscending((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={sortAscending ? t('library.sortAsc') : t('library.sortDesc')}
        style={({ pressed }) => [
          styles.sortButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold">
          {sortAscending ? t('library.sortAsc') : t('library.sortDesc')}
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel={t('library.backHomeA11y')}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ‹ {t('library.backHome')}
            </ThemedText>
          </Pressable>
          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push('/bookmarks')}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel={t('bookmark.a11y')}>
              <ThemedText style={styles.topStar}>★</ThemedText>
            </Pressable>
            <Link href="/settings" asChild>
              <Pressable
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel={t('settings.a11y')}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {t('settings.title')}
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('library.searchPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={t('library.searchPlaceholder')}
          style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />

        <FlatList
          data={visibleBooks}
          keyExtractor={(book: Book) => book.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/book/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                <BookCard book={item} />
              </Pressable>
            </Link>
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            hasProgress ? (
              <Pressable onPress={handleResetAll} hitSlop={Spacing.two} style={styles.resetAll}>
                <ThemedText type="link" themeColor="textSecondary">
                  {t('library.resetAll')}
                </ThemedText>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            // Une panne réseau n'est PAS un catalogue vide : on le dit, et on
            // propose de réessayer plutôt que d'afficher « aucun livre ».
            failed ? (
              <View style={styles.errorBox}>
                <ThemedText type="smallBold" style={styles.errorTitle}>
                  {t('error.networkTitle')}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.errorBody}>
                  {t('error.networkBody')}
                </ThemedText>
                <Pressable
                  onPress={reload}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.retryLabel}>
                    {t('common.retry')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {loading
                  ? t('common.loading')
                  : query.trim()
                    ? t('library.emptySearch', { query: query.trim() })
                    : t('library.emptyCategory')}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  topStar: {
    fontSize: 18,
    color: '#E0BE6D',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  streakFlame: {
    fontSize: 30,
  },
  streakNumber: {
    color: '#F5EEDA',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  streakDays: {
    color: 'rgba(245, 238, 218, 0.6)',
    fontSize: 12,
  },
  streakRight: {
    flex: 1,
    gap: 5,
  },
  streakTodayLabel: {
    color: 'rgba(245, 238, 218, 0.72)',
  },
  streakDone: {
    color: '#7fd3af',
  },
  streakMin: {
    color: 'rgba(245, 238, 218, 0.6)',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingRight: Spacing.three,
  },
  cardDismiss: {
    position: 'absolute',
    top: 4,
    right: 6,
    padding: 6,
  },
  cardDismissIcon: {
    color: 'rgba(245, 238, 218, 0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: 'rgba(224, 190, 109, 0.35)',
    backgroundColor: 'rgba(224, 190, 109, 0.08)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  reviewIcon: {
    fontSize: 22,
  },
  reviewTextCol: {
    flex: 1,
    gap: 2,
  },
  reviewEyebrow: {
    color: '#E0BE6D',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reviewCount: {
    color: '#F5EEDA',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewChevron: {
    color: 'rgba(245, 238, 218, 0.72)',
    fontSize: 28,
    lineHeight: 28,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(229, 72, 77, 0.45)',
    backgroundColor: 'rgba(229, 72, 77, 0.10)',
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  errorTitle: { color: '#F5EEDA', fontSize: 15 },
  errorBody: { fontSize: 14, lineHeight: 20 },
  retryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.35)',
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  retryLabel: { color: '#F5EEDA' },
  discoverCard: {
    borderWidth: 1,
    borderColor: 'rgba(224, 190, 109, 0.45)',
    backgroundColor: 'rgba(224, 190, 109, 0.12)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  discoverText: {
    color: '#F5EEDA',
    fontSize: 15,
    lineHeight: 21,
  },
  discoverCta: {
    color: '#E0BE6D',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  continueCard: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  continueTextCol: {
    flex: 1,
    gap: 3,
  },
  continueEyebrow: {
    color: '#E0BE6D',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  continueTitle: {
    color: '#F5EEDA',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  continueMeta: {
    color: 'rgba(245, 238, 218, 0.72)',
    fontSize: 13,
  },
  continueChevron: {
    color: 'rgba(245, 238, 218, 0.72)',
    fontSize: 28,
    lineHeight: 28,
  },
  search: {
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  sortButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  resetAll: {
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
});
