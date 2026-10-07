/**
 * Trends & History Page
 *
 * IMPORTANT — Historical Data Availability:
 * The Incorta C&I Severity & Cases Business View is a current-state snapshot.
 * It does NOT contain historical severity records.
 * Using siteCreatedAt as a proxy for historical severity is INCORRECT and
 * violates the no-fabrication rule (requirement §18-20).
 *
 * Live mode: shows current-state fleet snapshot + explicit unavailability notice.
 * Mock mode: shows illustrative (representative) charts clearly labeled as such.
 */

import { useContext, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, BarChart, Bar, Cell,
} from 'recharts';
import { AlertCircle, Info } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, USE_LIVE, SEV_COLORS } from '../App';
import { computeFleetKpis } from '../services/FleetAnalytics';
import type { Site, SfdcCase } from '../types';

type Granularity = 'daily' | 'weekly' | 'monthly';

function fmtBucket(d: Date, gran: Granularity): string {
  if (gran === 'daily') return d.toISOString().split('T')[0];
  if (gran === 'weekly') {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(new Date(d).setDate(diff));
    return mon.toISOString().split('T')[0];
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Used in MOCK mode only — illustrative, clearly labeled
function buildMockSeverityTrend(sites: Site[], gran: Granularity) {
  const buckets = new Map<string, { sev1: number; sev2: number; sev3: number; sev4: number }>();
  const start = new Date('2025-05-27');
  const now = new Date();
  const cur = new Date(start);
  while (cur <= now) {
    buckets.set(fmtBucket(new Date(cur), gran), { sev1: 0, sev2: 0, sev3: 0, sev4: 0 });
    if (gran === 'daily') cur.setDate(cur.getDate() + 1);
    else if (gran === 'weekly') cur.setDate(cur.getDate() + 7);
    else cur.setMonth(cur.getMonth() + 1);
  }
  sites.forEach(s => {
    if (!s.siteCreatedAt || !s.severity) return;
    const created = new Date(s.siteCreatedAt);
    if (created < start) return;
    const key = fmtBucket(created, gran);
    const b = buckets.get(key);
    if (b) {
      if (s.severity === 1) b.sev1++;
      else if (s.severity === 2) b.sev2++;
      else if (s.severity === 3) b.sev3++;
      else if (s.severity === 4) b.sev4++;
    }
  });
  return Array.from(buckets.entries()).map(([date, c]) => ({ date, ...c })).sort((a, b) => a.date.localeCompare(b.date));
}

function buildMockCaseTrend(cases: SfdcCase[], gran: Granularity) {
  const buckets = new Map<string, { created: number; inProgress: number; backlog: number }>();
  cases.forEach(c => {
    if (!c.createdDate) return;
    const key = fmtBucket(new Date(c.createdDate), gran);
    const b = buckets.get(key) || { created: 0, inProgress: 0, backlog: 0 };
    b.created++;
    if (c.caseStatus === 'Case - In Progress') b.inProgress++;
    b.backlog = b.created;
    buckets.set(key, b);
  });
  return Array.from(buckets.entries()).map(([date, c]) => ({ date, ...c })).sort((a, b) => a.date.localeCompare(b.date));
}

function UnavailableNotice({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="section-card">
      <h3>{title}</h3>
      <div className="dq-notice" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} color="#94A3B8" />
          <strong>Historical data not available from current source</strong>
        </div>
        <span>{reason}</span>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { sites, cases, loading } = useContext(FilterContext);
  const [gran, setGran] = useState<Granularity>('weekly');
  const kpis = useMemo(() => computeFleetKpis(sites), [sites]);

  // Current-state severity breakdown (always available from live data)
  const currentSevBreakdown = useMemo(() => [1, 2, 3, 4].map(n => ({
    name: `S${n}`,
    count: sites.filter(s => s.severity === n).length,
    color: SEV_COLORS[n],
  })), [sites]);

  const nrpCount = useMemo(() =>
    sites.filter(s => s.siteStatus === 'Microinverters Not Reporting' || s.siteStatus === 'Envoy Not Reporting').length,
    [sites]
  );

  // Mock-mode charts
  const mockSevTrend  = useMemo(() => !USE_LIVE ? buildMockSeverityTrend(sites, gran) : [], [sites, gran]);
  const mockCaseTrend = useMemo(() => !USE_LIVE ? buildMockCaseTrend(cases, gran) : [], [cases, gran]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  return (
    <div className="page-content">
      <h2 className="page-title">Trends & History</h2>
      <p className="page-desc">
        Current fleet state and trend analytics.
        {USE_LIVE && <span style={{ color: '#94A3B8', marginLeft: 8 }}>
          <Info size={12} style={{ verticalAlign: 'middle' }} /> Historical trend charts require a time-series data source — see notices below.
        </span>}
        {!USE_LIVE && <span className="demo-label" style={{ marginLeft: 8 }}>Representative Data</span>}
      </p>

      <div className="kpi-row">
        <KpiCard label="Fleet Sites" value={sites.length.toLocaleString()} color="#2563EB" subtitle="Total distinct sites" />
        <KpiCard label="Sev 1" value={currentSevBreakdown[0].count} color={SEV_COLORS[1]} subtitle="Critical" />
        <KpiCard label="Sev 2" value={currentSevBreakdown[1].count} color={SEV_COLORS[2]} subtitle="High" />
        <KpiCard label="Sev 3 + 4" value={currentSevBreakdown[2].count + currentSevBreakdown[3].count} color={SEV_COLORS[3]} subtitle="Medium + Low" />
        <KpiCard label="Not Reporting" value={nrpCount} color="#C026D3"
          subtitle={`${sites.length > 0 ? ((nrpCount / sites.length) * 100).toFixed(1) : 0}% of fleet`} />
        <KpiCard label="Fleet Health" value={kpis.avgHealthScore} color="#10B981" subtitle={`Grade ${kpis.fleetGrade} — DERIVED`} />
      </div>

      {/* Current-state severity breakdown — always available */}
      <div className="section-card">
        <h3>Current Severity Snapshot — <span style={{ color: '#10B981', fontSize: 12 }}>LIVE</span></h3>
        <p className="page-desc" style={{ marginBottom: 12 }}>
          Point-in-time count of sites at each severity level. Source: Incorta C&I Severity &amp; Cases Business View.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={currentSevBreakdown} barSize={60}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Sites']} />
            <Bar dataKey="count" name="Sites">
              {currentSevBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Granularity selector — only relevant for mock trend charts */}
      {!USE_LIVE && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Granularity:</span>
          {(['daily', 'weekly', 'monthly'] as const).map(g => (
            <button key={g} className={`filter-chip ${g === gran ? 'active' : ''}`}
              onClick={() => setGran(g)} style={g === gran ? { background: 'var(--enphase-orange)', color: '#fff', borderColor: 'var(--enphase-orange)' } : {}}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Severity trend */}
      {USE_LIVE ? (
        <UnavailableNotice
          title="Severity Trend Over Time"
          reason="The Incorta C&I Severity & Cases Business View returns current-state data only. It does not contain historical severity records. To enable this chart, a time-series or snapshot-history Business View is required."
        />
      ) : (
        <div className="section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3>Severity Trend ({gran})</h3>
            <span className="demo-label">Representative Data — illustrative only</span>
          </div>
          <p className="page-desc" style={{ marginBottom: 12 }}>
            Based on site creation dates as a proxy — not actual historical severity records.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockSevTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="sev1" name="Sev 1" stroke={SEV_COLORS[1]} fill={SEV_COLORS[1]} fillOpacity={0.3} stackId="1" />
              <Area type="monotone" dataKey="sev2" name="Sev 2" stroke={SEV_COLORS[2]} fill={SEV_COLORS[2]} fillOpacity={0.3} stackId="1" />
              <Area type="monotone" dataKey="sev3" name="Sev 3" stroke={SEV_COLORS[3]} fill={SEV_COLORS[3]} fillOpacity={0.3} stackId="1" />
              <Area type="monotone" dataKey="sev4" name="Sev 4" stroke={SEV_COLORS[4]} fill={SEV_COLORS[4]} fillOpacity={0.3} stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="chart-grid two-col">
        {/* Case trend */}
        {USE_LIVE ? (
          <UnavailableNotice
            title="Open Case Trend"
            reason="SFDC Case Business View not yet configured. Set INCORTA_CASE_DASHBOARD_ID and INCORTA_CASE_INSIGHT_ID in server .env to enable live case trend data."
          />
        ) : (
          <div className="section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3>Open Case Trend ({gran})</h3>
              <span className="demo-label">Representative</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mockCaseTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" name="Created" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="inProgress" name="In Progress" stroke="#E89B0C" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="backlog" name="Backlog" stroke="#E01B1B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Fleet health trend */}
        <UnavailableNotice
          title="Fleet Health Trend Over Time"
          reason={USE_LIVE
            ? "Fleet Health Score is DERIVED from current severity + status. No historical health records exist in the current source. A time-series snapshot store is required to enable this chart."
            : "Even in mock mode, a computed health trend over time would require historical health records which the mock data does not model accurately."
          }
        />
      </div>
    </div>
  );
}
