import { useContext, useMemo } from 'react';
import { Download } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, USE_LIVE, SEV_COLORS } from '../App';
import { computeTypeMetrics, computeSkuMetrics, computeFleetKpis } from '../services/FleetAnalytics';
import { MICROINVERTER_TYPE_COLORS } from '../utils/skuFamily';
import { exportToCsv } from '../utils/csvExport';
import { healthColor } from '../services/FleetAnalytics';

function pct(n: number, total: number) {
  if (!total) return '0.0%';
  return `${Math.round((n / total) * 1000) / 10}%`;
}

export default function ManagementReportPage() {
  const { sites, cases, loading, dataSourceInfo } = useContext(FilterContext);

  const kpis        = useMemo(() => computeFleetKpis(sites), [sites]);
  const typeMetrics = useMemo(() => computeTypeMetrics(sites), [sites]);
  const skuMetrics  = useMemo(() => computeSkuMetrics(sites), [sites]);

  const totalMicros = useMemo(() => sites.reduce((s, x) => s + x.microCount, 0), [sites]);
  const casesBySiteId = useMemo(() => {
    const m = new Map<string, number>();
    cases.forEach(c => m.set(c.siteId, (m.get(c.siteId) || 0) + 1));
    return m;
  }, [cases]);

  const dataLabel = USE_LIVE
    ? dataSourceInfo?.status === 'live'    ? '● LIVE DATA'
    : dataSourceInfo?.status === 'partial' ? '◐ PARTIAL LIVE DATA'
    : dataSourceInfo?.status === 'error'   ? '! LIVE DATA ERROR'
    : '↻ Connecting…'
    : '— REPRESENTATIVE DATA (DEMO)';

  const reportDate = new Date().toLocaleString();

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const exportTypeTable = () => {
    exportToCsv('management_type_summary.csv', typeMetrics.map(tm => ({
      Type: tm.type,
      Microinverters: tm.microinverterCount,
      'Micro % of Fleet': `${tm.pctOfFleetMicros}%`,
      Sites: tm.siteCount,
      'Sites % of Fleet': `${tm.pctOfFleetSites}%`,
      'Sev 1': tm.sev1,
      'Sev 2': tm.sev2,
      'Sev 3': tm.sev3,
      'Sev 4': tm.sev4,
      'NRP': tm.nrpCount,
      'Health Score': tm.avgHealthScore,
      SKUs: tm.skus.join('; '),
    })));
  };

  const exportSkuTable = () => {
    exportToCsv('management_sku_detail.csv', skuMetrics.map(s => ({
      Type: s.microinverterType,
      'SKU (Microinverter Model)': s.sku,
      Microinverters: s.microinverterCount,
      Sites: s.siteCount,
      'Health Score': s.avgHealthScore,
      'Critical %': `${s.criticalPct}%`,
      'NRP %': `${s.notReportingPct}%`,
      'Avg Energy/MI/Day (Wh)': s.avgEnergyPerMicro,
      'Sev 1': s.sevCounts[1] || 0,
      'Sev 2': s.sevCounts[2] || 0,
      'Sev 3': s.sevCounts[3] || 0,
      'Sev 4': s.sevCounts[4] || 0,
    })));
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Management Report — Microinverter Fleet</h2>
          <p className="page-desc" style={{ marginBottom: 4 }}>
            Enphase C&amp;I Fleet Health Intelligence · Generated {reportDate}
          </p>
          <span className={`data-source-indicator ${USE_LIVE ? (dataSourceInfo?.status === 'live' ? 'data-source-live' : dataSourceInfo?.status === 'partial' ? 'data-source-partial' : 'data-source-error') : ''}`}>
            {dataLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="link-btn" onClick={exportTypeTable}><Download size={14} /> Type Summary CSV</button>
          <button className="link-btn" onClick={exportSkuTable}><Download size={14} /> SKU Detail CSV</button>
        </div>
      </div>

      {/* Fleet-level KPIs */}
      <div className="kpi-row">
        <KpiCard label="Total Microinverters" value={totalMicros.toLocaleString()} subtitle={`Across ${kpis.totalSites} sites`} color="#0EA5E9" />
        <KpiCard label="Fleet Health Score" value={kpis.avgHealthScore} subtitle={`Grade ${kpis.fleetGrade}`} color={kpis.avgHealthScore >= 75 ? '#10B981' : kpis.avgHealthScore >= 50 ? '#E89B0C' : '#E01B1B'} />
        <KpiCard label="Critical Sites" value={kpis.criticalSites} subtitle="Sev 1 + Sev 2" color={kpis.criticalSites > 0 ? '#E01B1B' : '#10B981'} />
        <KpiCard label="Not Reporting" value={kpis.notReportingSites} subtitle="Envoy + MI offline" color={kpis.notReportingSites > 0 ? '#C026D3' : '#10B981'} />
        <KpiCard label="Active Cases" value={cases.length} subtitle={`${cases.filter(c => c.caseAge > 30).length} aging >30d`} color="#F37421" />
      </div>

      {/* Management Type Table */}
      <div className="section-card">
        <div className="section-card-header">
          <h3>Microinverter Type Summary</h3>
          <button className="link-btn" onClick={exportTypeTable}><Download size={14} /> CSV</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Type classification derived from <code>mi_product_sku</code> field: IQ8* → IQ8, IQ9* → IQ9.
          Microinverter Count = SUM(micro_count) per type. Site Count = COUNT(DISTINCT site_id) per type.
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Microinverters</th><th>% MI Fleet</th>
                <th>Sites</th><th>% Sites</th>
                <th style={{color:SEV_COLORS[1]}}>Sev 1</th>
                <th style={{color:SEV_COLORS[2]}}>Sev 2</th>
                <th style={{color:SEV_COLORS[3]}}>Sev 3</th>
                <th style={{color:SEV_COLORS[4]}}>Sev 4</th>
                <th>NRP</th><th>Health</th><th>SKUs</th>
              </tr>
            </thead>
            <tbody>
              {typeMetrics.map(tm => (
                <tr key={tm.type}>
                  <td><strong style={{ color: tm.color }}>● {tm.type}</strong></td>
                  <td><strong>{tm.microinverterCount.toLocaleString()}</strong></td>
                  <td>{tm.pctOfFleetMicros}%</td>
                  <td>{tm.siteCount.toLocaleString()}</td>
                  <td>{tm.pctOfFleetSites}%</td>
                  <td style={{color:SEV_COLORS[1],fontWeight:tm.sev1>0?700:400}}>{tm.sev1||'—'}</td>
                  <td style={{color:SEV_COLORS[2],fontWeight:tm.sev2>0?700:400}}>{tm.sev2||'—'}</td>
                  <td style={{color:SEV_COLORS[3]}}>{tm.sev3||'—'}</td>
                  <td style={{color:SEV_COLORS[4]}}>{tm.sev4||'—'}</td>
                  <td style={{color:tm.nrpCount>0?'#C026D3':'inherit'}}>{tm.nrpCount||'—'}</td>
                  <td><span style={{color:healthColor(tm.avgHealthScore)}}>{tm.avgHealthScore}</span></td>
                  <td style={{fontSize:11,color:'var(--text-muted)'}}>{tm.skus.length} model{tm.skus.length!==1?'s':''}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td>Total Fleet</td>
                <td>{totalMicros.toLocaleString()}</td><td>100%</td>
                <td>{kpis.totalSites.toLocaleString()}</td><td>100%</td>
                <td style={{color:SEV_COLORS[1]}}>{typeMetrics.reduce((s,t)=>s+t.sev1,0)}</td>
                <td style={{color:SEV_COLORS[2]}}>{typeMetrics.reduce((s,t)=>s+t.sev2,0)}</td>
                <td style={{color:SEV_COLORS[3]}}>{typeMetrics.reduce((s,t)=>s+t.sev3,0)}</td>
                <td style={{color:SEV_COLORS[4]}}>{typeMetrics.reduce((s,t)=>s+t.sev4,0)}</td>
                <td style={{color:'#C026D3'}}>{kpis.notReportingSites}</td>
                <td><span style={{color:healthColor(kpis.avgHealthScore)}}>{kpis.avgHealthScore}</span></td>
                <td style={{fontSize:11}}>{skuMetrics.length} SKUs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SKU Detail Table */}
      <div className="section-card">
        <div className="section-card-header">
          <h3>SKU (Microinverter Model) Detail</h3>
          <button className="link-btn" onClick={exportSkuTable}><Download size={14} /> CSV</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          SKU = Microinverter Model. Each row represents one distinct SKU grouped under its Type.
          Sorted by Type, then by microinverter count descending.
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>SKU (Model)</th>
                <th>Micros</th><th>% Fleet Micros</th>
                <th>Sites</th><th>Health</th>
                <th style={{color:SEV_COLORS[1]}}>Sev 1</th>
                <th style={{color:SEV_COLORS[2]}}>Sev 2</th>
                <th>NRP %</th>
              </tr>
            </thead>
            <tbody>
              {(['IQ8', 'IQ9', 'OTHER', 'UNKNOWN'] as const).map(type =>
                skuMetrics.filter(s => s.microinverterType === type).map((s, idx) => (
                  <tr key={s.sku} style={idx === 0 ? { borderTop: '2px solid var(--border)' } : {}}>
                    {idx === 0 ? (
                      <td rowSpan={skuMetrics.filter(x => x.microinverterType === type).length}
                        style={{ fontWeight: 700, color: MICROINVERTER_TYPE_COLORS[type], verticalAlign: 'top', paddingTop: 10 }}>
                        {type}
                      </td>
                    ) : null}
                    <td className="sku-name">{s.sku}</td>
                    <td><strong>{s.microinverterCount.toLocaleString()}</strong></td>
                    <td>{pct(s.microinverterCount, totalMicros)}</td>
                    <td>{s.siteCount}</td>
                    <td><span style={{color:healthColor(s.avgHealthScore)}}>{s.avgHealthScore}</span></td>
                    <td style={{color:SEV_COLORS[1],fontWeight:s.sevCounts[1]>0?700:400}}>{s.sevCounts[1]||'—'}</td>
                    <td style={{color:SEV_COLORS[2],fontWeight:s.sevCounts[2]>0?700:400}}>{s.sevCounts[2]||'—'}</td>
                    <td style={{color:s.notReportingPct>10?'#C026D3':'inherit'}}>{s.notReportingPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Q&A for management */}
      <div className="section-card">
        <h3>Management Q&amp;A</h3>
        <dl className="detail-grid">
          {typeMetrics.map(tm => [
            <div key={`q-micros-${tm.type}`}>
              <dt>How many {tm.type} microinverters in the fleet?</dt>
              <dd style={{color:tm.color,fontWeight:700}}>{tm.microinverterCount.toLocaleString()} microinverters across {tm.siteCount} sites ({tm.pctOfFleetMicros}% of fleet)</dd>
            </div>,
            <div key={`q-sev1-${tm.type}`}>
              <dt>Which {tm.type} sites have Sev 1 (Critical)?</dt>
              <dd style={{color:tm.sev1>0?SEV_COLORS[1]:'#10B981'}}>{tm.sev1} site{tm.sev1!==1?'s':''}{tm.sev1===0?' — none critical':''}</dd>
            </div>,
          ])}
          <div>
            <dt>Which Type has highest severity rate (Sev 1+2 / Sites)?</dt>
            <dd>{(() => {
              const worst = [...typeMetrics].sort((a,b) => (b.sev1+b.sev2)/Math.max(b.siteCount,1) - (a.sev1+a.sev2)/Math.max(a.siteCount,1))[0];
              if (!worst) return '—';
              return `${worst.type} — ${pct(worst.sev1+worst.sev2, worst.siteCount)} Sev1+2 rate`;
            })()}</dd>
          </div>
          <div>
            <dt>Which SKU has highest NRP rate?</dt>
            <dd>{(() => {
              const worst = [...skuMetrics].sort((a,b) => b.notReportingPct - a.notReportingPct)[0];
              return worst ? `${worst.sku} (${worst.microinverterType}) — ${worst.notReportingPct}% NRP` : '—';
            })()}</dd>
          </div>
          <div>
            <dt>Which Type/SKU has largest case population?</dt>
            <dd>{(() => {
              const bySku = skuMetrics.map(s => ({
                ...s,
                caseCount: sites.filter(x => x.miProductSku === s.sku && casesBySiteId.has(x.siteId)).length,
              })).sort((a,b) => b.caseCount - a.caseCount)[0];
              return bySku?.caseCount
                ? `${bySku.microinverterType} / ${bySku.sku} — ${bySku.caseCount} site(s) with cases`
                : '— No cases found';
            })()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
