import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { FilterContext, KpiCard, LoadingState, EmptyState, SEV_COLORS, SEV_LABELS } from '../App';
import { healthColor, healthGrade } from '../services/FleetAnalytics';
import { getSkuFamily } from '../utils/skuFamily';
import { exportToCsv } from '../utils/csvExport';
import type { Site } from '../types';

type DrillDown = { family: 'IQ8' | 'IQ9'; sev: 1 | 2 | 3 | 4 } | null;

export default function SeverityPage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const [drill, setDrill] = useState<DrillDown>(null);
  const [sortKey, setSortKey] = useState<string>('severity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { iq8Sites, iq9Sites } = useMemo(() => {
    const iq8: Site[] = [], iq9: Site[] = [];
    sites.forEach(s => { const f = getSkuFamily(s.miProductSku); if (f === 'IQ8') iq8.push(s); else if (f === 'IQ9') iq9.push(s); });
    return { iq8Sites: iq8, iq9Sites: iq9 };
  }, [sites]);

  const makeChartData = (list: Site[]) =>
    ([1, 2, 3, 4] as const).map(sev => ({
      name: `Sev ${sev}`,
      value: list.filter(s => s.severity === sev).length,
      sev,
    }));

  const iq8Data = useMemo(() => makeChartData(iq8Sites), [iq8Sites]);
  const iq9Data = useMemo(() => makeChartData(iq9Sites), [iq9Sites]);

  const drillSites = useMemo(() => {
    if (!drill) return [];
    const pool = drill.family === 'IQ8' ? iq8Sites : iq9Sites;
    let result = pool.filter(s => s.severity === drill.sev);
    const caseLookup = new Map<string, number>();
    cases.forEach(c => caseLookup.set(c.siteId, (caseLookup.get(c.siteId) || 0) + 1));
    result = result.map(s => ({ ...s, _openCases: caseLookup.get(s.siteId) || 0 } as Site & { _openCases: number }));
    result.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortKey];
      const vb = (b as unknown as Record<string, unknown>)[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [drill, iq8Sites, iq9Sites, cases, sortKey, sortDir]);

  const toggleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const handleBarClick = (family: 'IQ8' | 'IQ9', sev: number) => {
    setDrill({ family, sev: sev as 1 | 2 | 3 | 4 });
  };

  const exportDrill = () => {
    if (!drillSites.length) return;
    exportToCsv(`${drill!.family}_Sev${drill!.sev}_sites.csv`, drillSites.map(s => ({
      SiteName: s.siteName, SiteID: s.siteId, Severity: s.severity,
      SKU: s.miProductSku, Status: s.siteStatus, Installer: s.installerName,
      HealthScore: s.healthScore, State: s.state,
    })));
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const total = sites.length;
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 1000) / 10}%` : '0%';
  const sevTotal = (list: Site[]) => list.filter(s => s.severity !== null).length;

  const SortTh = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <th className="sortable" onClick={() => toggleSort(k)}>
      {children} {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="page-content">
      <h2 className="page-title">Severity Analysis</h2>
      <p className="page-desc">IQ8 vs IQ9 severity distribution — click any bar to drill down into site details.</p>

      <div className="kpi-row">
        <KpiCard label="IQ8 Sites" value={iq8Sites.length} color="#2563EB" subtitle={`${sevTotal(iq8Sites)} with severity`} />
        <KpiCard label="IQ9 Sites" value={iq9Sites.length} color="#7C3AED" subtitle={`${sevTotal(iq9Sites)} with severity`} />
        {([1, 2, 3, 4] as const).map(level => (
          <KpiCard key={level} label={`Sev ${level} · ${SEV_LABELS[level]}`}
            value={sites.filter(s => s.severity === level).length}
            color={SEV_COLORS[level]} subtitle={pct(sites.filter(s => s.severity === level).length)} />
        ))}
      </div>

      <div className="chart-grid two-col">
        {/* IQ8 Severity Distribution */}
        <div className="section-card">
          <h3>IQ8 Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={iq8Data}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name="Sites" radius={[4, 4, 0, 0]}
                onClick={(d) => handleBarClick('IQ8', (d as unknown as { sev: number }).sev)} cursor="pointer">
                {iq8Data.map((d, i) => <Cell key={i} fill={SEV_COLORS[d.sev]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* IQ9 Severity Distribution */}
        <div className="section-card">
          <h3>IQ9 Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={iq9Data}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name="Sites" radius={[4, 4, 0, 0]}
                onClick={(d) => handleBarClick('IQ9', (d as unknown as { sev: number }).sev)} cursor="pointer">
                {iq9Data.map((d, i) => <Cell key={i} fill={SEV_COLORS[d.sev]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Pie View */}
      <div className="chart-grid two-col">
        <div className="section-card">
          <h3>IQ8 Severity Pie</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={iq8Data.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} innerRadius={50} paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
                onClick={(d) => handleBarClick('IQ8', (d as unknown as { sev: number }).sev)} cursor="pointer">
                {iq8Data.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={SEV_COLORS[d.sev]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="section-card">
          <h3>IQ9 Severity Pie</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={iq9Data.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} innerRadius={50} paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
                onClick={(d) => handleBarClick('IQ9', (d as unknown as { sev: number }).sev)} cursor="pointer">
                {iq9Data.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={SEV_COLORS[d.sev]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-Down Table */}
      {drill && (
        <div className="section-card" id="severity-drilldown">
          <div className="section-card-header">
            <h3>
              <span className="sev-badge" style={{ background: SEV_COLORS[drill.sev] }}>{drill.family} → Sev {drill.sev}</span>
              &nbsp;{drillSites.length} sites
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="link-btn" onClick={exportDrill}><Download size={14} /> Export CSV</button>
              <button className="link-btn" onClick={() => setDrill(null)}>✕ Close</button>
            </div>
          </div>
          {drillSites.length === 0 ? <EmptyState message="No sites in this category" /> : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortTh k="siteName">Site Name</SortTh>
                    <SortTh k="siteId">Site ID</SortTh>
                    <SortTh k="severity">Severity</SortTh>
                    <SortTh k="miProductSku">SKU</SortTh>
                    <th>Open Cases</th>
                    <th>Case Status</th>
                    <SortTh k="installerName">Installer</SortTh>
                    <SortTh k="lastIntervalEndDate">Last Seen</SortTh>
                    <SortTh k="healthScore">Health</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {drillSites.map(s => {
                    const siteCases = cases.filter(c => c.siteId === s.siteId);
                    const caseCount = siteCases.length;
                    const caseStatus = siteCases[0]?.caseStatus || (s.hasOpenCase ? 'Open' : 'No Case');
                    return (
                      <tr key={s.siteId} className="clickable-row" onClick={() => navigate(`/site/${s.siteId}`)}>
                        <td>{s.siteName}</td>
                        <td className="mono">{s.siteId}</td>
                        <td><span className={`sev-badge sev-${s.severity}`}>Sev {s.severity}</span></td>
                        <td className="sku-name">{s.miProductSku}</td>
                        <td>{caseCount}</td>
                        <td><span className={`status-badge ${caseStatus === 'No Case' as string ? 'status-error' : caseStatus.includes('Progress') ? 'status-issue' : 'status-normal'}`}>{caseStatus}</span></td>
                        <td>{s.installerName || '—'}</td>
                        <td>{s.lastIntervalEndDate || '—'}</td>
                        <td><span className="health-mini" style={{ color: healthColor(s.healthScore) }}>{healthGrade(s.healthScore)} ({s.healthScore})</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
