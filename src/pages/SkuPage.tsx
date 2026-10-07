import { useContext, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, SEV_COLORS } from '../App';
import { computeSkuMetrics, computeTypeMetrics, healthColor } from '../services/FleetAnalytics';
import type { MicroinverterType } from '../types';
import { MICROINVERTER_TYPE_COLORS, MICROINVERTER_TYPE_LABELS } from '../utils/skuFamily';
import { exportToCsv } from '../utils/csvExport';

type TypeTab = 'ALL' | MicroinverterType;

export default function SkuPage() {
  const { sites, loading } = useContext(FilterContext);
  const [typeTab, setTypeTab] = useState<TypeTab>('ALL');

  const allSkuMetrics  = useMemo(() => computeSkuMetrics(sites), [sites]);
  const typeMetrics    = useMemo(() => computeTypeMetrics(sites), [sites]);
  const skuMetrics     = useMemo(() => (
    typeTab === 'ALL' ? allSkuMetrics : allSkuMetrics.filter(s => s.microinverterType === typeTab)
  ), [allSkuMetrics, typeTab]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const totalMicros = sites.reduce((sum, s) => sum + s.microCount, 0);

  const sevStack = skuMetrics.map(s => ({
    name: s.sku.replace('IQ', '').replace('-DOM-US', 'D').replace('-US', ''),
    fullName: s.sku,
    Sev1: s.sevCounts[1] || 0,
    Sev2: s.sevCounts[2] || 0,
    Sev3: s.sevCounts[3] || 0,
    Sev4: s.sevCounts[4] || 0,
  }));

  const healthBar = skuMetrics.map(s => ({
    name: s.sku.replace('IQ', '').replace('-DOM-US', 'D').replace('-US', ''),
    fullName: s.sku,
    health: s.avgHealthScore,
    sites: s.siteCount,
  }));

  const exportData = () => {
    exportToCsv('microinverter_sku_analysis.csv', skuMetrics.map(s => ({
      Type: s.microinverterType,
      SKU: s.sku,
      Sites: s.siteCount,
      Microinverters: s.microinverterCount,
      'Health Score': s.avgHealthScore,
      'Critical %': s.criticalPct,
      'NRP %': s.notReportingPct,
      'Avg Energy/MI/Day (Wh)': s.avgEnergyPerMicro,
      'Sev 1': s.sevCounts[1] || 0,
      'Sev 2': s.sevCounts[2] || 0,
      'Sev 3': s.sevCounts[3] || 0,
      'Sev 4': s.sevCounts[4] || 0,
    })));
  };

  return (
    <div className="page-content">
      <h2 className="page-title">⚡ Microinverter Intelligence</h2>
      <p className="page-desc">
        IQ8 and IQ9 fleet breakdown — sites, microinverter counts, severity, health, and SKU-level detail.
        Type classification is derived from <code>mi_product_sku</code> (IQ8* → IQ8, IQ9* → IQ9).
      </p>

      {/* Type-level summary cards */}
      <div className="kpi-row">
        {typeMetrics.map(tm => (
          <KpiCard
            key={tm.type}
            label={`${tm.type} Microinverters`}
            value={tm.microinverterCount.toLocaleString()}
            subtitle={`${tm.siteCount} sites · ${tm.pctOfFleetMicros}% of MI fleet`}
            color={tm.color}
          />
        ))}
        <KpiCard label="Total Fleet" value={totalMicros.toLocaleString()} subtitle={`${sites.length} sites`} color="#0EA5E9" />
      </div>

      {/* Type tabs */}
      <div className="type-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['ALL', 'IQ8', 'IQ9', 'OTHER', 'UNKNOWN'] as TypeTab[])
          .filter(t => t === 'ALL' || allSkuMetrics.some(s => s.microinverterType === t))
          .map(t => (
            <button
              key={t}
              onClick={() => setTypeTab(t)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: '2px solid',
                borderColor: typeTab === t ? (t === 'ALL' ? '#0EA5E9' : MICROINVERTER_TYPE_COLORS[t as MicroinverterType]) : 'var(--border)',
                background: typeTab === t ? (t === 'ALL' ? '#0EA5E9' : MICROINVERTER_TYPE_COLORS[t as MicroinverterType]) + '18' : 'transparent',
                color: typeTab === t ? (t === 'ALL' ? '#0EA5E9' : MICROINVERTER_TYPE_COLORS[t as MicroinverterType]) : 'var(--text-muted)',
                fontWeight: typeTab === t ? 700 : 400, cursor: 'pointer', fontSize: 13,
              }}>
              {t === 'ALL' ? 'All Types' : MICROINVERTER_TYPE_LABELS[t as MicroinverterType]}
            </button>
          ))}
      </div>

      <div className="chart-grid two-col">
        <div className="section-card">
          <h3>Severity Distribution by SKU</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sevStack}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''} />
              <Legend />
              <Bar dataKey="Sev1" name="Sev 1 · Critical" fill={SEV_COLORS[1]} stackId="a" />
              <Bar dataKey="Sev2" name="Sev 2 · High" fill={SEV_COLORS[2]} stackId="a" />
              <Bar dataKey="Sev3" name="Sev 3 · Medium" fill={SEV_COLORS[3]} stackId="a" />
              <Bar dataKey="Sev4" name="Sev 4 · Low" fill={SEV_COLORS[4]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Health Score by SKU</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={healthBar}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''} />
              <Bar dataKey="health" name="Health Score" radius={[4, 4, 0, 0]}>
                {healthBar.map((d, i) => <Cell key={i} fill={healthColor(d.health)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="section-card">
        <div className="section-card-header">
          <h3>SKU Detail Table {typeTab !== 'ALL' && `— ${MICROINVERTER_TYPE_LABELS[typeTab as MicroinverterType]} only`}</h3>
          <button className="link-btn" onClick={exportData}><Download size={14} /> Export CSV</button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>SKU (Microinverter Model)</th>
                <th>Microinverters</th><th>Sites</th>
                <th>Health</th><th>Critical %</th><th>NRP %</th>
                <th>Avg Energy/MI/Day</th>
                <th style={{color:SEV_COLORS[1]}}>Sev 1</th>
                <th style={{color:SEV_COLORS[2]}}>Sev 2</th>
                <th style={{color:SEV_COLORS[3]}}>Sev 3</th>
                <th style={{color:SEV_COLORS[4]}}>Sev 4</th>
              </tr>
            </thead>
            <tbody>
              {skuMetrics.map(s => (
                <tr key={s.sku}>
                  <td>
                    <span style={{ fontWeight: 700, color: MICROINVERTER_TYPE_COLORS[s.microinverterType] }}>
                      {s.microinverterType}
                    </span>
                  </td>
                  <td className="sku-name">{s.sku}</td>
                  <td><strong>{s.microinverterCount.toLocaleString()}</strong></td>
                  <td>{s.siteCount}</td>
                  <td><span className="health-mini" style={{ color: healthColor(s.avgHealthScore) }}>{s.avgHealthScore}</span></td>
                  <td style={{ color: s.criticalPct > 10 ? '#DC2626' : '#64748B' }}>{s.criticalPct}%</td>
                  <td style={{ color: s.notReportingPct > 10 ? '#EA580C' : '#64748B' }}>{s.notReportingPct}%</td>
                  <td>{s.avgEnergyPerMicro} Wh</td>
                  <td style={{ color: SEV_COLORS[1] }}>{s.sevCounts[1] || 0}</td>
                  <td style={{ color: SEV_COLORS[2] }}>{s.sevCounts[2] || 0}</td>
                  <td style={{ color: SEV_COLORS[3] }}>{s.sevCounts[3] || 0}</td>
                  <td style={{ color: SEV_COLORS[4] }}>{s.sevCounts[4] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
