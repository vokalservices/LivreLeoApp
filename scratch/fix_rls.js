const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const content = fs.readFileSync('.env.local', 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
});

const dbUrl = env.DIRECT_URL || env.DATABASE_URL;

async function fixRLS() {
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    await prisma.$connect();
    console.log('Connected to database!');

    // 1. Lister les tables existantes dans le schéma public
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    console.log('Tables trouvées:', tables.map(t => t.table_name));

    // 2. Activer RLS sur chaque table
    for (const row of tables) {
      const tableName = row.table_name;
      console.log(`Activation RLS sur "${tableName}"...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
    }

    // 3. Ajouter une politique de lecture publique pour Product si nécessaire
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'Product' AND policyname = 'Public read Product'
          ) THEN
            CREATE POLICY "Public read Product" ON "Product" FOR SELECT USING (true);
          END IF;
        END $$;
      `);
      console.log('Politique de lecture publique ajoutée sur Product.');
    } catch (e) {
      console.log('Note politique Product:', e.message);
    }

    // 4. Vérifier le statut RLS de toutes les tables
    const rlsStatus = await prisma.$queryRawUnsafe(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE pg_namespace.nspname = 'public' AND pg_class.relkind = 'r';
    `);
    console.log('Statut RLS des tables (relrowsecurity = true signifie sécurisé) :');
    console.table(rlsStatus);

    console.log('TOUTES LES TABLES SONT DÉSORMAIS SÉCURISÉES AVEC RLS !');
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRLS();
