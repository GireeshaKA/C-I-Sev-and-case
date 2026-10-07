import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertTriangle } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, EmptyState, SEV_COLORS } from '../App';
import { healthColor, healthGrade } from '../services/FleetAnalytics';
import { exportToCsv } from '../utils/csvExport';

import { MICROINVERTER_TYPE_COLORS } from '../utils/skuFamily';
import type { MicroinverterType } from '../types';

interface ActionSite {
  siteId: string;
  siteName: string;
  microinverterType: MicroinverterType;
  severity: number | null;
  openCases: number;
  caseAge: number;
  installerName: string;
  caseOwner: string;
  siteStatus: string;
  healthScore: number;
  miProductSku: string;
  priority: number;
  reason: string;
}

export default function ActionQueuePage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const navigate = useNavigate();

  const actionItems = useMemo(() => {
    const caseMap = new Map<string, { count: number; maxAge: number; owner: string; status: string }>();
    cases.forEach(c => {
      const existing = caseMap.get(c.siteId);
      if (!existing) {
        caseMap.set(c.siteId, { count: 1, maxAge: c.caseAge, owner: c.caseOwner, status: c.caseStatus });
      } else {
        existing.count++;
        if (c.caseAge > existing.maxAge) { existing.maxAge = c.caseAge; existing.owner = c.caseOwner; }
      }
    });

    const items: ActionSite[] = [];

    // Priority 1: Sev1 sites with NO case
    sites.filter(s => s.severity === 1 && !caseMap.has(s.siteId)).forEach(s => {
      items.push({
        siteId: s.siteId, siteName: s.siteName, microinverterType: s.microinverterType,
        severity: s.severity, openCases: 0, caseAge: 0, installerName: s.installerName,
        caseOwner: '—', siteStatus: s.siteStatus, healthScore: s.healthScore,
        miProductSku: s.miProductSku, priority: 1, reason: `${s.microinverterType} Sev1 · No case created`,
      });
    });

    // Priority 2: Sev1 sites with open case > 7 days
    sites.filter(s => s.severity === 1 && caseMap.has(s.siteId)).forEach(s => {
      const c = caseMap.get(s.siteId)!;
      if (c.maxAge > 7) {
        items.push({
          siteId: s.siteId, siteName: s.siteName, microinverterType: s.microinverterType,
          severity: s.severity, openCases: c.count, caseAge: c.maxAge, installerName: s.installerName,
          caseOwner: c.owner, siteStatus: s.siteStatus, healthScore: s.healthScore,
          miProductSku: s.miProductSku, priority: 2, reason: `${s.microinverterType} Sev1 · Case aging ${c.maxAge}d`,
        });
      }
    });

    // Priority 3: Sev2 sites with NO case
    sites.filter(s => s.severity === 2 && !caseMap.has(s.siteId)).forEach(s => {
      items.push({
        siteId: s.siteId, siteName: s.siteName, microinverterType: s.microinverterType,
        severity: s.severity, openCases: 0, caseAge: 0, installerName: s.installerName,
        caseOwner: '—', siteStatus: s.siteStatus, healthScore: s.healthScore,
        miProductSku: s.miProductSku, priority: 3, reason: `${s.microinverterType} Sev2 · No case created`,
      });
    });

    items.sort((a, b) => a.priority - b.priority || a.healthScore - b.healthScore);
    return items;
  }, [sites, cases]);

  const exportQueue = () => {
    if (!actionItems.length) return;
    exportToCsv('action_queue.csv', actionItems.map(a => ({
      Priority: a.priority, Type: a.microinverterType, SKU: a.miProductSku,
      Reason: a.reason, Site: a.siteName, SiteID: a.siteId,
      Severity: a.severity, OpenCases: a.openCases, CaseAge: a.caseAge,
      Installer: a.installerName, Owner: a.caseOwner, Status: a.siteStatus,
      Health: a.healthScore,
    })));
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const p1 = actionItems.filter(a => a.priority === 1).length;
  const p2 = actionItems.filter(a => a.priority === 2).length;
  const p3 = actionItems.filter(a => a.priority === 3).length;

  return (
    <div className="page-content">
      <h2 className="page-title"><AlertTriangle size={22} className="inline-icon" /> Sites Requiring Immediate Attention</h2>
      <p className="page-desc">High-priority operational queue — Sev1 without cases, aging Sev1 cases, and Sev2 gaps.</p>

      <div className="kpi-row">
        <KpiCard label="Total Action Items" value={actionItems.length} color="#E01B1B" subtitle="Needs attention now" />
        <KpiCard label="P1: Sev1 No Case" value={p1} color={SEV_COLORS[1]} subtitle="Create case immediately" />
        <KpiCard label="P2: Sev1 Aging >7d" value={p2} color="#F37421" subtitle="Escalate or follow up" />
        <KpiCard label="P3: Sev2 No Case" value={p3} color={SEV_COLORS[2]} subtitle="Open case" />
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <h3>Action Queue ({actionItems.length})</h3>
          <button className="link-btn" onClick={exportQueue}><Download size={14} /> Export CSV</button>
        </div>
        {actionItems.length === 0 ? <EmptyState message="No items requiring immediate attention" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Site</th>
                  <th>Severity</th>
                  <th>Open Cases</th>
                  <th>Case Age</th>
                  <th>Installer</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map(a => (
                  <tr key={a.siteId} className="clickable-row" onClick={() => navigate(`/site/${a.siteId}`)}>
                    <td><span className={`sev-badge sev-${a.priority === 1 ? '1' : a.priority === 2 ? '2' : '3'}`}>P{a.priority}</span></td>
                    <td><span style={{ fontWeight: 700, color: MICROINVERTER_TYPE_COLORS[a.microinverterType] }}>{a.microinverterType}</span></td>
                    <td style={{ fontSize: 11, maxWidth: 200, whiteSpace: 'normal' }}>{a.reason}</td>
                    <td>{a.siteName}<br /><small className="site-id">{a.siteId}</small></td>
                    <td><span className={`sev-badge sev-${a.severity}`}>Sev {a.severity}</span></td>
                    <td>{a.openCases}</td>
                    <td style={{ color: a.caseAge > 30 ? '#E01B1B' : a.caseAge > 7 ? '#F37421' : undefined, fontWeight: a.caseAge > 7 ? 700 : 400 }}>
                      {a.caseAge > 0 ? `${a.caseAge}d` : '—'}
                    </td>
                    <td>{a.installerName || '—'}</td>
                    <td>{a.caseOwner}</td>
                    <td>{a.siteStatus}</td>
                    <td><span className="health-mini" style={{ color: healthColor(a.healthScore) }}>{healthGrade(a.healthScore)} ({a.healthScore})</span></td>
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
