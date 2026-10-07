/**
 * Quick test script — calls Incorta API and prints response shape.
 * Usage: node scripts/test-incorta-api.mjs
 */
import { readFileSync } from 'fs';

// Read .env manually (no dotenv dependency)
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

// Server-side env vars — these must NOT have the VITE_ prefix.
// VITE_ variables are bundled into the browser JS bundle by Vite.
// The PAT must remain server-side only.
const BASE    = env.INCORTA_BASE_URL   || 'https://enphase-1.cloud2.incorta.com';
const TENANT  = env.INCORTA_TENANT    || 'enphase';
const DASH    = env.INCORTA_DASHBOARD_ID;
const INSIGHT = env.INCORTA_INSIGHT_ID;
const PAT     = env.INCORTA_PAT;

const url = `${BASE}/incorta/api/v2/${TENANT}/dashboards/${DASH}/insights/${INSIGHT}/query`;

console.log('Calling:', url);
console.log('Token present:', PAT ? `yes (${PAT.length} chars)` : 'NO');

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAT}`,
    },
    body: JSON.stringify({
      pagination: { startRow: 0, pageSize: 5 },
    }),
  });

  console.log('Status:', res.status, res.statusText);

  if (!res.ok) {
    const text = await res.text();
    console.log('Error body:', text.slice(0, 500));
    process.exit(1);
  }

  const data = await res.json();

  // Print top-level keys
  console.log('\n=== TOP-LEVEL KEYS ===');
  console.log(Object.keys(data));

  // If it has columns/headers
  if (data.columns) {
    console.log('\n=== COLUMNS ===');
    console.log(JSON.stringify(data.columns, null, 2));
  }
  if (data.headers) {
    console.log('\n=== HEADERS ===');
    console.log(JSON.stringify(data.headers, null, 2));
  }

  // If it has rows/data
  if (data.rows) {
    console.log('\n=== FIRST 2 ROWS ===');
    console.log(JSON.stringify(data.rows.slice(0, 2), null, 2));
    console.log(`\nTotal rows returned: ${data.rows.length}`);
  }
  if (data.data) {
    console.log('\n=== FIRST 2 DATA ITEMS ===');
    const items = Array.isArray(data.data) ? data.data : [data.data];
    console.log(JSON.stringify(items.slice(0, 2), null, 2));
    console.log(`\nTotal data items: ${items.length}`);
  }

  // Print pagination info if present
  if (data.pagination || data.totalRows || data.total) {
    console.log('\n=== PAGINATION ===');
    console.log(JSON.stringify({ pagination: data.pagination, totalRows: data.totalRows, total: data.total }));
  }

  // Fallback: print full structure (truncated)
  const full = JSON.stringify(data, null, 2);
  if (full.length < 3000) {
    console.log('\n=== FULL RESPONSE ===');
    console.log(full);
  } else {
    console.log('\n=== FULL RESPONSE (first 3000 chars) ===');
    console.log(full.slice(0, 3000));
    console.log(`... (${full.length} total chars)`);
  }
} catch (err) {
  console.error('Fetch error:', err.message);
}
