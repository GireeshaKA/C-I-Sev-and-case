import { useContext, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, Download } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, EmptyState } from '../App';
import { computeInstallerMetrics, healthColor } from '../services/FleetAnalytics';
import { exportToCsv } from '../utils/csvExport';

export default function InstallerPage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const [search, setSearch] = useState('');
  const [minSites, setMinSites] = useState(3);

  const allMetrics = useMemo(() => {
    const metrics = computeInstallerMetrics(sites);
    const caseLookup = new Map<string, { count: number; totalAge: number }>();
    cases.forEach(c => {
      const key = c.installerName || 'Unknown';
      const e = caseLookup.get(key) || { count: 0, totalAge: 0 };
      e.count++; e.totalAge += c.caseAge;
      caseLookup.set(key, e);
    });
    return metrics.map(m => {
      const cl = caseLookup.get(m.name);
      return { ...m, openCases: cl?.count || 0, avgResolutionTime: cl ? Math.round(cl.totalAge / cl.count) : 0 };
    });
  }, [sites, cases]);

  const filtered = useMemo(() => {
    let result = allMetrics.filter(i => i.siteCount >= minSites);
    if (search) {
      const t = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(t));
    }
    return result;
  }, [allMetrics, minSites, search]);

  const topRisk = useMemo(() => [...filtered].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10), [filtered]);
  const topHealth = useMemo(() => [...filtered].sort((a, b) => b.avgHealthScore - a.avgHealthScore).slice(0, 10), [filtered]);

  const exportTable = () => {
    if (!filtered.length) return;
    exportToCsv('installer_performance.csv', filtered.map(i => ({
      Installer: i.name, Sites: i.siteCount, HealthScore: i.avgHealthScore,
      RiskScore: i.riskScore, Sev1: i.sevDistribution['1'] || 0, Sev2: i.sevDistribution['2'] || 0,
      OpenCases: i.openCases, AvgResolutionDays: i.avgResolutionTime,
      CriticalPct: i.criticalPct, NormalPct: i.normalPct,
    })));
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  return (
    <div className="page-content">
      <h2 className="page-title">Installer Performance</h2>
      <p className="page-desc">Analyze installer portfolios by health score, risk exposure, and fleet size.</p>

      <div className="kpi-row">
        <KpiCard label="Total Installers" value={allMetrics.length} subtitle="Across fleet" color="#2563EB" />
        <KpiCard label={`≥${minSites} Sites`} value={filtered.length} subtitle="Filtered installers" color="#7C3AED" />
        <KpiCard label="Highest Risk" value={topRisk[0]?.name || 'N/A'} subtitle={`Risk score: ${topRisk[0]?.riskScore || 0}`} color="#E01B1B" />
        <KpiCard label="Best Performer" value={topHealth[0]?.name || 'N/A'} subtitle={`Health: ${topHealth[0]?.avgHealthScore || 0}`} color="#10B981" />
      </div>

      <div className="installer-controls">
        <div className="table-search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="table-search" placeholder="Search installers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label className="min-sites-label">
          Min sites: <input type="number" min={1} max={50} value={minSites} onChange={e => setMinSites(Number(e.target.value))} className="min-sites-input" />
        </label>
        <button className="link-btn" onClick={exportTable}><Download size={14} /> Export CSV</button>
      </div>

      <div className="chart-grid two-col">
        <div className="section-card">
          <h3>Top 10 Highest Risk Installers</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topRisk} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}`, 'Risk Score']} />
              <Bar dataKey="riskScore" radius={[0, 4, 4, 0]}>
                {topRisk.map((d, i) => <Cell key={i} fill={healthColor(100 - d.riskScore)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Top 10 Best Installers</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topHealth} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}`, 'Health Score']} />
              <Bar dataKey="avgHealthScore" radius={[0, 4, 4, 0]}>
                {topHealth.map((d, i) => <Cell key={i} fill={healthColor(d.avgHealthScore)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Table */}
      <div className="section-card">
        <h3>All Installers ({filtered.length})</h3>
        {filtered.length === 0 ? <EmptyState message="No installers match criteria" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Installer</th><th>Total Sites</th><th>Sev 1</th><th>Sev 2</th>
                  <th>Open Cases</th><th>Avg Resolution</th>
                  <th>Fleet Health</th><th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inst => (
                  <tr key={inst.name}>
                    <td className="installer-name">{inst.name}</td>
                    <td>{inst.siteCount}</td>
                    <td style={{ color: (inst.sevDistribution['1'] || 0) > 0 ? '#E01B1B' : '#64748B', fontWeight: (inst.sevDistribution['1'] || 0) > 0 ? 700 : 400 }}>{inst.sevDistribution['1'] || 0}</td>
                    <td style={{ color: (inst.sevDistribution['2'] || 0) > 0 ? '#F37421' : '#64748B', fontWeight: (inst.sevDistribution['2'] || 0) > 0 ? 700 : 400 }}>{inst.sevDistribution['2'] || 0}</td>
                    <td>{inst.openCases}</td>
                    <td>{inst.avgResolutionTime > 0 ? `${inst.avgResolutionTime}d` : '—'}</td>
                    <td><span className="health-mini" style={{ color: healthColor(inst.avgHealthScore) }}>{inst.avgHealthScore}</span></td>
                    <td><span className="health-mini" style={{ color: healthColor(100 - inst.riskScore) }}>{inst.riskScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
