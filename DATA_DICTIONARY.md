# C&I Fleet Health Intelligence — Data Dictionary

Every KPI displayed in the dashboard is documented here.
No values are hardcoded. Every metric traces to a live source or is explicitly marked DERIVED / UNAVAILABLE.

---

## Data Sources

### Fleet / Site Source
- **Provider**: Incorta Business View
- **Dashboard**: `ee817bdb-9b6a-4135-97d2-52ac36e23c63`
- **Insight ID**: Configured via `INCORTA_INSIGHT_ID` in server `.env`
- **Type**: Current-state snapshot (NOT time-series / historical)
- **Grain**: One row per site (may have duplicates — deduplication applied server-side)
- **Columns**: 24 columns, indexed 0–23

| Col | Index | Source Field | Notes |
|-----|-------|-------------|-------|
| site_id | 0 | Unique site identifier | Used as join key |
| site_name | 1 | Display name | |
| stage | 2 | Lifecycle stage: Ready / Final / Verifying | |
| status | 3 | Site status string | Known values: Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue |
| status_reason | 4 | Reason detail for status | |
| last_interval_end_date | 5 | Last data interval timestamp | Used as NRP proxy |
| micro_count | 6 | Number of microinverters | |
| inv_produced_load | 7 | Inverter produced load | |
| inv_param_table | 8 | Parameter table | |
| envoy_count | 9 | Number of envoys | |
| mi_product_sku | 10 | Microinverter SKU string | Used for IQ8/IQ9 classification |
| envoy_types | 11 | Envoy type(s) pipe-separated | |
| emu_sw_version | 12 | EMU software version | |
| connection_type | 13 | Wifi / Cellular / Ethernet | |
| installer_name | 14 | Installer company name | |
| state | 15 | US state or region | |
| country | 16 | Country | |
| site_created_at | 17 | Date site was created | NOT a severity timestamp |
| week_num | 18 | Week number | |
| severity | 19 | Severity level: 1/2/3/4 or null | null = no severity issue |
| meter_energy | 20 | Meter energy reading | |
| micro_energy | 21 | Micro energy reading | |
| energy_per_micro_per_day | 22 | Daily energy per micro | |
| days_producing | 23 | Days producing | |

### SFDC Case Source
- **Status**: UNAVAILABLE — Business View not yet configured
- **Configure**: Set `INCORTA_CASE_DASHBOARD_ID` and `INCORTA_CASE_INSIGHT_ID` in server `.env`
- **When configured**: Case Intelligence, Action Queue, Case Tracker, and Case Coverage KPIs will activate

---

## KPI Definitions

### Fleet Sites
- **Source**: Fleet Business View · col 0 (site_id)
- **Formula**: `COUNT DISTINCT site_id` after server-side deduplication
- **Status**: LIVE
- **Notes**: Raw row count may exceed distinct site count if duplicates exist. Distinct count is authoritative.

---

### Sev 1 / Sev 2 / Sev 3 / Sev 4 Count
- **Source**: Fleet Business View · col 19 (severity)
- **Formula**: `COUNT(distinct site_id) WHERE severity = N`
- **Status**: LIVE
- **Notes**: Sites with `severity = null` are excluded. Sev1 = most critical.

---

### Not Reporting (NRP)
- **Source**: Fleet Business View · col 3 (status)
- **Formula**: `COUNT(site_id) WHERE status IN ('Microinverters Not Reporting', 'Envoy Not Reporting')`
- **Definition**: Sites where the Envoy or microinverters have stopped reporting data
- **Status**: LIVE
- **Notes**: This is a proxy derived from `siteStatus`. The source does not contain a separate `reporting_status` field. If the business definition changes (e.g., time-based threshold from `last_interval_end_date`), update `server/services/dataTransformer.ts > deriveReportingStatus()`.

---

### Fleet Health Score (per site)
- **Source**: DERIVED — not present in Incorta source
- **Formula**:
  ```
  base = 100
  if severity == 1: base -= 40
  if severity == 2: base -= 25
  if severity == 3: base -= 10
  if severity == 4: base -= 5
  if status == 'Microinverters Not Reporting': base -= 20
  if status == 'Envoy Not Reporting': base -= 15
  if status == 'Production Issue': base -= 5
  return clamp(base, 0, 100)
  ```
- **Code**: `server/services/dataTransformer.ts > deriveHealthScore()`
- **Status**: DERIVED
- **Notes**: This is a heuristic approximation. The Incorta source does not provide a health score field. If Enphase provides an authoritative health score formula or field, replace this derivation.

---

### Fleet Health Score (fleet average)
- **Source**: DERIVED (per-site scores, then averaged)
- **Formula**: `AVG(healthScore) across all distinct sites`
- **Code**: `src/services/FleetAnalytics.ts > computeFleetKpis()`
- **Status**: DERIVED

---

### IQ8 Site Count
- **Source**: Fleet Business View · col 10 (mi_product_sku)
- **Formula**: `COUNT(site_id) WHERE sku STARTS WITH 'IQ8'` (case-insensitive)
- **Status**: LIVE
- **Notes**: Classification is based on SKU prefix only. SKUs not starting with IQ8 or IQ9 are unclassified.

---

### IQ9 Site Count
- **Source**: Fleet Business View · col 10 (mi_product_sku)
- **Formula**: `COUNT(site_id) WHERE sku STARTS WITH 'IQ9'` (case-insensitive)
- **Status**: LIVE

---

### Open Cases
- **Source**: SFDC Case Business View (not yet configured)
- **Formula**: `COUNT DISTINCT case_id WHERE status NOT IN ('Closed')`
- **Status**: UNAVAILABLE

---

### Case Coverage %
- **Source**: Fleet + SFDC Case join on site_id
- **Formula**: `COUNT(severity_sites with ≥1 SFDC case) / COUNT(severity_sites) × 100`
- **Status**: UNAVAILABLE (requires case source)
- **Notes**: Denominator = sites with severity 1–4 only. Sites with no severity are excluded.

---

### Sev1 + Sev2 Sites
- **Formula**: `COUNT(site_id) WHERE severity IN (1, 2)`
- **Label used**: "Sev1 + Sev2 Sites" — NOT "Critical Sites" unless the business definition is confirmed
- **Status**: LIVE

---

## Validation Rules

All rules are enforced in `server/services/dataTransformer.ts > validateConsistency()`:

| Rule | Formula |
|------|---------|
| Sev1 ≤ fleet | `sev1_count <= distinct_fleet` |
| NRP ≤ fleet | `nrp_count <= distinct_fleet` |
| Case coverage ≤ 100% | `case_coverage <= 1.0` |
| IQ8 + IQ9 = classified | `iq8_count + iq9_count == iq8_or_iq9_count` |

---

## Unavailable Metrics

The following metrics are NOT available from the current data sources and are explicitly displayed as unavailable:

| Metric | Reason | Required Source |
|--------|--------|----------------|
| Severity trend over time | Source is current-state snapshot only | Time-series Business View |
| Open case trend over time | Case source not configured | SFDC Case Business View |
| Fleet health trend over time | Health score is derived; no historical records | Time-series snapshot store |
| Predictive risk / forecast | No ML model connected | Prediction model API |
| Case Intelligence matrix (Open/Working/No Case) | Case source not configured | SFDC Case Business View |
| Case Coverage % | Case source not configured | SFDC Case Business View |
| Case aging | Case source not configured | SFDC Case Business View |

---

## Security

- `INCORTA_PAT` is stored in server `.env` only
- Never prefixed with `VITE_` — Vite bundles all `VITE_*` variables into the browser JS
- Never logged, never returned in API responses, never in Git history
- The React app calls only `/api/*` (our Express backend) — no direct Incorta calls from the browser

---

## Previously Observed Values (Validation Reference Only)

These values were observed in the prototype and must NOT be hardcoded.
If live API returns the same values, that is because the live source produces them — not because they were copied.

| Metric | Prototype Value |
|--------|---------------|
| Fleet Sites | 2153 |
| Fleet Health | 91.1 |
| Sev 1 | 146 |
| Sev 2 | 31 |
| Sev 3 | 107 |
| Sev 4 | 136 |
| NRP | 298 |
| Severity Sites | 420 |
| IQ8 | 401 |
| IQ9 | 19 |
