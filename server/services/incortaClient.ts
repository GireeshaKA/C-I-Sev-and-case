/**
 * Incorta API Client — server-side only.
 *
 * SECURITY: The PAT (INCORTA_PAT) is read from process.env and NEVER
 * exposed to the browser. It must not be prefixed with VITE_.
 *
 * This module is imported only by the Express server, never by the React app.
 */

// Accept both new server-only keys and old VITE_ keys (backward compat).
// VITE_ keys are deprecated: they get bundled into browser JS by Vite, exposing the PAT.
const BASE_URL = process.env.INCORTA_BASE_URL ?? process.env.VITE_INCORTA_BASE_URL ?? 'https://enphase-1.cloud2.incorta.com';
const TENANT   = process.env.INCORTA_TENANT ?? 'enphase';
const PAT      = process.env.INCORTA_PAT ?? process.env.VITE_INCORTA_PAT ?? '';

if (process.env.VITE_INCORTA_PAT && !process.env.INCORTA_PAT) {
  console.warn('[incortaClient] SECURITY WARNING: Using legacy VITE_INCORTA_PAT. Rename to INCORTA_PAT in your .env file — VITE_ variables are bundled into browser JS and expose the token.');
}
if (!PAT) {
  console.warn('[incortaClient] WARNING: INCORTA_PAT is not set — API calls will fail with 401.');
}

export type IncortaRow = unknown[];

export interface IncortaQueryOptions {
  dashboardId: string;
  insightId: string;
  pageSize?: number;
}

export interface IncortaQueryResult {
  rows: IncortaRow[];
  totalRows: number;
  columns: string[];
  latencyMs: number;
}

/**
 * Query an Incorta dashboard insight and return all rows (paginates automatically).
 * Throws on HTTP error or auth failure.
 */
export async function queryIncortaInsight(opts: IncortaQueryOptions): Promise<IncortaQueryResult> {
  const { dashboardId, insightId, pageSize = 10000 } = opts;
  const url = `${BASE_URL}/incorta/api/v2/${TENANT}/dashboards/${dashboardId}/insights/${insightId}/query`;

  if (!PAT) throw new Error('INCORTA_PAT environment variable is not configured on the server.');

  const t0 = Date.now();
  let startRow = 0;
  let allRows: IncortaRow[] = [];
  let columns: string[] = [];
  let totalRows = 0;

  while (true) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAT}`,
      },
      body: JSON.stringify({ pagination: { startRow, pageSize } }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 401) throw new Error('Incorta API: Unauthorized (401) — check INCORTA_PAT');
    if (res.status === 403) throw new Error('Incorta API: Forbidden (403) — insufficient permissions');
    if (res.status === 429) throw new Error('Incorta API: Rate limited (429) — retry later');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Incorta API: HTTP ${res.status} — ${body.slice(0, 200)}`);
    }

    let json: Record<string, unknown>;
    try {
      json = await res.json() as Record<string, unknown>;
    } catch {
      throw new Error('Incorta API: Invalid JSON response');
    }

    // Handle both `data` and `rows` response shapes
    const rows: IncortaRow[] = (json.data as IncortaRow[] | undefined) ??
                               (json.rows as IncortaRow[] | undefined) ?? [];

    if (columns.length === 0) {
      const cols = (json.columns as { name?: string; label?: string }[] | undefined) ?? [];
      columns = cols.map(c => c.name ?? c.label ?? '');
    }

    if (totalRows === 0) {
      totalRows = (json.totalRows as number | undefined) ??
                  (json.total as number | undefined) ?? rows.length;
    }

    allRows = allRows.concat(rows);

    // Stop if we got fewer rows than requested (last page) or exceeded total
    if (rows.length < pageSize || allRows.length >= totalRows) break;
    startRow += pageSize;
  }

  return {
    rows: allRows,
    totalRows: allRows.length,
    columns,
    latencyMs: Date.now() - t0,
  };
}

/**
 * Quick connectivity check — fetches 1 row only.
 * Returns latency in ms or throws.
 */
export async function pingIncorta(dashboardId: string, insightId: string): Promise<number> {
  const result = await queryIncortaInsight({ dashboardId, insightId, pageSize: 1 });
  return result.latencyMs;
}
