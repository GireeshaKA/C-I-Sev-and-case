/**
 * Column & Data Diagnostic Script
 *
 * Fetches a sample from the Incorta API and prints:
 *   1. Exact column names with zero-based indices (verifies our column map)
 *   2. Sample raw values for every column (first 3 rows)
 *   3. SKU distribution — distinct values + count (verifies IQ8/IQ9 classification)
 *   4. Severity distribution from the raw API (verifies severity column)
 *   5. Status distribution (verifies status column)
 *   6. Distinct site_id count vs. total row count (detects multi-row-per-site)
 *
 * Usage:
 *   node scripts/diagnose-columns.mjs
 *
 * Requires a populated .env file with INCORTA_PAT, INCORTA_DASHBOARD_ID, INCORTA_INSIGHT_ID
 */

import { readFileSync } from 'fs';

// ── Parse .env ────────────────────────────────────────────────────────────────
let env = {};
try {
  env = Object.fromEntries(
    readFileSync('.env', 'utf8')
      .replace(/^\uFEFF/, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()]; })
  );
} catch {
  console.error('ERROR: Could not read .env file. Create it from .env.example first.');
  process.exit(1);
}

// Accept both new server-only keys AND old VITE_ keys (backward compat)
const BASE    = env.INCORTA_BASE_URL      || env.VITE_INCORTA_BASE_URL    || 'https://enphase-1.cloud2.incorta.com';
const TENANT  = env.INCORTA_TENANT        || 'enphase';
const DASH    = env.INCORTA_DASHBOARD_ID  || env.VITE_INCORTA_DASHBOARD_ID;
const INSIGHT = env.INCORTA_INSIGHT_ID    || env.VITE_INCORTA_INSIGHT_ID;
const PAT     = env.INCORTA_PAT           || env.VITE_INCORTA_PAT;

if (env.VITE_INCORTA_PAT && !env.INCORTA_PAT) {
  console.warn('\nWARNING: Using legacy VITE_INCORTA_PAT. Rename to INCORTA_PAT in .env (PAT must not be a VITE_ variable — it would be bundled into browser JS).\n');
}
if (!PAT)     { console.error('ERROR: INCORTA_PAT (or VITE_INCORTA_PAT) is missing from .env'); process.exit(1); }
if (!DASH)    { console.error('ERROR: INCORTA_DASHBOARD_ID (or VITE_INCORTA_DASHBOARD_ID) is missing from .env'); process.exit(1); }
if (!INSIGHT) { console.error('ERROR: INCORTA_INSIGHT_ID (or VITE_INCORTA_INSIGHT_ID) is missing from .env'); process.exit(1); }

const url = `${BASE}/incorta/api/v2/${TENANT}/dashboards/${DASH}/insights/${INSIGHT}/query`;

console.log('\n=== INCORTA COLUMN & DATA DIAGNOSTIC ===');
console.log('URL:', url);
console.log('Token present:', `yes (${PAT.length} chars)`);

// ── Fetch a larger sample (500 rows) for distribution analysis ────────────────
async function fetchRows(pageSize = 500, startRow = 0) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAT}`,
    },
    body: JSON.stringify({ pagination: { startRow, pageSize } }),
    signal: AbortSignal.timeout(30_000),
  });

  if (res.status === 401) { console.error('ERROR: 401 Unauthorized — check INCORTA_PAT'); process.exit(1); }
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.error(`ERROR: HTTP ${res.status} — ${t.slice(0, 300)}`);
    process.exit(1);
  }

  return res.json();
}

try {
  const data = await fetchRows(500);

  // Detect row/data key
  const rows  = Array.isArray(data.data)   ? data.data
              : Array.isArray(data.rows)   ? data.rows
              : [];
  const colDefs = data.columns ?? data.headers ?? [];

  const totalReported = data.totalRows ?? data.total ?? data.pagination?.totalRows ?? '?';

  console.log(`\nTotal rows in insight (API-reported): ${totalReported}`);
  console.log(`Rows fetched in this batch:           ${rows.length}`);

  // ── 1. Column map ─────────────────────────────────────────────────────────
  console.log('\n=== COLUMN MAP (index → name) ===');
  if (colDefs.length > 0) {
    colDefs.forEach((c, i) => {
      const name = typeof c === 'string' ? c : (c.name ?? c.label ?? JSON.stringify(c));
      console.log(`  [${String(i).padStart(2, '0')}] ${name}`);
    });
  } else if (rows.length > 0) {
    console.log('  (No column metadata returned — inferring from first row length)');
    rows[0].forEach((_, i) => console.log(`  [${String(i).padStart(2, '0')}] (unknown)`));
  }

  if (rows.length === 0) {
    console.log('\nNo rows returned — cannot analyse data.');
    process.exit(0);
  }

  // ── 2. Sample raw rows ────────────────────────────────────────────────────
  console.log('\n=== FIRST 3 RAW ROWS ===');
  rows.slice(0, 3).forEach((row, ri) => {
    console.log(`\n  Row ${ri}:`);
    row.forEach((val, ci) => {
      const colName = colDefs[ci]
        ? (typeof colDefs[ci] === 'string' ? colDefs[ci] : (colDefs[ci].name ?? colDefs[ci].label ?? `col${ci}`))
        : `col${ci}`;
      console.log(`    [${String(ci).padStart(2, '0')}] ${colName} = ${JSON.stringify(val)}`);
    });
  });

  // ── 3. Key columns: site_id (0), status (3), severity (19), sku (10) ─────
  const COL_SITE_ID  = 0;
  const COL_STATUS   = 3;
  const COL_SKU      = 10;
  const COL_SEVERITY = 19;

  // ── 4. Multi-row-per-site detection ──────────────────────────────────────
  const allSiteIds = rows.map(r => String(r[COL_SITE_ID] ?? ''));
  const distinctIds = new Set(allSiteIds.filter(Boolean));
  const missing = allSiteIds.filter(id => !id).length;

  console.log('\n=== SITE ID ANALYSIS (col 0) ===');
  console.log(`  Total rows fetched:     ${rows.length}`);
  console.log(`  Distinct site_ids:      ${distinctIds.size}`);
  console.log(`  Rows with empty id:     ${missing}`);
  console.log(`  Multi-row sites?:       ${rows.length !== distinctIds.size ? 'YES — insight returns multiple rows per site' : 'No'}`);
  if (rows.length !== distinctIds.size) {
    // Show how many rows a given site has
    const freq = {};
    allSiteIds.forEach(id => { if (id) freq[id] = (freq[id] || 0) + 1; });
    const dupes = Object.entries(freq).filter(([, c]) => c > 1).slice(0, 5);
    console.log('  Examples of multi-row sites:');
    dupes.forEach(([id, c]) => console.log(`    siteId=${id} appears ${c} times`));
  }

  // ── 5. SKU distribution ───────────────────────────────────────────────────
  console.log('\n=== SKU DISTRIBUTION (col 10) ===');
  const skuMap = {};
  const iq8Sites = new Set();
  const iq9Sites = new Set();
  rows.forEach(r => {
    const sku    = String(r[COL_SKU] ?? '').trim();
    const siteId = String(r[COL_SITE_ID] ?? '');
    skuMap[sku]  = (skuMap[sku] || 0) + 1;
    const skuUp  = sku.toUpperCase();
    if (skuUp.startsWith('IQ8')) iq8Sites.add(siteId);
    if (skuUp.startsWith('IQ9')) iq9Sites.add(siteId);
  });

  const skuEntries = Object.entries(skuMap).sort((a, b) => b[1] - a[1]);
  console.log(`  Distinct SKU values: ${skuEntries.length}`);
  console.log('  Top SKUs by row count:');
  skuEntries.slice(0, 20).forEach(([sku, cnt]) => {
    const flag = sku.toUpperCase().startsWith('IQ8') ? '← IQ8'
               : sku.toUpperCase().startsWith('IQ9') ? '← IQ9'
               : '';
    console.log(`    "${sku}" = ${cnt} rows  ${flag}`);
  });

  console.log(`\n  Sites where ANY row has IQ8 SKU: ${iq8Sites.size}`);
  console.log(`  Sites where ANY row has IQ9 SKU: ${iq9Sites.size}`);
  const overlap = [...iq8Sites].filter(id => iq9Sites.has(id));
  console.log(`  Sites with BOTH IQ8 and IQ9 rows: ${overlap.length}`);

  // Show what col 10 actually IS if col names are available
  if (colDefs.length > 10) {
    const name10 = typeof colDefs[10] === 'string' ? colDefs[10] : (colDefs[10]?.name ?? colDefs[10]?.label ?? '?');
    console.log(`\n  NOTE: col 10 is named "${name10}" in the API response`);
  }

  // ── 6. Severity distribution ──────────────────────────────────────────────
  console.log('\n=== SEVERITY DISTRIBUTION (col 19) ===');
  const sevMap = {};
  rows.forEach(r => {
    const sev = String(r[COL_SEVERITY] ?? '(null)').trim() || '(empty)';
    sevMap[sev] = (sevMap[sev] || 0) + 1;
  });
  Object.entries(sevMap).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([sev, cnt]) => {
    console.log(`    "${sev}" = ${cnt} rows`);
  });

  if (colDefs.length > 19) {
    const name19 = typeof colDefs[19] === 'string' ? colDefs[19] : (colDefs[19]?.name ?? colDefs[19]?.label ?? '?');
    console.log(`  NOTE: col 19 is named "${name19}" in the API response`);
  }

  // ── 7. Status distribution ────────────────────────────────────────────────
  console.log('\n=== STATUS DISTRIBUTION (col 3) ===');
  const stMap = {};
  rows.forEach(r => {
    const st = String(r[COL_STATUS] ?? '(null)').trim() || '(empty)';
    stMap[st] = (stMap[st] || 0) + 1;
  });
  Object.entries(stMap).sort((a, b) => b[1] - a[1]).forEach(([st, cnt]) => {
    console.log(`    "${st}" = ${cnt} rows`);
  });

  if (colDefs.length > 3) {
    const name3 = typeof colDefs[3] === 'string' ? colDefs[3] : (colDefs[3]?.name ?? colDefs[3]?.label ?? '?');
    console.log(`  NOTE: col 3 is named "${name3}" in the API response`);
  }

  console.log('\n=== DONE ===');
  console.log('Action items:');
  console.log('  1. Verify the COLUMN MAP above matches server/services/dataTransformer.ts FC constants.');
  console.log('  2. If col 19 is NOT severity, update FC.SEVERITY in dataTransformer.ts.');
  console.log('  3. If col 10 is NOT mi_product_sku, update FC.MI_SKU in dataTransformer.ts.');
  console.log('  4. If multi-row sites exist, the SKU deduplication strategy may need updating.');

} catch (err) {
  console.error('\nFetch error:', err.message);
  process.exit(1);
}
