#!/usr/bin/env node
//
// Compare ce que déclarent les fichiers backend/*.sql à ce que contient
// réellement la base Supabase.
//
//   node backend/verifier-schema.mjs
//
// Pourquoi : un fichier de migration présent dans le dépôt ne prouve RIEN sur
// l'état de la base. Trois migrations n'avaient jamais été exécutées, dont
// celle de `delete_own_account` — la suppression de compte exigée par Apple
// (règle 5.1.1 v). L'audit pré-soumission l'avait pourtant jugée conforme :
// il avait vérifié que le code APPELAIT la fonction, pas qu'elle existait.
//
// À lancer avant chaque soumission et après chaque migration.
//
// Lecture seule : aucune écriture possible. La clé publique suffit, et toutes
// les fonctions sondées sont gardées par is_admin() — en anonyme elles
// refusent ou renvoient une liste vide.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const ENV = path.join(RACINE, '..', 'apps', 'mobile', '.env');

// --- identifiants -----------------------------------------------------------

async function lireEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const cle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url && cle) return { url, cle };
  // Repli sur apps/mobile/.env, l'emplacement habituel.
  try {
    const contenu = await readFile(ENV, 'utf8');
    const lire = (nom) => contenu.match(new RegExp(`^${nom}=(.*)$`, 'm'))?.[1]?.trim();
    return {
      url: lire('EXPO_PUBLIC_SUPABASE_URL'),
      cle: lire('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    };
  } catch {
    return {};
  }
}

// --- inventaire déclaré dans les fichiers SQL --------------------------------

async function inventaire() {
  const tables = new Set();
  const colonnes = new Set();
  const fonctions = new Map(); // nom -> [noms des paramètres]

  for (const fichier of (await readdir(RACINE)).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = await readFile(path.join(RACINE, fichier), 'utf8');

    for (const [, t] of sql.matchAll(/create table if not exists public\.(\w+)/g)) {
      tables.add(t);
    }
    for (const [, t, c] of sql.matchAll(/alter table public\.(\w+) add column if not exists (\w+)/g)) {
      colonnes.add(`${t}.${c}`);
    }
    for (const [, nom, args] of sql.matchAll(/create or replace function public\.(\w+)\s*\(([^)]*)\)/gs)) {
      // Premier mot de chaque paramètre = son nom. Indispensable : sonder une
      // fonction sans ses paramètres renvoie PGRST202 et ferait croire à tort
      // qu'elle est absente.
      const parametres = args
        .split(',')
        .map((a) => a.trim().split(/\s+/)[0])
        .filter(Boolean);
      fonctions.set(nom, parametres);
    }
  }
  return { tables: [...tables].sort(), colonnes: [...colonnes].sort(), fonctions };
}

// Valeur neutre selon le type deviné d'après le nom du paramètre.
function valeurNeutre(nom) {
  if (/target$|_id$|^target$/.test(nom)) return '00000000-0000-0000-0000-000000000000';
  if (/email/.test(nom)) return 'sonde@example.invalid';
  if (/^(enabled|value)$/.test(nom)) return false;
  return null;
}

// --- sondage ----------------------------------------------------------------

async function interroger(url, cle, chemin, corps) {
  const reponse = await fetch(`${url}/rest/v1/${chemin}`, {
    method: corps === undefined ? 'GET' : 'POST',
    headers: { apikey: cle, 'Content-Type': 'application/json' },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  // Décodage tolérant : une réponse tronquée en plein caractère arabe casse un
  // décodage strict.
  const octets = new Uint8Array(await reponse.arrayBuffer());
  return new TextDecoder('utf-8', { fatal: false }).decode(octets.slice(0, 400));
}

// --- exécution --------------------------------------------------------------

const { url, cle } = await lireEnv();
if (!url || !cle) {
  console.error(
    "\n❌ Identifiants Supabase introuvables.\n" +
      `   Attendus dans l'environnement ou dans ${ENV}\n`,
  );
  process.exit(1);
}

const { tables, colonnes, fonctions } = await inventaire();
const manquants = [];

console.log(`\n🔍 Vérification de ${url}\n`);

console.log(`TABLES (${tables.length})`);
for (const t of tables) {
  const r = await interroger(url, cle, `${t}?select=*&limit=1`);
  const absente = r.includes('PGRST205');
  if (absente) manquants.push(`table ${t}`);
  console.log(`  ${absente ? '❌' : '✅'} ${t}`);
}

console.log(`\nCOLONNES (${colonnes.length})`);
for (const c of colonnes) {
  const [t, col] = c.split('.');
  const r = await interroger(url, cle, `${t}?select=${col}&limit=1`);
  const absente = r.includes('42703');
  if (absente) manquants.push(`colonne ${c}`);
  console.log(`  ${absente ? '❌' : '✅'} ${c}`);
}

console.log(`\nFONCTIONS (${fonctions.size})`);
for (const [nom, parametres] of [...fonctions].sort()) {
  const corps = Object.fromEntries(parametres.map((p) => [p, valeurNeutre(p)]));
  const r = await interroger(url, cle, `rpc/${nom}`, corps);
  const absente = r.includes('PGRST202');
  if (absente) manquants.push(`fonction ${nom}`);
  console.log(`  ${absente ? '❌' : '✅'} ${nom}(${parametres.join(', ')})`);
}

console.log('\n' + '─'.repeat(52));
if (manquants.length === 0) {
  console.log('✅ La base correspond intégralement à backend/\n');
  process.exit(0);
}
console.log(`❌ ${manquants.length} objet(s) manquant(s) — migration jamais exécutée :`);
for (const m of manquants) console.log(`   - ${m}`);
console.log("\n   Retrouve le fichier concerné dans backend/, colle-le dans l'éditeur");
console.log('   SQL de Supabase (Cmd+A puis Cmd+V), et relance cette vérification.\n');
process.exit(1);
