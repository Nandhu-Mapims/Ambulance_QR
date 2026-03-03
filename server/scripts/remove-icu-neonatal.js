/**
 * One-time script: remove all ICU and NEONATAL data from the database.
 *
 * Deletes (in order):
 *   - CorrectiveAction docs linked to ICU/NEONATAL trip audits
 *   - TripAudit docs with ambulanceType ICU or NEONATAL
 *   - ChecklistTemplate docs for ambulanceType ICU or NEONATAL
 *   - Ambulance docs with type ICU or NEONATAL
 *
 * Usage (from server folder):
 *   node scripts/remove-icu-neonatal.js
 *
 * Uses MONGO_URI from server/.env
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Ambulance = require('../src/models/Ambulance');
const ChecklistTemplate = require('../src/models/ChecklistTemplate');
const TripAudit = require('../src/models/TripAudit');
const CorrectiveAction = require('../src/models/CorrectiveAction');

const MONGO_URI = process.env.MONGO_URI;
const TYPES_TO_REMOVE = ['ICU', 'NEONATAL'];

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  try {
    // 1. Trip audits for ICU/NEONATAL
    const auditIds = await TripAudit.find(
      { ambulanceType: { $in: TYPES_TO_REMOVE } },
      { _id: 1 }
    ).lean();
    const ids = auditIds.map((a) => a._id);

    if (ids.length > 0) {
      const caDeleted = await CorrectiveAction.deleteMany({ tripAuditId: { $in: ids } });
      console.log(`CorrectiveAction: deleted ${caDeleted.deletedCount} linked to ICU/NEONATAL audits.`);
      const auditDeleted = await TripAudit.deleteMany({ _id: { $in: ids } });
      console.log(`TripAudit: deleted ${auditDeleted.deletedCount} (ICU/NEONATAL).`);
    } else {
      console.log('TripAudit: no ICU/NEONATAL audits found.');
    }

    // 2. Checklist templates
    const templateResult = await ChecklistTemplate.deleteMany({
      ambulanceType: { $in: TYPES_TO_REMOVE },
    });
    console.log(`ChecklistTemplate: deleted ${templateResult.deletedCount} (ICU/NEONATAL).`);

    // 3. Ambulances
    const ambulanceResult = await Ambulance.deleteMany({
      type: { $in: TYPES_TO_REMOVE },
    });
    console.log(`Ambulance: deleted ${ambulanceResult.deletedCount} (ICU/NEONATAL).`);

    console.log('\nDone. ICU and NEONATAL data removed.');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
