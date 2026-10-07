import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { FilterContext, KpiCard, LoadingState, EmptyState, SEV_COLORS } from '../App';
import { computeRiskDistribution, healthColor, healthGrade } from '../services/FleetAnalytics';

export default function RiskPage() {
  const { sites, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const riskDist = useMemo(() => computeRiskDistribution(sites), [sites]);

  const criticalSites = useMemo(() =>
    [...sites].filter(s => s.healthScore < 40).sort((a, b) => a.healthScore - b.healthScore).slice(0, 20),
    [sites]
  );

  const highRisk = useMemo(() =>
    [...sites].filter(s => s.healthScore >= 40 && s.healthScore < 60).sort((a, b) => a.healthScore - b.healthScore).slice(0, 20),
    [sites]
  );

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const pieData = riskDist.filter(r => r.count > 0).map(r => ({ name: r.label, value: r.count, color: r.color }));

  return (
    <div className="page-content">
      <h2 className="page-title">Risk Stratification</h2>
      <p className="page-desc">
        Site risk distribution based on DERIVED health scores (severity + reporting status).
        Health score formula: see <em>Data Quality → KPI Definitions</em>.
        Counts are calculated from live fleet data — no predictions are made.
      </p>

      <div className="kpi-row">
        <KpiCard label="Critical Risk" value={riskDist[0].count} color="#DC2626" subtitle={`${riskDist[0].pct}% of fleet · health &lt;40`} />
        <KpiCard label="High Risk" value={riskDist[1].count} color="#EA580C" subtitle={`${riskDist[1].pct}% of fleet · health 40–59`} />
        <KpiCard label="Moderate Risk" value={riskDist[2].count} color="#D97706" subtitle={`${riskDist[2].pct}% of fleet · health 60–74`} />
        <KpiCard label="Healthy" value={riskDist[4].count} color="#16A34A" subtitle={`${riskDist[4].pct}% of fleet · health ≥85`} />
      </div>

      <div className="chart-grid two-col">
        <div className="section-card">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                paddingAngle={2} label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Risk Breakdown</h3>
          <div className="risk-bars">
            {riskDist.map(r => (
              <div key={r.label} className="risk-bar-row">
                <span className="risk-bar-label" style={{ color: r.color }}>{r.label}</span>
                <div className="risk-bar-track">
                  <div className="risk-bar-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                <span className="risk-bar-value">{r.count} ({r.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Sites Table */}
      <div className="section-card">
        <h3>Critical Risk Sites (Top 20)</h3>
        {criticalSites.length === 0 ? <EmptyState message="No critical risk sites" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Site</th><th>Health</th><th>Severity</th><th>Status</th><th>Installer</th><th>SKU</th></tr></thead>
              <tbody>
                {criticalSites.map(s => (
                  <tr key={s.siteId} className="clickable-row" onClick={() => navigate(`/site/${s.siteId}`)}>
                    <td>{s.siteName}</td>
                    <td><span className="health-mini" style={{ color: healthColor(s.healthScore) }}>{healthGrade(s.healthScore)} ({s.healthScore})</span></td>
                    <td><span className={`sev-badge sev-${s.severity || 'none'}`}>{s.severity ? `${s.severity} · ${(SEV_COLORS as Record<number, string>)[s.severity] ? ['Critical','High','Medium','Low'][s.severity - 1] : ''}` : '—'}</span></td>
                    <td>{s.siteStatus}</td>
                    <td>{s.installerName || '—'}</td>
                    <td className="sku-name">{s.miProductSku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* High Risk Sites */}
      <div className="section-card">
        <h3>High Risk Sites (Top 20)</h3>
        {highRisk.length === 0 ? <EmptyState message="No high risk sites" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Site</th><th>Health</th><th>Severity</th><th>Status</th><th>State</th></tr></thead>
              <tbody>
                {highRisk.map(s => (
                  <tr key={s.siteId} className="clickable-row" onClick={() => navigate(`/site/${s.siteId}`)}>
                    <td>{s.siteName}</td>
                    <td><span className="health-mini" style={{ color: healthColor(s.healthScore) }}>{healthGrade(s.healthScore)} ({s.healthScore})</span></td>
                    <td>{s.severity ? `Sev ${s.severity}` : '—'}</td>
                    <td>{s.siteStatus}</td>
                    <td>{s.state || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Predictive Risk — explicitly unavailable per requirement §24 */}
      <div className="section-card" style={{ borderLeft: '4px solid #94A3B8' }}>
        <h3 style={{ color: '#64748B' }}>Predictive Risk Analytics — Not Available</h3>
        <div className="dq-notice">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <strong>Predictive model not connected</strong>
          </div>
          <span>
            No predictive or ML model is connected to this dashboard. Confidence scores, severity forecasts,
            and degradation predictions are not available from the current data source.
          </span>
          <span style={{ marginTop: 4 }}>
            To enable predictive risk, connect a model supplying: <code>risk_score</code>, <code>predicted_severity</code>,{' '}
            <code>prediction_confidence</code>, <code>prediction_horizon</code>, <code>model_version</code>.
          </span>
        </div>
      </div>
    </div>
  );
}
