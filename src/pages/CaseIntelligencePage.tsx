import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, EmptyState, SEV_COLORS, SEV_LABELS } from '../App';
import { healthColor, healthGrade } from '../services/FleetAnalytics';
import { exportToCsv } from '../utils/csvExport';

type CellDrill = { sev: 1 | 2 | 3 | 4; col: 'open' | 'inProgress' | 'noCase' } | null;

export default function CaseIntelligencePage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const [drill, setDrill] = useState<CellDrill>(null);

  const matrix = useMemo(() => {
    const caseMap = new Map<string, string>();
    cases.forEach(c => {
      const existing = caseMap.get(c.siteId);
      if (!existing || c.caseStatus === 'Case - In Progress') caseMap.set(c.siteId, c.caseStatus);
    });

    return ([1, 2, 3, 4] as const).map(sev => {
      const sevSites = sites.filter(s => s.severity === sev);
      const open = sevSites.filter(s => {
        const cs = caseMap.get(s.siteId);
        return cs && cs !== 'Case - In Progress';
      });
      const inProgress = sevSites.filter(s => caseMap.get(s.siteId) === 'Case - In Progress');
      const noCase = sevSites.filter(s => !caseMap.has(s.siteId));
      return { sev, total: sevSites.length, open, inProgress, noCase };
    });
  }, [sites, cases]);

  const drillSites = useMemo(() => {
    if (!drill) return [];
    const row = matrix.find(r => r.sev === drill.sev);
    if (!row) return [];
    return drill.col === 'open' ? row.open : drill.col === 'inProgress' ? row.inProgress : row.noCase;
  }, [drill, matrix]);

  const totalOpen = matrix.reduce((s, r) => s + r.open.length, 0);
  const totalInProgress = matrix.reduce((s, r) => s + r.inProgress.length, 0);
  const totalNoCase = matrix.reduce((s, r) => s + r.noCase.length, 0);

  const exportDrill = () => {
    if (!drillSites.length || !drill) return;
    exportToCsv(`Sev${drill.sev}_${drill.col}_sites.csv`, drillSites.map(s => ({
      SiteName: s.siteName, SiteID: s.siteId, Severity: s.severity,
      SKU: s.miProductSku, Status: s.siteStatus, Installer: s.installerName,
      HealthScore: s.healthScore, State: s.state,
    })));
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  return (
    <div className="page-content">
      <h2 className="page-title">Open Case Intelligence</h2>
      <p className="page-desc">Severity × Case Status matrix — click any cell to see corresponding sites.</p>

      <div className="kpi-row">
        <KpiCard label="Open (Not In Progress)" value={totalOpen} color="#E01B1B" subtitle="Needs attention" />
        <KpiCard label="In Progress" value={totalInProgress} color="#E89B0C" subtitle="Being worked" />
        <KpiCard label="No Case Created" value={totalNoCase} color="#94A3B8" subtitle="Gap — needs case" />
        <KpiCard label="Total w/ Severity" value={totalOpen + totalInProgress + totalNoCase} color="#2563EB" />
      </div>

      {/* Interactive Matrix */}
      <div className="section-card">
        <h3>Severity × Case Status Matrix</h3>
        <div className="table-scroll">
          <table className="data-table case-matrix">
            <thead>
              <tr>
                <th>Severity</th>
                <th style={{ color: '#E01B1B' }}>Open (Not In Progress)</th>
                <th style={{ color: '#E89B0C' }}>In Progress</th>
                <th style={{ color: '#94A3B8' }}>No Case</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(row => (
                <tr key={row.sev}>
                  <td><span className={`sev-badge sev-${row.sev}`}>Sev {row.sev} · {SEV_LABELS[row.sev]}</span></td>
                  <td className="matrix-cell clickable" onClick={() => setDrill({ sev: row.sev, col: 'open' })}
                    style={{ background: row.open.length > 0 ? '#FEE2E2' : undefined, fontWeight: row.open.length > 0 ? 700 : 400 }}>
                    {row.open.length}
                  </td>
                  <td className="matrix-cell clickable" onClick={() => setDrill({ sev: row.sev, col: 'inProgress' })}
                    style={{ background: row.inProgress.length > 0 ? '#FEF3C7' : undefined }}>
                    {row.inProgress.length}
                  </td>
                  <td className="matrix-cell clickable" onClick={() => setDrill({ sev: row.sev, col: 'noCase' })}
                    style={{ background: row.noCase.length > 0 ? '#F1F5F9' : undefined, fontWeight: row.noCase.length > 0 ? 700 : 400, color: row.noCase.length > 0 ? '#E01B1B' : undefined }}>
                    {row.noCase.length}
                  </td>
                  <td style={{ fontWeight: 700 }}>{row.total}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td>Total</td>
                <td>{totalOpen}</td>
                <td>{totalInProgress}</td>
                <td style={{ color: totalNoCase > 0 ? '#E01B1B' : undefined }}>{totalNoCase}</td>
                <td>{totalOpen + totalInProgress + totalNoCase}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-Down */}
      {drill && (
        <div className="section-card">
          <div className="section-card-header">
            <h3>
              <span className="sev-badge" style={{ background: SEV_COLORS[drill.sev] }}>Sev {drill.sev}</span>
              &nbsp;→ {drill.col === 'open' ? 'Open (Not In Progress)' : drill.col === 'inProgress' ? 'In Progress' : 'No Case Created'}
              &nbsp;({drillSites.length} sites)
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="link-btn" onClick={exportDrill}><Download size={14} /> Export CSV</button>
              <button className="link-btn" onClick={() => setDrill(null)}>✕ Close</button>
            </div>
          </div>
          {drillSites.length === 0 ? <EmptyState message="No sites" /> : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Site Name</th><th>Site ID</th><th>SKU</th><th>Status</th><th>Installer</th><th>Health</th><th>State</th></tr></thead>
                <tbody>
                  {drillSites.map(s => (
                    <tr key={s.siteId} className="clickable-row" onClick={() => navigate(`/site/${s.siteId}`)}>
                      <td>{s.siteName}</td>
                      <td className="mono">{s.siteId}</td>
                      <td className="sku-name">{s.miProductSku}</td>
                      <td>{s.siteStatus}</td>
                      <td>{s.installerName || '—'}</td>
                      <td><span className="health-mini" style={{ color: healthColor(s.healthScore) }}>{healthGrade(s.healthScore)} ({s.healthScore})</span></td>
                      <td>{s.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
