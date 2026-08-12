#!/usr/bin/env node
//
// Sauvegarde complète de Babou : contenu, données utilisateurs, comptes et
// médias, dans un dossier horodaté.
//
// Pourquoi ce script : l'offre gratuite de Supabase n'inclut AUCUNE sauvegarde
// automatique. Les livres, chapitres et segments représentent des semaines de
// travail, et une fausse manœuvre en base est irréversible.
//
//   export SUPABASE_SERVICE_ROLE_KEY='eyJ...'
//   node backend/export.mjs               # base + comptes
//   node backend/export.mjs --media       # + fichiers audio et couvertures
//
// La clé « service_role » se trouve dans Supabase → Project Settings → API.
// ⚠️ Elle contourne toute la RLS : elle donne un accès TOTAL en lecture ET en
// écriture. Ne la mets jamais dans un fichier du dépôt, ne la colle nulle part
// en ligne. Ce script ne la lit que depuis l'environnement, jamais d'un fichier.
//
// Aucune dépendance : Node 18+ suffit (fetch est intégré).

import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const URL_PROJET = process.env.SUPABASE_URL ?? 'https://xjmjdwxmszfqnhdtnnru.supabase.co';
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AVEC_MEDIAS = process.argv.includes('--media');

// Tables du schéma public, dans l'ordre des dépendances : un rechargement
// éventuel doit insérer les parents avant les enfants.
const TABLES = [
  'books',
  'chapters',
  'chapter_segments',
  'questions',
  'question_choices',
  'site_content',
  'app_config',
  'admins',
  'user_access',
  'subscribers',
  'user_state',
  'reading_progress',
  'quiz_results',
];

const BUCKET = 'media';
const PAGE = 1000; // PostgREST plafonne les réponses ; on pagine.

if (!CLE) {
  console.error(
    "\n❌ SUPABASE_SERVICE_ROLE_KEY manquante.\n\n" +
      "   Récupère la clé dans Supabase → Project Settings → API (service_role),\n" +
      "   puis lance :\n\n" +
      "     export SUPABASE_SERVICE_ROLE_KEY='eyJ...'\n" +
      '     node backend/export.mjs\n',
  );
  process.exit(1);
}

const entetes = { apikey: CLE, Authorization: `Bearer ${CLE}` };

// Récupère une table entière, page par page.
async function lireTable(table) {
  const lignes = [];
  for (let debut = 0; ; debut += PAGE) {
    const reponse = await fetch(`${URL_PROJET}/rest/v1/${table}?select=*`, {
      headers: { ...entetes, Range: `${debut}-${debut + PAGE - 1}` },
    });
    if (!reponse.ok) {
      throw new Error(`${table} : HTTP ${reponse.status} — ${await reponse.text()}`);
    }
    const lot = await reponse.json();
    lignes.push(...lot);
    if (lot.length < PAGE) break;
  }
  return lignes;
}

// Comptes utilisateurs : hors du schéma public, accessibles via l'API Admin.
// Contient les adresses e-mail — d'où l'exclusion du dépôt (voir .gitignore).
async function lireComptes() {
  const comptes = [];
  for (let page = 1; ; page++) {
    const reponse = await fetch(
      `${URL_PROJET}/auth/v1/admin/users?page=${page}&per_page=200`,
      { headers: entetes },
    );
    if (!reponse.ok) {
      throw new Error(`comptes : HTTP ${reponse.status} — ${await reponse.text()}`);
    }
    const { users = [] } = await reponse.json();
    comptes.push(...users);
    if (users.length < 200) break;
  }
  // On ne garde que l'utile : ni jeton, ni métadonnée interne.
  return comptes.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
  }));
}

// Liste récursive des objets d'un bucket (l'API ne liste qu'un niveau).
async function listerMedias(prefixe = '') {
  const reponse = await fetch(`${URL_PROJET}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...entetes, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: prefixe, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
  });
  if (!reponse.ok) {
    throw new Error(`stockage : HTTP ${reponse.status} — ${await reponse.text()}`);
  }
  const entrees = await reponse.json();
  const fichiers = [];
  for (const entree of entrees) {
    const chemin = prefixe ? `${prefixe}/${entree.name}` : entree.name;
    // Un dossier n'a pas de métadonnées : on descend dedans.
    if (entree.id === null || entree.metadata === null) {
      fichiers.push(...(await listerMedias(chemin)));
    } else {
      fichiers.push({ chemin, taille: entree.metadata?.size ?? 0 });
    }
  }
  return fichiers;
}

async function telechargerMedia(chemin, destination) {
  const reponse = await fetch(`${URL_PROJET}/storage/v1/object/${BUCKET}/${chemin}`, {
    headers: entetes,
  });
  if (!reponse.ok) throw new Error(`${chemin} : HTTP ${reponse.status}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(reponse.body), createWriteStream(destination));
}

function lisible(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 ** 2) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / 1024 ** 2).toFixed(1)} Mo`;
}

// ---------------------------------------------------------------------------

const horodatage = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
const dossier = path.join('backups', horodatage);
await mkdir(dossier, { recursive: true });

console.log(`\n📦 Sauvegarde de Babou → ${dossier}\n`);

const manifeste = { date: new Date().toISOString(), projet: URL_PROJET, tables: {}, medias: null };
let echecs = 0;

for (const table of TABLES) {
  try {
    const lignes = await lireTable(table);
    await writeFile(path.join(dossier, `${table}.json`), JSON.stringify(lignes, null, 2));
    manifeste.tables[table] = lignes.length;
    console.log(`  ✅ ${table.padEnd(18)} ${String(lignes.length).padStart(5)} ligne(s)`);
  } catch (erreur) {
    echecs++;
    manifeste.tables[table] = { erreur: erreur.message };
    console.log(`  ❌ ${table.padEnd(18)} ${erreur.message}`);
  }
}

try {
  const comptes = await lireComptes();
  await writeFile(path.join(dossier, 'auth_users.json'), JSON.stringify(comptes, null, 2));
  manifeste.comptes = comptes.length;
  console.log(`  ✅ ${'auth_users'.padEnd(18)} ${String(comptes.length).padStart(5)} compte(s)`);
} catch (erreur) {
  echecs++;
  manifeste.comptes = { erreur: erreur.message };
  console.log(`  ❌ ${'auth_users'.padEnd(18)} ${erreur.message}`);
}

if (AVEC_MEDIAS) {
  console.log('\n📁 Médias');
  try {
    const fichiers = await listerMedias();
    const total = fichiers.reduce((somme, f) => somme + f.taille, 0);
    console.log(`  ${fichiers.length} fichier(s), ${lisible(total)} au total`);
    let n = 0;
    for (const fichier of fichiers) {
      await telechargerMedia(fichier.chemin, path.join(dossier, 'media', fichier.chemin));
      n++;
      process.stdout.write(`\r  téléchargés : ${n}/${fichiers.length}`);
    }
    process.stdout.write('\n');
    manifeste.medias = { fichiers: fichiers.length, octets: total };
  } catch (erreur) {
    echecs++;
    manifeste.medias = { erreur: erreur.message };
    console.log(`  ❌ ${erreur.message}`);
  }
} else {
  console.log("\n📁 Médias ignorés (ajoute --media pour les inclure)");
}

await writeFile(path.join(dossier, 'manifest.json'), JSON.stringify(manifeste, null, 2));

console.log(
  echecs === 0
    ? `\n✅ Sauvegarde complète dans ${dossier}\n`
    : `\n⚠️  Sauvegarde terminée avec ${echecs} échec(s) — voir manifest.json\n`,
);
process.exit(echecs === 0 ? 0 : 1);
