import { useContext, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FilterContext, KpiCard, LoadingState, EmptyState } from '../App';
import { computeGeoMetrics, healthColor } from '../services/FleetAnalytics';

export default function GeoPage() {
  const { sites, loading } = useContext(FilterContext);
  const [topN, setTopN] = useState(15);
  const geoMetrics = useMemo(() => computeGeoMetrics(sites), [sites]);
  const topStates = useMemo(() => geoMetrics.slice(0, topN), [geoMetrics, topN]);
  const countries = useMemo(() => {
    const c: Record<string, number> = {};
    sites.forEach(s => { c[s.country || 'Unknown'] = (c[s.country || 'Unknown'] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [sites]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const worstState = geoMetrics.filter(g => g.siteCount >= 5).sort((a, b) => a.avgHealthScore - b.avgHealthScore)[0];

  return (
    <div className="page-content">
      <h2 className="page-title">Geographic View</h2>
      <p className="page-desc">Regional fleet distribution and health analysis by state and country.</p>

      <div className="kpi-row">
        <KpiCard label="States/Regions" value={geoMetrics.length} color="#2563EB" subtitle="Active regions" />
        <KpiCard label="Countries" value={countries.length} color="#7C3AED" subtitle="Fleet span" />
        <KpiCard label="Top State" value={geoMetrics[0]?.state || 'N/A'} color="#16A34A" subtitle={`${geoMetrics[0]?.siteCount || 0} sites`} />
        <KpiCard label="Riskiest Region" value={worstState?.state || 'N/A'} color="#DC2626" subtitle={`Health: ${worstState?.avgHealthScore || 0}`} />
      </div>

      <div className="chart-grid two-col">
        <div className="section-card">
          <div className="section-card-header">
            <h3>Sites by State (Top {topN})</h3>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))} className="compact-select">
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={25}>Top 25</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(280, topStates.length * 28)}>
            <BarChart data={topStates} layout="vertical" margin={{ left: 5 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="state" width={50} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="siteCount" name="Sites" radius={[0, 4, 4, 0]}>
                {topStates.map((d, i) => <Cell key={i} fill={healthColor(d.avgHealthScore)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Sites by Country</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={countries}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Sites" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-card">
        <h3>Regional Health Table</h3>
        {geoMetrics.length === 0 ? <EmptyState /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>State</th><th>Sites</th><th>Health Score</th><th>Critical Sites</th></tr></thead>
              <tbody>
                {geoMetrics.map(g => (
                  <tr key={g.state}>
                    <td>{g.state}</td>
                    <td>{g.siteCount}</td>
                    <td><span className="health-mini" style={{ color: healthColor(g.avgHealthScore) }}>{g.avgHealthScore}</span></td>
                    <td style={{ color: g.criticalCount > 0 ? '#DC2626' : '#64748B' }}>{g.criticalCount}</td>
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
