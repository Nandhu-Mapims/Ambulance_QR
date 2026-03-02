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
  { numberPlate: 'BLS-001', type: 'BLS',       station: 'HQ' },
  { numberPlate: 'BLS-002', type: 'BLS',       station: 'North' },
  { numberPlate: 'ALS-001', type: 'ALS',       station: 'HQ' },
  { numberPlate: 'ALS-002', type: 'ALS',       station: 'South' },
  { numberPlate: 'ICU-001', type: 'ICU',       station: 'HQ' },
  { numberPlate: 'NEO-001', type: 'NEONATAL',  station: 'HQ' },
  { numberPlate: 'TRN-001', type: 'TRANSPORT', station: 'North' },
  { numberPlate: 'TRN-002', type: 'TRANSPORT', station: 'South', isActive: false },
];

/* ── Checklist templates ──────────────────────────────────────────────────── */
const BLS_QUESTIONS = [
  { key: 'oxygen_cylinder',     label: 'Oxygen cylinder full and functional?',          type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 0 },
  { key: 'suction_device',      label: 'Suction device operational?',                    type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 1 },
  { key: 'aed_charged',         label: 'AED fully charged and pads attached?',           type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 2 },
  { key: 'first_aid_kit',       label: 'First aid kit stocked and sealed?',              type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 3 },
  { key: 'stretcher_condition', label: 'Stretcher condition',                             type: 'DROPDOWN', required: true,  options: ['Good', 'Fair', 'Needs Repair'], order: 4 },
  { key: 'mileage',             label: 'Current odometer reading (km)',                  type: 'NUMBER',   required: true,  order: 5 },
  { key: 'last_service_date',   label: 'Date of last service',                           type: 'DATE',     required: false, order: 6 },
  { key: 'radio_comms',         label: 'Radio communications functional?',               type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 7 },
  { key: 'vehicle_cleanliness', label: 'Vehicle interior cleaned and disinfected?',      type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 8 },
  { key: 'remarks',             label: 'Additional remarks',                             type: 'TEXT',     required: false, order: 9 },
];

const ALS_QUESTIONS = [
  { key: 'cardiac_monitor',     label: 'Cardiac monitor/defibrillator functional?',      type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 0 },
  { key: 'iv_supplies',         label: 'IV supplies adequate (lines, fluids, needles)?',  type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 1 },
  { key: 'drug_kit_sealed',     label: 'Drug kit sealed and inventory correct?',         type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 2 },
  { key: 'oxygen_cylinder',     label: 'Oxygen cylinder full and functional?',           type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 3 },
  { key: 'intubation_kit',      label: 'Intubation kit complete?',                       type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 4 },
  { key: 'ventilator_ok',       label: 'Transport ventilator checked?',                  type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 5 },
  { key: 'stretcher_condition', label: 'Stretcher/trolley condition',                    type: 'DROPDOWN', required: true,  options: ['Good', 'Fair', 'Needs Repair'], order: 6 },
  { key: 'drug_expiry_check',   label: 'Drug expiry dates checked?',                     type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 7 },
  { key: 'mileage',             label: 'Current odometer reading (km)',                  type: 'NUMBER',   required: true,  order: 8 },
  { key: 'remarks',             label: 'Additional remarks',                             type: 'TEXT',     required: false, order: 9 },
];

const ICU_QUESTIONS = [
  { key: 'ventilator_ok',       label: 'ICU ventilator fully functional?',               type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 0 },
  { key: 'infusion_pumps',      label: 'Infusion pumps charged and operational?',        type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 1 },
  { key: 'cardiac_monitor',     label: 'Cardiac monitor with capnography functional?',   type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 2 },
  { key: 'drug_kit_sealed',     label: 'ICU drug kit sealed and inventoried?',           type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 3 },
  { key: 'oxygen_supply',       label: 'Primary + backup oxygen adequate (>80%)?',       type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 4 },
  { key: 'suction_ok',          label: 'Suction system tested?',                         type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 5 },
  { key: 'temperature_control', label: 'Cabin temperature control working?',             type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 6 },
  { key: 'mileage',             label: 'Current odometer reading (km)',                  type: 'NUMBER',   required: true,  order: 7 },
  { key: 'remarks',             label: 'Additional remarks',                             type: 'TEXT',     required: false, order: 8 },
];

const NEONATAL_QUESTIONS = [
  { key: 'incubator_ok',        label: 'Transport incubator functional and pre-warmed?', type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 0 },
  { key: 'neonatal_ventilator', label: 'Neonatal ventilator operational?',               type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 1 },
  { key: 'pulse_oximetry',      label: 'Neonatal pulse oximetry functional?',            type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 2 },
  { key: 'neonatal_drug_kit',   label: 'Neonatal drug/resuscitation kit checked?',       type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 3 },
  { key: 'oxygen_supply',       label: 'Oxygen adequate (>80%)?',                        type: 'YESNO',    required: true,  requiresEvidenceIfNo: true,  order: 4 },
  { key: 'temperature',         label: 'Cabin temperature (°C)',                         type: 'NUMBER',   required: true,  order: 5 },
  { key: 'remarks',             label: 'Additional remarks',                             type: 'TEXT',     required: false, order: 6 },
];

const TRANSPORT_QUESTIONS = [
  { key: 'wheelchair_secured',  label: 'Wheelchair / stretcher securing belts OK?',      type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 0 },
  { key: 'first_aid_kit',       label: 'Basic first aid kit present?',                   type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 1 },
  { key: 'vehicle_cleanliness', label: 'Vehicle clean and sanitised?',                   type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 2 },
  { key: 'fuel_level',          label: 'Fuel level adequate (>50%)?',                    type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 3 },
  { key: 'communication',       label: 'Communication device functional?',               type: 'YESNO',    required: true,  requiresEvidenceIfNo: false, order: 4 },
  { key: 'mileage',             label: 'Current odometer reading (km)',                  type: 'NUMBER',   required: true,  order: 5 },
  { key: 'vehicle_condition',   label: 'Overall vehicle condition',                      type: 'DROPDOWN', required: true,  options: ['Good', 'Fair', 'Needs Repair'], order: 6 },
  { key: 'remarks',             label: 'Additional remarks',                             type: 'TEXT',     required: false, order: 7 },
];

const TEMPLATES_DATA = [
  { ambulanceType: 'BLS',       name: 'BLS Standard Checklist',       version: 1, questions: BLS_QUESTIONS },
  { ambulanceType: 'ALS',       name: 'ALS Advanced Checklist',        version: 1, questions: ALS_QUESTIONS },
  { ambulanceType: 'ICU',       name: 'ICU Mobile Critical Care',      version: 1, questions: ICU_QUESTIONS },
  { ambulanceType: 'NEONATAL',  name: 'Neonatal Transport Protocol',   version: 1, questions: NEONATAL_QUESTIONS },
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
      { plate: 'BLS-001', emt: emtUsers[0], daysAgo: 1,  pass: true,  tripType: 'EMERGENCY' },
      { plate: 'BLS-002', emt: emtUsers[1], daysAgo: 2,  pass: true,  tripType: 'TRANSFER' },
      { plate: 'ALS-001', emt: emtUsers[0], daysAgo: 3,  pass: true,  tripType: 'EMERGENCY' },
      { plate: 'ICU-001', emt: emtUsers[2], daysAgo: 4,  pass: true,  tripType: 'TRANSFER' },
      { plate: 'TRN-001', emt: emtUsers[1], daysAgo: 5,  pass: true,  tripType: 'ROUTINE' },
      // ── Non-compliant (NEED_ACTION) ──────────────────────────────────────
      { plate: 'BLS-001', emt: emtUsers[0], daysAgo: 6,  pass: false, tripType: 'EMERGENCY' },
      { plate: 'ALS-002', emt: emtUsers[2], daysAgo: 7,  pass: false, tripType: 'EMERGENCY' },
      { plate: 'NEO-001', emt: emtUsers[1], daysAgo: 9,  pass: false, tripType: 'TRANSFER' },
      // ── Historical SUBMITTED ─────────────────────────────────────────────
      { plate: 'BLS-001', emt: emtUsers[0], daysAgo: 12, pass: true,  tripType: 'ROUTINE' },
      { plate: 'ALS-001', emt: emtUsers[2], daysAgo: 14, pass: true,  tripType: 'EMERGENCY' },
      { plate: 'BLS-002', emt: emtUsers[1], daysAgo: 16, pass: false, tripType: 'TRANSFER', markedClosed: true },
      { plate: 'ICU-001', emt: emtUsers[0], daysAgo: 20, pass: true,  tripType: 'TRANSFER' },
      { plate: 'TRN-001', emt: emtUsers[2], daysAgo: 25, pass: true,  tripType: 'ROUTINE' },
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
  console.log('   ADMIN        →  admin@ambuqr.com      / Admin@123');
  console.log('   SUPERVISOR   →  sup.ali@ambuqr.com    / Super@123');
  console.log('   EMT          →  emt.karim@ambuqr.com  / Emt@1234');
  console.log('   ASSESSOR     →  assessor@ambuqr.com   / View@1234');
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
