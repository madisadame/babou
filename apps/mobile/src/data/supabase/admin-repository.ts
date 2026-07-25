import { supabase } from './client';

// Écritures d'administration (réservées aux admins par la RLS). Séparées du
// content-repository (lecture) : seul le back Supabase les implémente.

type Result = { error: string | null };

export type BookInput = {
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  position: number;
};

export type ChapterInput = {
  bookId: string;
  title: string;
  description: string;
  position: number;
};

// Génère un identifiant lisible et unique à partir d'un titre.
function slugify(text: string): string {
  const stripped = [...text.normalize('NFD')]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
  const slug = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'item';
}

function generateId(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toError(error: { message: string } | null): Result {
  return { error: error ? error.message : null };
}

// ---- Livres ----

export async function createBook(input: BookInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('books').insert({
    id: generateId(input.title),
    title: input.title,
    description: input.description,
    category: input.category,
    cover_url: input.coverUrl || null,
    position: input.position,
  });
  return toError(error);
}

export async function updateBook(id: string, input: BookInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('books')
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      cover_url: input.coverUrl || null,
      position: input.position,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteBook(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('books').delete().eq('id', id);
  return toError(error);
}

// ---- Chapitres ----

export async function createChapter(input: ChapterInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapters').insert({
    id: generateId(input.title),
    book_id: input.bookId,
    title: input.title,
    description: input.description,
    position: input.position,
  });
  return toError(error);
}

export async function updateChapter(id: string, input: ChapterInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('chapters')
    .update({
      title: input.title,
      description: input.description,
      position: input.position,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteChapter(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  return toError(error);
}

// ---- Segments de leçon ----

export type SegmentInput = {
  chapterId: string;
  position: number;
  arabic: string;
  translationFr: string;
  translationShimaore: string;
  audioUrl: string;
};

export type AdminSegment = SegmentInput & { id: string };

type SegmentRow = {
  id: string;
  chapter_id: string;
  position: number | null;
  arabic: string | null;
  translation_fr: string | null;
  translation_shimaore: string | null;
  audio_url: string | null;
};

function toAdminSegment(row: SegmentRow): AdminSegment {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    position: row.position ?? 0,
    arabic: row.arabic ?? '',
    translationFr: row.translation_fr ?? '',
    translationShimaore: row.translation_shimaore ?? '',
    audioUrl: row.audio_url ?? '',
  };
}

function segmentColumns(input: SegmentInput) {
  return {
    chapter_id: input.chapterId,
    position: input.position,
    arabic: input.arabic,
    translation_fr: input.translationFr || null,
    translation_shimaore: input.translationShimaore || null,
    audio_url: input.audioUrl || null,
  };
}

export async function getSegments(chapterId: string): Promise<AdminSegment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chapter_segments')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('position');
  if (error || !data) return [];
  return (data as SegmentRow[]).map(toAdminSegment);
}

export async function getSegment(id: string): Promise<AdminSegment | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('chapter_segments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return toAdminSegment(data as SegmentRow);
}

export async function createSegment(input: SegmentInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const id = `${input.chapterId}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from('chapter_segments').insert({ id, ...segmentColumns(input) });
  return toError(error);
}

export async function updateSegment(id: string, input: SegmentInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('chapter_segments')
    .update({
      position: input.position,
      arabic: input.arabic,
      translation_fr: input.translationFr || null,
      translation_shimaore: input.translationShimaore || null,
      audio_url: input.audioUrl || null,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteSegment(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapter_segments').delete().eq('id', id);
  return toError(error);
}

export type WordTiming = { text: string; startMs: number; endMs: number };

// Enregistre les timings mot-à-mot (karaoké) dans la colonne words (jsonb).
export async function updateSegmentWords(id: string, words: WordTiming[]): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapter_segments').update({ words }).eq('id', id);
  return toError(error);
}

// ---- Questions de quiz (avec leurs choix) ----

export type AdminChoiceInput = { textFr: string; textShimaore: string };

export type QuestionInput = {
  chapterId: string;
  position: number;
  promptFr: string;
  promptShimaore: string;
  explanationFr: string;
  explanationShimaore: string;
  correctIndex: number;
  choices: AdminChoiceInput[];
};

export type AdminQuestion = Omit<QuestionInput, 'choices'> & {
  id: string;
  choices: AdminChoiceInput[];
};

type ChoiceRowAdmin = {
  choice_key: string;
  position: number | null;
  text_fr: string | null;
  text_shimaore: string | null;
};

type QuestionRowAdmin = {
  id: string;
  chapter_id: string;
  position: number | null;
  prompt_fr: string | null;
  prompt_shimaore: string | null;
  correct_choice_key: string;
  explanation_fr: string | null;
  explanation_shimaore: string | null;
  question_choices?: ChoiceRowAdmin[];
};

// Clés dérivées de l'ordre : 'a', 'b', 'c'…
const keyForIndex = (index: number) => String.fromCharCode(97 + index);

function toAdminQuestion(row: QuestionRowAdmin): AdminQuestion {
  const sorted = (row.question_choices ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const choices = sorted.map((choice) => ({
    textFr: choice.text_fr ?? '',
    textShimaore: choice.text_shimaore ?? '',
  }));
  const correctIndex = Math.max(
    0,
    sorted.findIndex((choice) => choice.choice_key === row.correct_choice_key),
  );
  return {
    id: row.id,
    chapterId: row.chapter_id,
    position: row.position ?? 0,
    promptFr: row.prompt_fr ?? '',
    promptShimaore: row.prompt_shimaore ?? '',
    explanationFr: row.explanation_fr ?? '',
    explanationShimaore: row.explanation_shimaore ?? '',
    correctIndex,
    choices,
  };
}

export async function getQuestions(chapterId: string): Promise<AdminQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('questions')
    .select('*, question_choices(*)')
    .eq('chapter_id', chapterId)
    .order('position');
  if (error || !data) return [];
  return (data as QuestionRowAdmin[]).map(toAdminQuestion);
}

export async function getQuestion(id: string): Promise<AdminQuestion | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('questions')
    .select('*, question_choices(*)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return toAdminQuestion(data as QuestionRowAdmin);
}

function questionColumns(id: string, input: QuestionInput) {
  return {
    id,
    chapter_id: input.chapterId,
    position: input.position,
    prompt_fr: input.promptFr || null,
    prompt_shimaore: input.promptShimaore || null,
    correct_choice_key: keyForIndex(input.correctIndex),
    explanation_fr: input.explanationFr || null,
    explanation_shimaore: input.explanationShimaore || null,
  };
}

function choiceRows(questionId: string, input: QuestionInput) {
  return input.choices.map((choice, index) => ({
    id: `${questionId}-${keyForIndex(index)}`,
    question_id: questionId,
    position: index + 1,
    choice_key: keyForIndex(index),
    text_fr: choice.textFr || null,
    text_shimaore: choice.textShimaore || null,
  }));
}

export async function createQuestion(input: QuestionInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const id = `${input.chapterId}-q-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from('questions').insert(questionColumns(id, input));
  if (error) return { error: error.message };
  const { error: choiceError } = await supabase.from('question_choices').insert(choiceRows(id, input));
  return toError(choiceError);
}

export async function updateQuestion(id: string, input: QuestionInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('questions').update(questionColumns(id, input)).eq('id', id);
  if (error) return { error: error.message };
  // On remplace l'ensemble des choix (suppression puis réinsertion).
  await supabase.from('question_choices').delete().eq('question_id', id);
  const { error: choiceError } = await supabase.from('question_choices').insert(choiceRows(id, input));
  return toError(choiceError);
}

export async function deleteQuestion(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('questions').delete().eq('id', id);
  return toError(error);
}
