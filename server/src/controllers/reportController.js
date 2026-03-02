const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const TripAudit = require('../models/TripAudit');
const logger = require('../utils/logger');

/** Build Mongoose filter from query params */
const buildFilter = (query) => {
  const filter = {};
  if (query.numberPlate) filter.ambulanceNumberPlate = query.numberPlate.toUpperCase();
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.submittedAt = {};
    if (query.from) filter.submittedAt.$gte = new Date(query.from);
    if (query.to) filter.submittedAt.$lte = new Date(query.to);
  }
  return filter;
};

const buildCqiData = async (filter) => {
  const audits = await TripAudit.find(filter)
    .populate('emtUserId', 'name')
    .sort('-submittedAt')
    .lean();

  // Per-ambulance summary
  const summaryMap = {};
  for (const a of audits) {
    const key = a.ambulanceNumberPlate;
    if (!summaryMap[key]) {
      summaryMap[key] = {
        numberPlate: key,
        type: a.ambulanceType,
        totalAudits: 0,
        totalScore: 0,
        needAction: 0,
        closed: 0,
      };
    }
    const s = summaryMap[key];
    s.totalAudits++;
    s.totalScore += a.complianceScore;
    if (a.status === 'NEED_ACTION') s.needAction++;
    if (a.status === 'CLOSED') s.closed++;
  }

  const summary = Object.values(summaryMap).map((s) => ({
    ...s,
    avgScore: s.totalAudits > 0 ? Math.round(s.totalScore / s.totalAudits) : 0,
  }));

  return { audits, summary };
};

const getCqiReport = async (req, res) => {
  const filter = buildFilter(req.query);
  const { audits, summary } = await buildCqiData(filter);
  res.json({ success: true, summary, audits });
};

const getCqiExcel = async (req, res) => {
  const filter = buildFilter(req.query);
  const { audits, summary } = await buildCqiData(filter);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ambulance QR System';
  wb.created = new Date();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Summary');
  s1.columns = [
    { header: 'Number Plate', key: 'numberPlate', width: 16 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Total Audits', key: 'totalAudits', width: 14 },
    { header: 'Avg Compliance %', key: 'avgScore', width: 18 },
    { header: 'Need Action', key: 'needAction', width: 14 },
    { header: 'Closed', key: 'closed', width: 12 },
  ];
  s1.getRow(1).font = { bold: true };
  s1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9232D' } };
  s1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summary.forEach((row) => s1.addRow(row));

  // ── Sheet 2: All Audits ───────────────────────────────────────────────────
  const s2 = wb.addWorksheet('All Audits');
  s2.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Number Plate', key: 'plate', width: 16 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'EMT', key: 'emt', width: 20 },
    { header: 'Compliance %', key: 'score', width: 14 },
    { header: 'Non-Compliance', key: 'nc', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Trip Type', key: 'tripType', width: 14 },
  ];
  s2.getRow(1).font = { bold: true };
  s2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF222222' } };
  s2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  audits.forEach((a) => {
    const row = s2.addRow({
      date: a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '',
      plate: a.ambulanceNumberPlate,
      type: a.ambulanceType,
      emt: a.emtUserId?.name || '—',
      score: a.complianceScore,
      nc: a.nonComplianceCount,
      status: a.status,
      tripType: a.tripMeta?.tripType || '—',
    });
    if (a.status === 'NEED_ACTION') {
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC107' },
      };
    }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="cqi-report.xlsx"');
  await wb.xlsx.write(res);
  res.end();
};

const buildReportHtml = (summary, audits, query) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 32px; color: #1a1a1a; font-size: 13px; }
  h1 { color: #c0392b; border-bottom: 3px solid #c0392b; padding-bottom: 8px; }
  h2 { color: #333; margin-top: 28px; font-size: 15px; }
  .meta { color: #555; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { background: #c0392b; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .badge-need { background: #ffc107; color: #333; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  .badge-closed { background: #28a745; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  .badge-submitted { background: #17a2b8; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; }
</style>
</head>
<body>
<h1>🚑 CQI Report — Ambulance Audit System</h1>
<p class="meta">Generated: ${new Date().toLocaleString()} ${query.from ? `| From: ${query.from}` : ''} ${query.to ? `To: ${query.to}` : ''} ${query.numberPlate ? `| Plate: ${query.numberPlate}` : ''}</p>

<h2>Fleet Summary</h2>
<table>
  <thead><tr><th>Number Plate</th><th>Type</th><th>Audits</th><th>Avg Compliance %</th><th>Need Action</th><th>Closed</th></tr></thead>
  <tbody>
    ${summary.map((s) => `<tr>
      <td><strong>${s.numberPlate}</strong></td>
      <td>${s.type}</td>
      <td>${s.totalAudits}</td>
      <td>${s.avgScore}%</td>
      <td>${s.needAction}</td>
      <td>${s.closed}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Audit Detail (${audits.length} records)</h2>
<table>
  <thead><tr><th>Date</th><th>Plate</th><th>EMT</th><th>Compliance</th><th>NC</th><th>Status</th></tr></thead>
  <tbody>
    ${audits.slice(0, 200).map((a) => `<tr>
      <td>${a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</td>
      <td>${a.ambulanceNumberPlate}</td>
      <td>${a.emtUserId?.name || '—'}</td>
      <td>${a.complianceScore}%</td>
      <td>${a.nonComplianceCount}</td>
      <td><span class="badge-${a.status === 'NEED_ACTION' ? 'need' : a.status === 'CLOSED' ? 'closed' : 'submitted'}">${a.status}</span></td>
    </tr>`).join('')}
  </tbody>
</table>

<footer>Ambulance QR Audit System — Confidential</footer>
</body>
</html>`;

const getCqiPdf = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const { audits, summary } = await buildCqiData(filter);
    const html = buildReportHtml(summary, audits, req.query);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cqi-report.pdf"');
    res.send(pdf);
  } catch (error) {
    logger.error({ err: error }, 'PDF generation failed');
    next(error);
  }
};

module.exports = { getCqiReport, getCqiExcel, getCqiPdf };
