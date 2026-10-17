/**
 * scripts/upload-large-to-supabase.js
 * Upload robuste des gros fichiers ZIP vers Supabase Storage
 * Utilise l'API TUS (resumable) pour les fichiers > 6 MB
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET               = 'books';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Définissez SUPABASE_URL et SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Upload via TUS (resumable) — supporte les fichiers de toute taille
async function uploadTUS(localPath, storagePath) {
  const fileSize = fs.statSync(localPath).size;
  const sizeMB   = (fileSize / 1024 / 1024).toFixed(1);
  const ext      = path.extname(localPath).toLowerCase();
  let mimeType   = 'application/octet-stream';
  if (ext === '.zip')  mimeType = 'application/zip';
  if (ext === '.pdf')  mimeType = 'application/pdf';
  if (ext === '.epub') mimeType = 'application/epub+zip';

  const tusUrl = `${SUPABASE_URL}/storage/v1/upload/resumable`;
  const chunkSize = 6 * 1024 * 1024; // 6 MB par chunk

  // ── Étape 1 : Créer la session TUS ──────────────────────────────────────
  console.log(`  ⬆  Upload TUS (${sizeMB} MB) : ${storagePath}`);

  const createRes = await fetch(tusUrl, {
    method: 'POST',
    headers: {
      'Authorization':        `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':         'application/offset+octet-stream',
      'Content-Length':       '0',
      'Tus-Resumable':        '1.0.0',
      'Upload-Length':        String(fileSize),
      'Upload-Metadata':      `bucketName ${Buffer.from(BUCKET).toString('base64')},objectName ${Buffer.from(storagePath).toString('base64')},contentType ${Buffer.from(mimeType).toString('base64')},cacheControl ${Buffer.from('3600').toString('base64')}`,
      'x-upsert':             'true',
    },
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`TUS create failed (${createRes.status}): ${err}`);
  }

  const uploadLocation = createRes.headers.get('location');
  if (!uploadLocation) throw new Error('TUS: pas de Location dans la réponse');

  // URL absolue si relative
  const uploadUrl = uploadLocation.startsWith('http')
    ? uploadLocation
    : `${SUPABASE_URL}${uploadLocation}`;

  // ── Étape 2 : Envoyer chunk par chunk ────────────────────────────────────
  const fd = fs.openSync(localPath, 'r');
  let offset = 0;

  try {
    while (offset < fileSize) {
      const end    = Math.min(offset + chunkSize, fileSize);
      const length = end - offset;
      const buf    = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, offset);

      const patchRes = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization':           `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type':            'application/offset+octet-stream',
          'Content-Length':          String(length),
          'Tus-Resumable':           '1.0.0',
          'Upload-Offset':           String(offset),
        },
        body: buf,
      });

      if (!patchRes.ok) {
        const err = await patchRes.text();
        throw new Error(`TUS patch failed at offset ${offset}: ${err}`);
      }

      offset = end;
      const pct = Math.round((offset / fileSize) * 100);
      process.stdout.write(`\r  📤 ${storagePath} — ${pct}% (${(offset/1024/1024).toFixed(1)}/${sizeMB} MB)`);
    }
  } finally {
    fs.closeSync(fd);
  }

  process.stdout.write('\n');
  console.log(`  ✅ OK : ${storagePath}`);
}

async function fileExistsInBucket(storagePath) {
  const folder   = storagePath.split('/').slice(0, -1).join('/');
  const fileName = path.basename(storagePath);
  const { data } = await supabase.storage.from(BUCKET).list(folder);
  return !!data?.find(f => f.name === fileName);
}

async function main() {
  console.log('🚀 Upload gros ZIPs (TUS resumable) vers Supabase Storage…\n');

  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
  const files = fs.readdirSync(downloadsDir)
    .filter(f => f.endsWith('.zip'))
    .sort();

  for (const file of files) {
    let storagePath;
    if (file.startsWith('audio-'))       storagePath = `audio/${file}`;
    else if (file.startsWith('pack-'))   storagePath = `packs/${file}`;
    else continue;

    // Sauter les originaux qui ont été découpés (garder les -partX)
    const base = file.replace('.zip', '');
    const hasParts = files.some(f => f.startsWith(`${base}-part`));
    if (hasParts) {
      console.log(`  ⏩  Ignoré (découpé en parties) : ${file}`);
      continue;
    }

    const localPath = path.join(downloadsDir, file);

    if (await fileExistsInBucket(storagePath)) {
      const sizeMB = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1);
      console.log(`  ⏭  Déjà uploadé (${sizeMB} MB) : ${storagePath}`);
      continue;
    }

    await uploadTUS(localPath, storagePath);
  }

  console.log('\n🎉 Terminé !');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
