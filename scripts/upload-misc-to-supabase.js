/**
 * scripts/upload-misc-to-supabase.js
 * Upload Audio ZIPs et Packs ZIPs vers Supabase Storage bucket "books"
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET               = 'books';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Définissez SUPABASE_URL et SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadFile(localPath, storagePath) {
  if (!fs.existsSync(localPath)) return;
  
  const ext      = path.extname(localPath).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.pdf') mimeType = 'application/pdf';
  if (ext === '.epub') mimeType = 'application/epub+zip';
  if (ext === '.zip') mimeType = 'application/zip';
  
  const sizeMB   = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1);

  const folder   = storagePath.split('/').slice(0, -1).join('/');
  const fileName = path.basename(storagePath);
  const { data: existing } = await supabase.storage.from(BUCKET).list(folder);
  if (existing?.find(f => f.name === fileName)) {
    console.log(`  ⏭  Déjà uploadé (${sizeMB} MB) : ${storagePath}`);
    return;
  }

  console.log(`  ⬆  Upload ${sizeMB} MB : ${storagePath}`);

  const fileSize = fs.statSync(localPath).size;
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  mimeType,
        'Content-Length': String(fileSize),
        'x-upsert': 'true',
      },
      body: fs.readFileSync(localPath),
      duplex: 'half',
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed: ${err}`);
  }

  console.log(`  ✅ OK : ${storagePath}`);
}

async function main() {
  console.log('🚀 Upload ZIPs (Audio & Packs) vers Supabase Storage…\n');

  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    console.log("No public/downloads folder found.");
    return;
  }

  const files = fs.readdirSync(downloadsDir);
  
  for (const file of files) {
    if (!file.endsWith('.zip')) continue;
    
    // Audio files: audio-fr-leo-et-le-voleur-d-etoiles.zip -> audio/audio-fr-leo-et-le-voleur-d-etoiles.zip
    if (file.startsWith('audio-')) {
      await uploadFile(path.join(downloadsDir, file), `audio/${file}`);
    } 
    // Packs
    else if (file.startsWith('pack-')) {
      await uploadFile(path.join(downloadsDir, file), `packs/${file}`);
    }
  }

  console.log('\n🎉 Terminé !');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
