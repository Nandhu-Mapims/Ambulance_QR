/**
 * Seed script — populates the database with realistic demo data.
 *
 * Usage:
 *   # against local Mongo (default)
 *   node src/seed.js
 *
 *   # with custom URI
 *   MONGO_URI=mongodb://localhost:27017/ambulance_qr node src/seed.js
 *
 *   # wipe & reseed
 *   node src/seed.js --fresh
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const QRCode = require('qrcode');

const User = require('./models/User');
const Ambulance = require('./models/Ambulance');
const ChecklistTemplate = require('./models/ChecklistTemplate');
const TripAudit = require('./models/TripAudit');
const CorrectiveAction = require('./models/CorrectiveAction');

const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FRESH = process.argv.includes('--fresh');

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const secureToken = () => crypto.randomBytes(32).toString('hex');
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/* ── User data ────────────────────────────────────────────────────────────── */
const USERS = [
  { name: 'Admin System',   email: 'admin@ambuqr.com',      password: 'Admin@123',    role: 'ADMIN',          station: 'HQ' },
  { name: 'Supervisor Ali', email: 'sup.ali@ambuqr.com',    password: 'Super@123',    role: 'SUPERVISOR',     station: 'HQ' },
  { name: 'Supervisor Nisa',email: 'sup.nisa@ambuqr.com',   password: 'Super@123',    role: 'SUPERVISOR',     station: 'North' },
  { name: 'EMT Karim',      email: 'emt.karim@ambuqr.com',  password: 'Emt@1234',     role: 'EMT',            station: 'HQ' },
  { name: 'EMT Farid',      email: 'emt.farid@ambuqr.com',  password: 'Emt@1234',     role: 'EMT',            station: 'North' },
  { name: 'EMT Layla',      email: 'emt.layla@ambuqr.com',  password: 'Emt@1234',     role: 'EMT',            station: 'South' },
  { name: 'Dr. View',       email: 'assessor@ambuqr.com',   password: 'View@1234',    role: 'ASSESSOR_VIEW',  station: 'HQ' },
];

/* ── Ambulance data ───────────────────────────────────────────────────────── */
const AMBULANCES = [
  // ALS
  { numberPlate: 'TN-19-BZ-1980', type: 'ALS', station: 'HQ' },
  { numberPlate: 'TN-19-Y-0792', type: 'ALS', station: 'HQ' },
  { numberPlate: 'TN-19-U-1341', type: 'ALS', station: 'HQ' },
  { numberPlate: 'TN-19-BX-2772', type: 'ALS', station: 'HQ' },
  { numberPlate: 'TN-19-BS-9009', type: 'ALS', station: 'HQ' },
  { numberPlate: 'T0126TN6151A', type: 'ALS', station: 'HQ' },
  // BLS
  { numberPlate: 'TN-19-BS-9990', type: 'BLS', station: 'HQ' },
  { numberPlate: 'TN-19-BS-9909', type: 'BLS', station: 'HQ' },
  { numberPlate: 'TN-19-BS-9549', type: 'BLS', station: 'HQ' },
  { numberPlate: 'TN-19-AY-0369', type: 'BLS', station: 'HQ' },
  { numberPlate: 'TN-19-AZ-9954', type: 'BLS', station: 'HQ' },
  // TRANSPORT
  { numberPlate: 'TN-19-V-0567', type: 'TRANSPORT', station: 'HQ' },
  { numberPlate: 'TN-09-AS-6660', type: 'TRANSPORT', station: 'HQ' },
  { numberPlate: 'TN-19-V-0234', type: 'TRANSPORT', station: 'HQ' },
];

/* ── Checklist templates ──────────────────────────────────────────────────── */
/* BLS/ALS shared checklist (16 items from BLS AMBULANCE CHECKLIST) */
const BLS_ALS_QUESTIONS = [
  { key: 'air_tyre_wheels',      label: 'Air tyre / wheels condition',                          type: 'DROPDOWN', required: true, requiresEvidenceIfNo: false, order: 0, options: ['Good', 'Needs Attention', 'Not OK'] },
  { key: 'battery_charging',     label: 'Battery charging capacity',                            type: 'DROPDOWN', required: true, requiresEvidenceIfNo: false, order: 1, options: ['Good', 'Needs Charge', 'Replace Soon'] },
  { key: 'headlight_siren',      label: 'Headlight and siren / alarm working?',                 type: 'YESNO',    required: true, requiresEvidenceIfNo: false, order: 2 },
  { key: 'air_condition',        label: 'Air condition working?',                               type: 'YESNO',    required: true, requiresEvidenceIfNo: false, order: 3 },
  { key: 'fuel_level',           label: 'Fuel level',                                           type: 'DROPDOWN', required: true, requiresEvidenceIfNo: false, order: 4, options: ['Full', 'Three quarters', 'Half', 'Quarter or less'] },
  { key: 'oxygen_spare_cylinder', label: 'Oxygen (O2) level & spare cylinder available?',       type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 5 },
  { key: 'defibrillator',       label: 'Defibrillator working with accessories?',               type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 6 },
  { key: 'patient_monitor',     label: 'Patient monitor with accessories OK?',                  type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 7 },
  { key: 'ventilator_accessories', label: 'Ventilator with accessories (circuit, mask, tubing)?', type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 8 },
  { key: 'suction_nebulizer',   label: 'Suction & nebulizer working?',                          type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 9 },
  { key: 'laryngoscope_sets',   label: 'Laryngoscope sets (handles, blades, batteries) available?', type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 10 },
  { key: 'ambu_bag_sets',       label: 'AMBU bag sets (adult / pediatric / neonatal) available?', type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 11 },
  { key: 'stretcher_bedsheets', label: 'Stretcher with bedsheets OK?',                         type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 12 },
  { key: 'emergency_medicine',  label: 'Emergency medicine available?',                        type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 13 },
  { key: 'bp_steth_cbg_thermo', label: 'BP, stethoscope, CBG & thermometer available?',         type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 14 },
  { key: 'ppe_sanitizer_waste', label: 'PPE kit, hand sanitizer, biomedical waste bags available?', type: 'YESNO', required: true, requiresEvidenceIfNo: false, order: 15 },
];

const BLS_QUESTIONS = BLS_ALS_QUESTIONS;

const ALS_QUESTIONS = BLS_ALS_QUESTIONS;

const TRANSPORT_QUESTIONS = [
  { key: 'air_tyre_wheels',     label: 'Air tyre / wheels condition',                    type: 'DROPDOWN', required: true,  requiresEvidenceIfNo: false, order: 0, options: ['Good', 'Needs Attention', 'Not OK'] },
  { key: 'battery_charging',    label: 'Battery charging capacity',                      type: 'DROPDOWN', required: true,  requiresEvidenceIfNo: false, order: 1, options: ['Good', 'Needs Charge', 'Replace Soon'] },
  { key: 'headlight_siren',     label: 'Headlight and siren / alarm working?',           type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 2 },
  { key: 'fuel_level',          label: 'Fuel level',                                     type: 'DROPDOWN', required: true,  requiresEvidenceIfNo: false, order: 3, options: ['Full', 'Three quarters', 'Half', 'Quarter or less'] },
  { key: 'emergency_medicine',  label: 'Emergency medicines available?',                 type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 4 },
  { key: 'interior_cleanliness',label: 'Interior cleanliness satisfactory?',             type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 5 },
  { key: 'first_aid_box',       label: 'First aid box complete and accessible?',         type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 6 },
];

const TEMPLATES_DATA = [
  { ambulanceType: 'BLS',       name: 'BLS Ambulance Checklist',        version: 1, questions: BLS_QUESTIONS },
  { ambulanceType: 'ALS',       name: 'ALS Ambulance Checklist',        version: 1, questions: ALS_QUESTIONS },
  { ambulanceType: 'TRANSPORT', name: 'Patient Transport Checklist',   version: 1, questions: TRANSPORT_QUESTIONS },
];

/* ── Audit responses builder ──────────────────────────────────────────────── */
const buildResponses = (questions, forcePass = false) => {
  return questions.map((q) => {
    if (q.type === 'YESNO') {
      const value = forcePass ? 'YES' : rnd(['YES', 'YES', 'YES', 'NO']); // 75% YES
      return { key: q.key, value, evidenceUrl: null };
    }
    if (q.type === 'NUMBER') return { key: q.key, value: String(Math.floor(Math.random() * 50000 + 5000)), evidenceUrl: null };
    if (q.type === 'DATE')   return { key: q.key, value: new Date(daysAgo(Math.floor(Math.random() * 60))).toISOString().split('T')[0], evidenceUrl: null };
    if (q.type === 'DROPDOWN') return { key: q.key, value: rnd(q.options), evidenceUrl: null };
    if (q.type === 'TEXT')   return { key: q.key, value: rnd(['All good', 'Minor issue noted', 'Checked and clear', '']), evidenceUrl: null };
    if (q.type === 'PHOTO')  return { key: q.key, value: null, evidenceUrl: null };
    return { key: q.key, value: null, evidenceUrl: null };
  });
};

const calcCompliance = (questions, responses) => {
  const yesnoKeys = questions.filter((q) => q.type === 'YESNO').map((q) => q.key);
  if (!yesnoKeys.length) return { complianceScore: 100, nonComplianceCount: 0, nonCompliantKeys: [] };
  const rMap = Object.fromEntries(responses.map((r) => [r.key, r]));
  const nonCompliantKeys = yesnoKeys.filter((k) => rMap[k]?.value === 'NO');
  const complianceScore = Math.round(((yesnoKeys.length - nonCompliantKeys.length) / yesnoKeys.length) * 100);
  return { complianceScore, nonComplianceCount: nonCompliantKeys.length, nonCompliantKeys };
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
async function seed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is required in .env (e.g. mongodb://localhost:27017/ambulance_qr for Docker).');
    process.exit(1);
  }
  console.log('\n🌱  Ambulance QR — Seed Script');
  console.log('━'.repeat(50));
  console.log(`   MongoDB : ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`   Mode    : ${FRESH ? '🔴 FRESH (wipe & reseed)' : '🟢 Upsert (safe)'}`);
  console.log('━'.repeat(50) + '\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  if (FRESH) {
    await Promise.all([
      User.deleteMany({}),
      Ambulance.deleteMany({}),
      ChecklistTemplate.deleteMany({}),
      TripAudit.deleteMany({}),
      CorrectiveAction.deleteMany({}),
    ]);
    console.log('🗑️  Collections cleared\n');
  }

  /* ── 1. Users ─────────────────────────────────────────────────────────── */
  console.log('👤  Seeding users…');
  const userMap = {};
  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      userMap[u.email] = existing;
      console.log(`   ↩  ${u.role.padEnd(14)} ${u.email} (exists)`);
    } else {
      const created = await User.create(u);
      userMap[u.email] = created;
      console.log(`   ✅ ${u.role.padEnd(14)} ${u.email}`);
    }
  }

  const adminUser = userMap['admin@ambuqr.com'];
  const emtUsers = [userMap['emt.karim@ambuqr.com'], userMap['emt.farid@ambuqr.com'], userMap['emt.layla@ambuqr.com']];
  const supervisor = userMap['sup.ali@ambuqr.com'];

  /* ── 2. Ambulances ────────────────────────────────────────────────────── */
  console.log('\n🚑  Seeding ambulances…');
  const ambulanceMap = {};
  const rawTokenMap = {};

  for (const a of AMBULANCES) {
    const token = secureToken();
    const qrTokenHash = hashToken(token);
    rawTokenMap[a.numberPlate] = token;

    const existing = await Ambulance.findOne({ numberPlate: a.numberPlate });
    if (existing) {
      ambulanceMap[a.numberPlate] = existing;
      console.log(`   ↩  ${a.numberPlate.padEnd(10)} ${a.type} (exists)`);
    } else {
      const created = await Ambulance.create({
        ...a,
        qrTokenHash,
        lastQrRotatedAt: daysAgo(Math.floor(Math.random() * 30)),
      });
      ambulanceMap[a.numberPlate] = created;
      console.log(`   ✅ ${a.numberPlate.padEnd(10)} ${a.type}`);
    }
  }

  /* ── 3. Checklist templates ───────────────────────────────────────────── */
  console.log('\n📋  Seeding checklist templates…');
  const templateMap = {};

  for (const t of TEMPLATES_DATA) {
    const existing = await ChecklistTemplate.findOne({ ambulanceType: t.ambulanceType, version: t.version });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      templateMap[t.ambulanceType] = existing;
      console.log(`   ↩  ${t.ambulanceType.padEnd(10)} v${t.version} (exists)`);
    } else {
      const created = await ChecklistTemplate.create({
        ...t,
        isActive: true,
        createdBy: adminUser._id,
      });
      templateMap[t.ambulanceType] = created;
      console.log(`   ✅ ${t.ambulanceType.padEnd(10)} v${t.version} — ${t.questions.length} questions`);
    }
  }

  /* ── 4. Trip audits ───────────────────────────────────────────────────── */
  console.log('\n🧾  Seeding trip audits…');

  const existingAuditCount = await TripAudit.countDocuments();
  if (existingAuditCount > 0 && !FRESH) {
    console.log(`   ↩  ${existingAuditCount} audits already exist — skipping (use --fresh to reseed)`);
  } else {
    const auditDefs = [
      // ── Fully compliant (SUBMITTED) ──────────────────────────────────────
      { plate: 'TN-19-BS-9990', emt: emtUsers[0], daysAgo: 1,  pass: true,  tripType: 'EMERGENCY' },
      { plate: 'TN-19-BS-9909', emt: emtUsers[1], daysAgo: 2,  pass: true,  tripType: 'TRANSFER' },
      { plate: 'TN-19-BZ-1980', emt: emtUsers[0], daysAgo: 3,  pass: true,  tripType: 'EMERGENCY' },
      { plate: 'TN-19-Y-0792', emt: emtUsers[2], daysAgo: 4,  pass: true,  tripType: 'TRANSFER' },
      { plate: 'TN-19-V-0567', emt: emtUsers[1], daysAgo: 5,  pass: true,  tripType: 'ROUTINE' },
      // ── Non-compliant (NEED_ACTION) ──────────────────────────────────────
      { plate: 'TN-19-BS-9990', emt: emtUsers[0], daysAgo: 6,  pass: false, tripType: 'EMERGENCY' },
      { plate: 'TN-19-U-1341', emt: emtUsers[2], daysAgo: 7,  pass: false, tripType: 'EMERGENCY' },
      { plate: 'TN-19-V-0567', emt: emtUsers[1], daysAgo: 9,  pass: false, tripType: 'TRANSFER' },
      // ── Historical SUBMITTED ─────────────────────────────────────────────
      { plate: 'TN-19-BS-9549', emt: emtUsers[0], daysAgo: 12, pass: true,  tripType: 'ROUTINE' },
      { plate: 'TN-19-BX-2772', emt: emtUsers[2], daysAgo: 14, pass: true,  tripType: 'EMERGENCY' },
      { plate: 'TN-19-BS-9909', emt: emtUsers[1], daysAgo: 16, pass: false, tripType: 'TRANSFER', markedClosed: true },
      { plate: 'TN-19-AY-0369', emt: emtUsers[0], daysAgo: 20, pass: true,  tripType: 'TRANSFER' },
      { plate: 'TN-09-AS-6660', emt: emtUsers[2], daysAgo: 25, pass: true,  tripType: 'ROUTINE' },
    ];

    const createdAudits = [];
    for (const def of auditDefs) {
      const ambulance = ambulanceMap[def.plate];
      const template  = templateMap[ambulance.type];
      const responses = buildResponses(template.questions, def.pass);
      const { complianceScore, nonComplianceCount, nonCompliantKeys } = calcCompliance(template.questions, responses);

      let status = nonComplianceCount > 0 ? 'NEED_ACTION' : 'SUBMITTED';
      if (def.markedClosed) status = 'CLOSED';

      const audit = await TripAudit.create({
        ambulanceNumberPlate: ambulance.numberPlate,
        ambulanceType:        ambulance.type,
        templateId:           template._id,
        templateVersion:      template.version,
        emtUserId:            def.emt._id,
        tripMeta: {
          patientId: `PT-${Math.floor(Math.random() * 90000 + 10000)}`,
          tripType:  def.tripType,
          from:      rnd(['Hospital A', 'Station HQ', 'Clinic North', 'Airport', 'Residence']),
          to:        rnd(['Hospital B', 'ICU Ward', 'Specialist Centre', 'Hospital A', 'Station HQ']),
        },
        responses,
        complianceScore,
        nonComplianceCount,
        status,
        submittedAt: daysAgo(def.daysAgo),
      });
      createdAudits.push({ audit, nonCompliantKeys, def, template });

      const icon = status === 'SUBMITTED' ? '✅' : status === 'CLOSED' ? '🔒' : '⚠️';
      console.log(`   ${icon} ${audit.ambulanceNumberPlate.padEnd(10)} ${status.padEnd(12)} ${complianceScore}% compliance — ${def.emt.name}`);
    }

    /* ── 5. Corrective actions ──────────────────────────────────────────── */
    console.log('\n⚠️   Seeding corrective actions…');
    for (const { audit, nonCompliantKeys, def, template } of createdAudits) {
      if (nonCompliantKeys.length === 0) continue;

      const qMap = Object.fromEntries(template.questions.map((q) => [q.key, q]));
      const issues = nonCompliantKeys.map((key) => ({
        key,
        issueText: `Non-compliant: ${qMap[key]?.label || key}`,
        status: def.markedClosed ? 'CLOSED' : 'OPEN',
        actionText: def.markedClosed ? 'Item checked and remediated by supervisor.' : '',
      }));

      const ca = await CorrectiveAction.create({
        tripAuditId: audit._id,
        issues,
        ...(def.markedClosed ? { closedBy: supervisor._id, closedAt: daysAgo(def.daysAgo - 2) } : {}),
      });

      const icon = def.markedClosed ? '🔒' : '⚠️';
      console.log(`   ${icon} ${audit.ambulanceNumberPlate.padEnd(10)} — ${issues.length} issue(s) ${def.markedClosed ? '(CLOSED)' : '(OPEN)'}`);
    }
  }

  /* ── 6. Print QR URLs ───────────────────────────────────────────────────── */
  console.log('\n🔗  QR URLs for active ambulances:');
  for (const amb of AMBULANCES.filter((a) => a.isActive !== false)) {
    const token = rawTokenMap[amb.numberPlate];
    if (token) {
      const url = `${CLIENT_URL}/audit/${amb.numberPlate}/fill?t=${token}`;
      console.log(`   ${amb.numberPlate.padEnd(10)} → ${url}`);
    }
  }

  /* ── 7. Summary ─────────────────────────────────────────────────────────── */
  const [uCount, aCount, tCount, auditCount, caCount] = await Promise.all([
    User.countDocuments(),
    Ambulance.countDocuments(),
    ChecklistTemplate.countDocuments(),
    TripAudit.countDocuments(),
    CorrectiveAction.countDocuments(),
  ]);

  console.log('\n' + '━'.repeat(50));
  console.log('📊  Database summary:');
  console.log(`   👤 Users            : ${uCount}`);
  console.log(`   🚑 Ambulances       : ${aCount}`);
  console.log(`   📋 Templates        : ${tCount}`);
  console.log(`   🧾 Trip Audits      : ${auditCount}`);
  console.log(`   ⚠️  Corrective Actions: ${caCount}`);
  console.log('━'.repeat(50));
  console.log('\n🎉  Seed complete!\n');
  console.log('📌  Login credentials:');
  console.log('   ADMIN        →  admin@ambuqr.com       / Admin@123');
  console.log('   SUPERVISOR   →  sup.ali@ambuqr.com     / Super@123');
  console.log('   SUPERVISOR   →  sup.nisa@ambuqr.com    / Super@123');
  console.log('   EMT          →  emt.karim@ambuqr.com   / Emt@1234');
  console.log('   EMT          →  emt.farid@ambuqr.com   / Emt@1234');
  console.log('   EMT          →  emt.layla@ambuqr.com   / Emt@1234');
  console.log('   ASSESSOR     →  assessor@ambuqr.com    / View@1234');
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
