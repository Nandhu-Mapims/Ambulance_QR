/**
 * Copy data from local/Docker MongoDB to Atlas.
 *
 * From Docker: ensure mongo container exposes 27017, then:
 *   LOCAL_MONGO_URI=mongodb://localhost:27017/ambulance_qr node scripts/migrate-to-atlas.js
 *
 * From server folder: npm run migrate-to-atlas (uses .env MONGO_URI for Atlas)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ambulance_qr';
const ATLAS_URI = process.env.ATLAS_URI;

if (!ATLAS_URI || !ATLAS_URI.includes('mongodb')) {
  console.error('Set ATLAS_URI to your Atlas connection string (e.g. ATLAS_URI=mongodb+srv://... node scripts/migrate-to-atlas.js).');
  process.exit(1);
}

const COLLECTIONS = ['users', 'ambulances', 'checklisttemplates', 'tripaudits', 'correctiveactions'];

async function run() {
  let connLocal, connAtlas;
  try {
    console.log('Connecting to source (local/Docker)...');
    connLocal = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Source connected.');

    console.log('Connecting to Atlas...');
    connAtlas = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('Atlas connected.\n');

    const dbLocal = connLocal.db;
    const dbAtlas = connAtlas.db;

    for (const collName of COLLECTIONS) {
      const localColl = dbLocal.collection(collName);
      const atlasColl = dbAtlas.collection(collName);
      const docs = await localColl.find({}).toArray();
      if (docs.length === 0) {
        console.log(`  ${collName}: (empty, skip)`);
        continue;
      }
      await atlasColl.deleteMany({});
      await atlasColl.insertMany(docs);
      console.log(`  ${collName}: ${docs.length} document(s) copied.`);
    }

    console.log('\nDone. Atlas now has the data.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connLocal) await connLocal.close();
    if (connAtlas) await connAtlas.close();
    process.exit(0);
  }
}

run();
