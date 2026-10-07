import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Shield, Activity, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { FilterContext, KpiCard, LoadingState, SEV_COLORS, STATUS_COLORS } from '../App';
import {
  computeFleetKpis, computeRiskDistribution, computeInstallerMetrics,
  computeSkuMetrics, computeTypeMetrics, healthColor,
} from '../services/FleetAnalytics';

function ragColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#E89B0C';
  return '#E01B1B';
}

function ragLabel(score: number): string {
  if (score >= 75) return 'Healthy';
  if (score >= 50) return 'Attention Required';
  return 'Critical';
}

export default function ExecutivePage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const kpis = useMemo(() => computeFleetKpis(sites), [sites]);
  const riskDist = useMemo(() => computeRiskDistribution(sites), [sites]);
  const topInstallers = useMemo(() => computeInstallerMetrics(sites).filter(i => i.siteCount >= 3).slice(0, 5), [sites]);
  const skuMetrics = useMemo(() => computeSkuMetrics(sites), [sites]);

  const casesOver30 = useMemo(() => cases.filter(c => c.caseAge > 30).length, [cases]);
  const sitesWithoutCases = useMemo(() => {
    const caseIds = new Set(cases.map(c => c.siteId));
    return sites.filter(s => s.severity !== null && !caseIds.has(s.siteId)).length;
  }, [sites, cases]);
  const typeMetrics = useMemo(() => computeTypeMetrics(sites), [sites]);
  const casesBySiteId = useMemo(() => {
    const m = new Map<string, number>();
    cases.forEach(c => m.set(c.siteId, (m.get(c.siteId) || 0) + 1));
    return m;
  }, [cases]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const sevPie = Object.entries(kpis.sevDistribution).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));
  const sevPieColors = sevPie.map(d => {
    if (d.name.includes('1')) return SEV_COLORS[1];
    if (d.name.includes('2')) return SEV_COLORS[2];
    if (d.name.includes('3')) return SEV_COLORS[3];
    if (d.name.includes('4')) return SEV_COLORS[4];
    return '#94A3B8';
  });

  const statusData = Object.entries(
    sites.reduce<Record<string, number>>((acc, s) => { acc[s.siteStatus] = (acc[s.siteStatus] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace('Microinverters ', 'MI '), value }));

  const riskBar = riskDist.map(r => ({ name: r.label.replace(' Risk', ''), count: r.count, color: r.color }));

  return (
    <div className="page-content">
      <h2 className="page-title">Executive Summary</h2>

      {/* RAG Executive Health Banner */}
      <div className="exec-health-banner" style={{ borderLeftColor: ragColor(kpis.avgHealthScore) }}>
        <div className="exec-health-score" style={{ color: ragColor(kpis.avgHealthScore) }}>
          {kpis.avgHealthScore}
        </div>
        <div className="exec-health-detail">
          <h3>Fleet Health Score</h3>
          <span className="exec-health-grade" style={{ background: ragColor(kpis.avgHealthScore) + '18', color: ragColor(kpis.avgHealthScore) }}>
            {ragLabel(kpis.avgHealthScore)} · Grade {kpis.fleetGrade}
          </span>
          <p>{kpis.totalSites} sites · {kpis.totalMicros.toLocaleString()} microinverters · {kpis.totalEnvoys.toLocaleString()} envoys</p>
        </div>
      </div>

      {/* Top-level RAG KPI Cards */}
      <div className="kpi-row">
        <KpiCard label="Fleet Health Score" value={kpis.avgHealthScore} icon={<Activity size={16} />} color={ragColor(kpis.avgHealthScore)} subtitle={ragLabel(kpis.avgHealthScore)} />
        <KpiCard label="Critical Sites" value={kpis.criticalSites} icon={<AlertTriangle size={16} />} color={kpis.criticalSites > 0 ? '#E01B1B' : '#10B981'} subtitle="Sev 1 + Sev 2" />
        <KpiCard label="Sites Without Cases" value={sitesWithoutCases} icon={<Shield size={16} />} color={sitesWithoutCases > 0 ? '#E01B1B' : '#10B981'} subtitle="Severity but no case" />
        <KpiCard label="Cases > 30 Days" value={casesOver30} color={casesOver30 > 0 ? '#F37421' : '#10B981'} subtitle="Aging open cases" />
        <KpiCard label="Not Reporting" value={kpis.notReportingSites} icon={<Shield size={16} />} color={kpis.notReportingSites > 0 ? '#E01B1B' : '#10B981'} subtitle="Envoy + MI offline" />
      </div>

      {/* Microinverter Fleet Intelligence */}
      <div className="section-card" style={{ marginBottom: 16 }}>
        <div className="section-card-header">
          <h3>⚡ Microinverter Fleet by Type</h3>
          <button className="link-btn" onClick={() => navigate('/sku')}>Full analysis →</button>
        </div>
        <div className="table-scroll">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Type</th>
                <th>Microinverters</th><th>% MI Fleet</th>
                <th>Sites</th><th>% Sites</th>
                <th style={{color:SEV_COLORS[1]}}>Sev1</th>
                <th style={{color:SEV_COLORS[2]}}>Sev2</th>
                <th style={{color:SEV_COLORS[3]}}>Sev3</th>
                <th style={{color:SEV_COLORS[4]}}>Sev4</th>
                <th>NRP</th><th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {typeMetrics.map(tm => {
                const caseCount = sites
                  .filter(s => s.microinverterType === tm.type)
                  .filter(s => casesBySiteId.has(s.siteId)).length;
                return (
                  <tr key={tm.type}>
                    <td><span style={{ fontWeight: 700, color: tm.color }}>● {tm.type}</span></td>
                    <td><strong>{tm.microinverterCount.toLocaleString()}</strong></td>
                    <td>{tm.pctOfFleetMicros}%</td>
                    <td>{tm.siteCount.toLocaleString()}</td>
                    <td>{tm.pctOfFleetSites}%</td>
                    <td style={{color:SEV_COLORS[1],fontWeight:tm.sev1>0?700:400}}>{tm.sev1||'—'}</td>
                    <td style={{color:SEV_COLORS[2],fontWeight:tm.sev2>0?700:400}}>{tm.sev2||'—'}</td>
                    <td style={{color:SEV_COLORS[3]}}>{tm.sev3||'—'}</td>
                    <td style={{color:SEV_COLORS[4]}}>{tm.sev4||'—'}</td>
                    <td style={{color:tm.nrpCount>0?'#C026D3':'inherit'}}>{tm.nrpCount||'—'}</td>
                    <td>{caseCount||'—'}</td>
                  </tr>
                );
              })}
              <tr style={{borderTop:'2px solid var(--border)',fontWeight:700}}>
                <td>Total</td>
                <td>{kpis.totalMicros.toLocaleString()}</td><td>100%</td>
                <td>{kpis.totalSites.toLocaleString()}</td><td>100%</td>
                <td style={{color:SEV_COLORS[1]}}>{typeMetrics.reduce((s,t)=>s+t.sev1,0)}</td>
                <td style={{color:SEV_COLORS[2]}}>{typeMetrics.reduce((s,t)=>s+t.sev2,0)}</td>
                <td style={{color:SEV_COLORS[3]}}>{typeMetrics.reduce((s,t)=>s+t.sev3,0)}</td>
                <td style={{color:SEV_COLORS[4]}}>{typeMetrics.reduce((s,t)=>s+t.sev4,0)}</td>
                <td style={{color:'#C026D3'}}>{kpis.notReportingSites}</td>
                <td>{cases.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="kpi-row">
        <KpiCard label="Normal Sites" value={kpis.normalSites} icon={<Zap size={16} />} color="#10B981" subtitle={`${Math.round(kpis.normalSites / kpis.totalSites * 100)}% of fleet`} />
        <KpiCard label="Avg Energy/MI/Day" value={`${kpis.avgEnergyPerMicro} Wh`} icon={<Zap size={16} />} color="#7C3AED" subtitle="Production efficiency" />
        <KpiCard label="Total Microinverters" value={kpis.totalMicros.toLocaleString()} color="#0EA5E9" subtitle={`${kpis.totalSites} sites`} />
        <KpiCard label="Active Cases" value={cases.length} color={cases.length > 0 ? '#F37421' : '#10B981'} subtitle={`${casesOver30} aging >30d`} />
      </div>

      {/* Charts Row */}
      <div className="chart-grid">
        <div className="section-card">
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sevPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`} cursor="pointer"
                onClick={() => navigate('/severity')}>
                {sevPie.map((_, i) => <Cell key={i} fill={sevPieColors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Site Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[Object.keys(STATUS_COLORS).find(k => d.name.includes(k.substring(0, 6))) || 'Normal'] || '#94A3B8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskBar}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskBar.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="chart-grid two-col">
        <div className="section-card">
          <div className="section-card-header">
            <h3>Top Installers by Fleet Size</h3>
            <button className="link-btn" onClick={() => navigate('/installers')}>View all →</button>
          </div>
          <table className="data-table compact">
            <thead><tr><th>Installer</th><th>Sites</th><th>Health</th><th>Critical %</th></tr></thead>
            <tbody>
              {topInstallers.map(inst => (
                <tr key={inst.name} className="clickable-row" onClick={() => navigate('/installers')}>
                  <td className="installer-name">{inst.name}</td>
                  <td>{inst.siteCount}</td>
                  <td><span className="health-mini" style={{ color: healthColor(inst.avgHealthScore) }}>{inst.avgHealthScore}</span></td>
                  <td><span style={{ color: inst.criticalPct > 10 ? '#E01B1B' : '#64748B' }}>{inst.criticalPct}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-card">
          <div className="section-card-header">
            <h3>SKU Fleet Summary</h3>
            <button className="link-btn" onClick={() => navigate('/sku')}>View all →</button>
          </div>
          <table className="data-table compact">
            <thead><tr><th>SKU</th><th>Sites</th><th>Health</th><th>Not Reporting</th></tr></thead>
            <tbody>
              {skuMetrics.map(s => (
                <tr key={s.sku} className="clickable-row" onClick={() => navigate('/sku')}>
                  <td className="sku-name">{s.sku}</td>
                  <td>{s.siteCount}</td>
                  <td><span className="health-mini" style={{ color: healthColor(s.avgHealthScore) }}>{s.avgHealthScore}</span></td>
                  <td><span style={{ color: s.notReportingPct > 10 ? '#E01B1B' : '#64748B' }}>{s.notReportingPct}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
