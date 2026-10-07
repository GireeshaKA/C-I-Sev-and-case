import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap } from 'lucide-react';
import { dataProvider, LoadingState, KpiCard, SEV_LABELS, STATUS_COLORS } from '../App';
import { healthColor, healthGrade } from '../services/FleetAnalytics';
import type { Site } from '../types';
import { MICROINVERTER_TYPE_COLORS, MICROINVERTER_TYPE_LABELS } from '../utils/skuFamily';

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    dataProvider.getSiteById(siteId).then(s => { setSite(s); setLoading(false); });
  }, [siteId]);

  if (loading) return <div className="page-content"><LoadingState /></div>;
  if (!site) return <div className="page-content"><p>Site not found.</p></div>;

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Back</button>

      <div className="site-detail-header">
        <div>
          <h2 className="page-title">{site.siteName}</h2>
          <span className="site-id-label">ID: {site.siteId}</span>
        </div>
        <div className="site-detail-badges">
          <span className="health-badge" style={{ background: healthColor(site.healthScore) + '18', color: healthColor(site.healthScore), borderColor: healthColor(site.healthScore) }}>
            {healthGrade(site.healthScore)} ({site.healthScore})
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 6,
            background: MICROINVERTER_TYPE_COLORS[site.microinverterType] + '20',
            color: MICROINVERTER_TYPE_COLORS[site.microinverterType],
            border: `1px solid ${MICROINVERTER_TYPE_COLORS[site.microinverterType]}` }}>
            {MICROINVERTER_TYPE_LABELS[site.microinverterType]}
          </span>
          {site.severity && (
            <span className={`sev-badge sev-${site.severity}`}>{site.severity} · {SEV_LABELS[site.severity]}</span>
          )}
          <span className="status-badge" style={{ background: (STATUS_COLORS[site.siteStatus] || '#94A3B8') + '18', color: STATUS_COLORS[site.siteStatus] || '#64748B' }}>
            {site.siteStatus}
          </span>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Health Score" value={site.healthScore} color={healthColor(site.healthScore)} icon={<Zap size={16} />} />
        <KpiCard label="Microinverters" value={site.microCount} subtitle={`${site.envoyCount} envoy(s)`} />
        <KpiCard label="Energy/MI/Day" value={site.energyPerMicroPerDay > 0 ? `${Math.round(site.energyPerMicroPerDay)} Wh` : 'N/A'} color="#7C3AED" />
        <KpiCard label="Days Producing" value={site.daysProducing} />
        <KpiCard label="Stage" value={site.siteStage} />
      </div>

      <div className="chart-grid two-col">
        <div className="section-card">
          <h3>Site Information</h3>
          <dl className="detail-grid">
            <div><dt>Installer</dt><dd>{site.installerName || '—'}</dd></div>
            <div><dt>State</dt><dd>{site.state || '—'}</dd></div>
            <div><dt>Country</dt><dd>{site.country || '—'}</dd></div>
            <div><dt>Connection</dt><dd>{site.connectionType}</dd></div>
            <div><dt>Microinverter Type</dt><dd style={{ fontWeight: 700, color: MICROINVERTER_TYPE_COLORS[site.microinverterType] }}>{site.microinverterType} — {MICROINVERTER_TYPE_LABELS[site.microinverterType]}</dd></div>
            <div><dt>SKU (Model)</dt><dd>{site.miProductSku || '—'}</dd></div>
            <div><dt>Envoy Type</dt><dd>{String(site.envoyType)}</dd></div>
            <div><dt>EMU SW Version</dt><dd>{site.emuSwVersion || '—'}</dd></div>
            <div><dt>Inv Procload</dt><dd className="mono">{site.invProduced || '—'}</dd></div>
            <div><dt>Inv Paramtbl</dt><dd className="mono">{site.invParamBld || '—'}</dd></div>
            <div><dt>Status Reason</dt><dd>{site.statusReason || '—'}</dd></div>
            <div><dt>Last Interval</dt><dd>{site.lastIntervalEndDate || '—'}</dd></div>
            <div><dt>Site Created</dt><dd>{site.siteCreatedAt || '—'}</dd></div>
          </dl>
        </div>

        <div className="section-card">
          <h3>Energy Production</h3>
          <dl className="detail-grid">
            <div><dt>Meter Energy</dt><dd>{site.meterEnergy > 0 ? `${Math.round(site.meterEnergy).toLocaleString()} Wh` : 'N/A'}</dd></div>
            <div><dt>Micro Energy</dt><dd>{site.microEnergy > 0 ? `${Math.round(site.microEnergy).toLocaleString()} Wh` : 'N/A'}</dd></div>
            <div><dt>Energy/Micro/Day</dt><dd>{site.energyPerMicroPerDay > 0 ? `${Math.round(site.energyPerMicroPerDay)} Wh` : 'N/A'}</dd></div>
            <div><dt>Days Producing</dt><dd>{site.daysProducing}</dd></div>
            {site.severity && site.severitySubcategory && (
              <div><dt>Subcategory</dt><dd>({site.severitySubcategory}) — {site.severitySubcategory === 'a' ? 'Open, not In Progress' : site.severitySubcategory === 'b' ? 'Open, In Progress' : 'No open cases'}</dd></div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
