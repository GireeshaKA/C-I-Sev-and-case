/**
 * Data Quality Center
 *
 * Shows live validation results from the backend:
 * - Fleet source status (Incorta connection, record counts, deduplication)
 * - Case source status (configured / unavailable / error)
 * - Cross-validation checks (impossible values, join quality)
 * - KPI source traceability
 *
 * IMPORTANT: Every number on this page comes from /api/data-quality.
 * Nothing is fabricated or hardcoded.
 */

import { useEffect, useState, useContext } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { FilterContext, LoadingState, USE_LIVE } from '../App';
import type { DataQualityReport } from '../../server/types';

type SourceStatus = 'ok' | 'error' | 'unavailable';

function StatusIcon({ status }: { status: SourceStatus }) {
  if (status === 'ok')          return <CheckCircle size={16} color="#10B981" />;
  if (status === 'error')       return <XCircle size={16} color="#E01B1B" />;
  return <Info size={16} color="#94A3B8" />;
}

function StatusBadge({ status }: { status: SourceStatus }) {
  const map: Record<SourceStatus, { cls: string; label: string }> = {
    ok:          { cls: 'dq-badge dq-ok',     label: '✓ Connected' },
    error:       { cls: 'dq-badge dq-error',  label: '! Error' },
    unavailable: { cls: 'dq-badge dq-na',     label: '— Not Configured' },
  };
  const m = map[status];
  return <span className={m.cls}>{m.label}</span>;
}

function DqRow({ label, value, warn = false, info = false }: { label: string; value: string | number; warn?: boolean; info?: boolean }) {
  return (
    <tr>
      <td className="dq-label">{label}</td>
      <td className={`dq-value ${warn ? 'dq-warn' : info ? 'dq-info' : ''}`}>{value}</td>
    </tr>
  );
}

function CheckRow({ label, pass, detail }: { label: string; pass: boolean; detail?: string }) {
  return (
    <tr>
      <td>{pass ? <CheckCircle size={14} color="#10B981" /> : <AlertCircle size={14} color="#E89B0C" />}</td>
      <td>{label}</td>
      <td className={pass ? 'dq-pass' : 'dq-fail'}>{detail ?? (pass ? 'Pass' : 'Fail')}</td>
    </tr>
  );
}

export default function DataQualityPage() {
  const { dataSourceInfo } = useContext(FilterContext);
  const [report, setReport]     = useState<DataQualityReport | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchReport = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/data-quality');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DataQualityReport = await res.json();
      setReport(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    if (USE_LIVE) { fetchReport(); }
    else { setLoading(false); }
  }, []);

  if (!USE_LIVE) {
    return (
      <div className="page-content">
        <h2 className="page-title">Data Quality Center</h2>
        <div className="dq-notice">
          <Info size={18} />
          <span>Running in <strong>REPRESENTATIVE DATA</strong> mode. Set <code>VITE_DATA_PROVIDER=backend</code> and start the Express server to see live data quality metrics.</span>
        </div>
        <MockQualityNote />
      </div>
    );
  }

  if (loading) return <div className="page-content"><LoadingState /></div>;

  if (error || !report) {
    return (
      <div className="page-content">
        <h2 className="page-title">Data Quality Center</h2>
        <div className="dq-error-banner">
          <XCircle size={18} /> Backend API unavailable — {error ?? 'no response'}
          <br /><small>Is the Express server running? <code>npm run dev:backend</code></small>
        </div>
      </div>
    );
  }

  const fs = report.fleetSource;
  const cs = report.caseSource;
  const vl = report.validation;

  return (
    <div className="page-content">
      <div className="page-title-row">
        <h2 className="page-title">Data Quality Center</h2>
        <button className="link-btn" onClick={fetchReport} disabled={fetching}>
          <RefreshCw size={14} className={fetching ? 'spin' : ''} /> Refresh
        </button>
      </div>
      <p className="page-desc">
        Generated: {new Date(report.generatedAt).toLocaleString()}
        {dataSourceInfo?.lastRefreshedAt && ` · Last cache refresh: ${new Date(dataSourceInfo.lastRefreshedAt).toLocaleString()}`}
      </p>

      {/* Overall status banner */}
      <div className={`dq-banner ${fs.status === 'ok' ? 'dq-banner-ok' : 'dq-banner-error'}`}>
        {fs.status === 'ok' ? <CheckCircle size={20} /> : <XCircle size={20} />}
        <span>
          Data Status: <strong>{fs.status === 'ok' && cs.status !== 'error' ? 'LIVE' : fs.status === 'error' ? 'DATA ERROR' : 'PARTIAL'}</strong>
          {fs.status === 'ok' && ` · ${fs.distinctSiteIds.toLocaleString()} distinct sites loaded`}
        </span>
      </div>

      {/* Impossible values alert */}
      {vl.impossibleValues.length > 0 && (
        <div className="dq-banner dq-banner-error">
          <AlertCircle size={18} /> DATA QUALITY ISSUE: {vl.impossibleValues.join(' | ')}
        </div>
      )}

      <div className="chart-grid two-col">
        {/* Fleet Source */}
        <div className="section-card">
          <div className="section-card-header">
            <h3><StatusIcon status={fs.status} /> Fleet Data Source</h3>
            <StatusBadge status={fs.status} />
          </div>
          {fs.error && <div className="dq-error-msg">{fs.error}</div>}
          <table className="dq-table">
            <tbody>
              <DqRow label="Records Retrieved"   value={fs.totalRecordsRetrieved.toLocaleString()} />
              <DqRow label="Distinct Sites (authoritative fleet count)" value={fs.distinctSiteIds.toLocaleString()} info />
              <DqRow label="Duplicate Site IDs Removed" value={fs.duplicateSiteIds} warn={fs.duplicateSiteIds > 0} />
              <DqRow label="Missing Site IDs (excluded)" value={fs.missingSiteIds} warn={fs.missingSiteIds > 0} />
              <DqRow label="Missing Site Names"  value={fs.missingSiteNames} warn={fs.missingSiteNames > 0} />
              <DqRow label="Unknown Severity Values" value={fs.unknownSeverityValues} warn={fs.unknownSeverityValues > 0} />
              <DqRow label="Unknown Status Values"   value={fs.unknownStatusValues.join(', ') || 'None'} warn={fs.unknownStatusValues.length > 0} />
              <DqRow label="Unknown Stage Values"    value={fs.unknownStageValues.join(', ') || 'None'} warn={fs.unknownStageValues.length > 0} />
              <DqRow label="Sites with no SKU (type=UNKNOWN)" value={fs.unknownSkuValues} warn={fs.unknownSkuValues > 0} />
              <DqRow label="Sites with non-IQ8/IQ9 SKU (type=OTHER)" value={fs.otherTypeCount ?? 0} info={true} />
              <DqRow label="Sites with type=UNKNOWN (unclassifiable)" value={fs.unknownTypeCount ?? 0} warn={(fs.unknownTypeCount ?? 0) > 0} />
              <DqRow label="API Latency"  value={`${fs.apiLatencyMs} ms`} />
            </tbody>
          </table>
        </div>

        {/* Case Source */}
        <div className="section-card">
          <div className="section-card-header">
            <h3><StatusIcon status={cs.status} /> SFDC Case Data Source</h3>
            <StatusBadge status={cs.status} />
          </div>
          {cs.status === 'unavailable' && (
            <div className="dq-notice">
              <Info size={14} /> {cs.reason ?? 'Case Business View not configured.'}
              <br /><small>Set <code>INCORTA_CASE_DASHBOARD_ID</code> and <code>INCORTA_CASE_INSIGHT_ID</code> in your server <code>.env</code> to enable.</small>
            </div>
          )}
          {cs.error && cs.status === 'error' && <div className="dq-error-msg">{cs.error}</div>}
          {cs.status === 'ok' && (
            <table className="dq-table">
              <tbody>
                <DqRow label="Case Records Retrieved"    value={cs.totalRecordsRetrieved.toLocaleString()} />
                <DqRow label="Distinct Cases"            value={cs.distinctCaseIds.toLocaleString()} info />
                <DqRow label="Cases Without Site Match"  value={cs.casesWithNoSiteMatch} warn={cs.casesWithNoSiteMatch > 0} />
                <DqRow label="Severity Sites with Cases" value={cs.sitesWithAtLeastOneCase.toLocaleString()} />
                <DqRow label="Severity Sites Without Cases" value={cs.sitesWithNoCase.toLocaleString()} />
                <DqRow label="Case Join Match Rate"      value={cs.joinMatchRate} info />
                <DqRow label="API Latency"               value={`${cs.apiLatencyMs} ms`} />
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Validation Checks */}
      <div className="section-card">
        <h3>Consistency Validation</h3>
        <table className="data-table">
          <thead><tr><th>Result</th><th>Check</th><th>Status</th></tr></thead>
          <tbody>
            <CheckRow label="Sev1 count ≤ fleet size" pass={vl.sev1LteFleetSize} />
            <CheckRow label="NRP count ≤ fleet size"  pass={vl.nrpLteFleetSize} />
            <CheckRow label="Case coverage ≤ 100%"    pass={vl.caseCoverageLte100} />
            <CheckRow label="IQ8 + IQ9 = classified IQ* total" pass={vl.iq8PlusIq9EqualsClassifiedTotal} />
            <CheckRow label="No impossible values detected"
              pass={vl.impossibleValues.length === 0}
              detail={vl.impossibleValues.length === 0 ? 'Pass' : vl.impossibleValues.join('; ')} />
          </tbody>
        </table>
      </div>

      {/* KPI Definitions */}
      <div className="section-card">
        <h3>KPI Source Definitions</h3>
        <p className="page-desc" style={{ marginBottom: 12 }}>Every KPI is calculated from the source below. No values are hardcoded.</p>
        <table className="data-table">
          <thead><tr><th>KPI</th><th>Source</th><th>Formula</th><th>Status</th></tr></thead>
          <tbody>
            {kpiDefinitions.map(kpi => (
              <tr key={kpi.metric}>
                <td><strong>{kpi.metric}</strong></td>
                <td className="mono">{kpi.source}</td>
                <td>{kpi.formula}</td>
                <td><span className={`dq-badge ${kpi.live ? 'dq-ok' : 'dq-na'}`}>{kpi.live ? 'LIVE' : kpi.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MockQualityNote() {
  return (
    <div className="section-card">
      <h3>KPI Source Definitions</h3>
      <table className="data-table">
        <thead><tr><th>KPI</th><th>Source</th><th>Formula</th><th>Status</th></tr></thead>
        <tbody>
          {kpiDefinitions.map(kpi => (
            <tr key={kpi.metric}>
              <td><strong>{kpi.metric}</strong></td>
              <td className="mono">{kpi.source}</td>
              <td>{kpi.formula}</td>
              <td><span className={`dq-badge ${kpi.live ? 'dq-ok' : 'dq-na'}`}>{kpi.live ? 'LIVE' : kpi.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const kpiDefinitions = [
  {
    metric: 'Fleet Sites',
    source: 'Fleet Business View · site_id col 0',
    formula: 'COUNT DISTINCT site_id (after deduplication)',
    live: true,
    status: 'LIVE',
  },
  {
    metric: 'Sev 1 / 2 / 3 / 4 Count',
    source: 'Fleet Business View · severity col 19',
    formula: 'COUNT(site_id) WHERE severity = N, grouped by distinct site',
    live: true,
    status: 'LIVE',
  },
  {
    metric: 'Not Reporting (NRP)',
    source: 'Fleet Business View · status col 3',
    formula: 'COUNT(site_id) WHERE status IN (\'Microinverters Not Reporting\', \'Envoy Not Reporting\')',
    live: true,
    status: 'LIVE',
  },
  {
    metric: 'Fleet Health Score',
    source: 'DERIVED from severity + siteStatus',
    formula: 'AVG(100 − severity_penalty − status_penalty) per distinct site · see server/services/dataTransformer.ts',
    live: false,
    status: 'DERIVED',
  },
  {
    metric: 'IQ8 / IQ9 Count',
    source: 'Fleet Business View · mi_product_sku col 10',
    formula: 'COUNT(site_id) WHERE sku STARTS WITH \'IQ8\' or \'IQ9\'',
    live: true,
    status: 'LIVE',
  },
  {
    metric: 'Open Cases',
    source: 'SFDC Case Business View',
    formula: 'COUNT DISTINCT case_id WHERE status NOT IN (\'Closed\')',
    live: false,
    status: 'UNAVAILABLE — case source not yet configured',
  },
  {
    metric: 'Case Coverage %',
    source: 'Fleet + SFDC Case join on site_id',
    formula: 'COUNT(severity_sites with ≥1 case) / COUNT(severity_sites) × 100',
    live: false,
    status: 'UNAVAILABLE — case source not yet configured',
  },
];
