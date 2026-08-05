-- Verrouillage du contenu côté base de données.
--
-- Avant cette migration, la lecture des livres/chapitres/segments/quiz était
-- ouverte à tous (`using (true)`), donc le contenu payant était extractible via
-- l'API REST avec la seule clé publique — le paywall ne vivait que côté client.
--
-- Après : la lecture exige un accès valide (`has_content_access()`), SAUF pour
-- les livres marqués « vitrine » (`showcase`), qui restent ouverts à tous et
-- servent de porte d'entrée (curieux, référencement, revue Apple).
--
-- À exécuter dans l'éditeur SQL de Supabase. Idempotent.

-- ---------------------------------------------------------------------------
-- 1. Abonnés (alimentée UNIQUEMENT par le webhook RevenueCat, via service role)
-- ---------------------------------------------------------------------------
-- Supabase ne peut pas interroger RevenueCat au moment d'évaluer une politique
-- RLS. On garde donc une copie locale de l'état d'abonnement, tenue à jour par
-- un webhook. Sans cette table, un abonné payant serait bloqué par la RLS.
create table if not exists public.subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement text not null default 'premium',
  active boolean not null default false,
  expires_at timestamptz,
  product_id text,
  store text,
  event_type text,
  updated_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Chacun lit son propre état ; les admins lisent tout.
drop policy if exists subscribers_self on public.subscribers;
create policy subscribers_self on public.subscribers for select
  using (auth.uid() = user_id or public.is_admin());

-- Aucune politique d'écriture : seul le service role (webhook) écrit ici,
-- car il contourne la RLS. Le client ne peut donc pas s'auto-déclarer abonné.

-- ---------------------------------------------------------------------------
-- 2. Livre vitrine
-- ---------------------------------------------------------------------------
alter table public.books add column if not exists showcase boolean not null default false;

comment on column public.books.showcase is
  'Livre ouvert à tous, même sans compte ni abonnement (porte d''entrée).';

-- ---------------------------------------------------------------------------
-- 3. L'utilisateur courant a-t-il accès au contenu payant ?
-- ---------------------------------------------------------------------------
-- Reproduit côté serveur la logique de `useAccess` (src/hooks/use-access.tsx).
-- security definer : doit lire auth.users et contourner la RLS des tables
-- consultées pour la vérification.
create or replace function public.has_content_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    -- a. Abonnement désactivé globalement : toute l'app est libre.
    (select not subscription_enabled from public.app_config where id = 1)
    -- b. Les admins ne sont jamais bloqués.
    or public.is_admin()
    -- c. Accès offert manuellement par un admin.
    or exists (
      select 1 from public.user_access
      where user_id = auth.uid() and manual_override
    )
    -- d. Abonnement actif (miroir de RevenueCat, cf. table subscribers).
    or exists (
      select 1 from public.subscribers
      where user_id = auth.uid()
        and entitlement = 'premium'
        and active
        and (expires_at is null or expires_at > now())
    )
    -- e. Essai : max(création du compte, activation de l'abonnement) + 7 jours.
    --    Garde le même TRIAL_DAYS que le client.
    or (
      select greatest(u.created_at, coalesce(c.subscription_activated_at, u.created_at))
             + interval '7 days' > now()
      from auth.users u
      cross join public.app_config c
      where u.id = auth.uid() and c.id = 1
    ),
    false
  );
$$;

revoke all on function public.has_content_access() from public;
grant execute on function public.has_content_access() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Politiques de lecture du contenu
-- ---------------------------------------------------------------------------
-- Un livre est lisible si : on est admin, OU il est publié et (vitrine ou accès
-- valide). Les chapitres/segments/quiz héritent de la visibilité de leur livre.

drop policy if exists "public read books" on public.books;
create policy "public read books" on public.books for select
  using (
    (select public.is_admin())
    or (published and (showcase or (select public.has_content_access())))
  );

drop policy if exists "public read chapters" on public.chapters;
create policy "public read chapters" on public.chapters for select
  using (
    (select public.is_admin())
    or (
      published
      and exists (
        select 1 from public.books b
        where b.id = chapters.book_id
          and b.published
          and (b.showcase or (select public.has_content_access()))
      )
    )
  );

drop policy if exists "public read chapter_segments" on public.chapter_segments;
create policy "public read chapter_segments" on public.chapter_segments for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = chapter_segments.chapter_id
        and c.published and b.published
        and (b.showcase or (select public.has_content_access()))
    )
  );

drop policy if exists "public read questions" on public.questions;
create policy "public read questions" on public.questions for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.chapters c
      join public.books b on b.id = c.book_id
      where c.id = questions.chapter_id
        and c.published and b.published
        and (b.showcase or (select public.has_content_access()))
    )
  );

drop policy if exists "public read question_choices" on public.question_choices;
create policy "public read question_choices" on public.question_choices for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.questions q
      join public.chapters c on c.id = q.chapter_id
      join public.books b on b.id = c.book_id
      where q.id = question_choices.question_id
        and c.published and b.published
        and (b.showcase or (select public.has_content_access()))
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Désigne « Avant-propos » comme livre vitrine
-- ---------------------------------------------------------------------------
-- Modifiable à tout moment : un seul update suffit pour changer de vitrine.
update public.books set showcase = true where id = 'introduction-l4j20';

-- Index utiles aux sous-requêtes des politiques.
create index if not exists books_showcase_idx on public.books(showcase) where showcase;

-- Force PostgREST à recharger son cache de schéma (nouvelle colonne + table).
notify pgrst, 'reload schema';
