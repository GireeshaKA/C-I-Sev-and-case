import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import {
  LayoutDashboard, Activity, FolderOpen, ListChecks, TrendingUp,
  RefreshCw, User, ChevronLeft, X, AlertTriangle, Clock, Shield,
  Search, Filter,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { MockDataProvider } from './services/MockDataProvider';
import type { Site, SfdcCase, DashboardKpis, SeverityDistribution, HistoricalSeverity, DashboardFilters } from './types';
import './index.css';

const dataProvider = new MockDataProvider();

/* ---- FILTER CONTEXT ---- */
interface FilterCtx {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  clearFilters: () => void;
  filterOptions: Record<string, string[]>;
}
const FilterContext = createContext<FilterCtx>({
  filters: {},
  setFilters: () => {},
  clearFilters: () => {},
  filterOptions: {},
});

/* ---- SEVERITY COLORS ---- */
const SEV_COLORS: Record<number, string> = { 1: '#DC2626', 2: '#EA580C', 3: '#D97706', 4: '#2563EB' };
const SUB_COLORS = { a: '#EF4444', b: '#F59E0B', c: '#6B7280' };
const STATUS_COLORS: Record<string, string> = {
  Normal: '#16A34A',
  'Production Issue': '#D97706',
  'Microinverters Not Reporting': '#DC2626',
  'Envoy Not Reporting': '#EA580C',
  'Meter Issue': '#7C3AED',
};

/* ---- SEVERITY LABELS ---- */
const SEV_LABELS: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };

/* ---- HELPERS ---- */
function sevBadgeClass(sev: number | null): string {
  if (sev === null) return 'sev-badge sev-none';
  return `sev-badge sev-${sev}`;
}
function statusBadgeClass(status: string): string {
  if (status === 'Normal') return 'status-badge status-normal';
  if (status.includes('Not Reporting')) return 'status-badge status-error';
  return 'status-badge status-issue';
}
function caseStatusBadgeClass(status: string): string {
  if (status === 'New') return 'case-status-badge case-status-new';
  return 'case-status-badge case-status-progress';
}
function formatSev(sev: number | null, sub: string | null): string {
  if (sev === null) return '—';
  if (sub) return `${sev}(${sub})`;
  return String(sev);
}
/* ---- PAGINATION HOOK ---- */
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [items.length]);
  const totalPages = Math.ceil(items.length / pageSize);
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);
  return { page, setPage, totalPages, pageItems, total: items.length };
}

/* ---- SORT HOOK ---- */
function useSort<T>(items: T[], defaultKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const toggle = useCallback((key: keyof T) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey]);
  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);
  return { sorted, toggle, sortKey, sortDir };
}

/* ---- SIDEBAR ---- */
function Sidebar() {
  const links = [
    { to: '/', icon: <LayoutDashboard />, label: 'Overview' },
    { to: '/site-health', icon: <Activity />, label: 'Site Health' },
    { to: '/open-cases', icon: <FolderOpen />, label: 'Open Cases' },
    { to: '/case-tracker', icon: <ListChecks />, label: 'Case Tracker' },
    { to: '/historical', icon: <TrendingUp />, label: 'Historical Trends' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span>ENPHASE</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>
            {l.icon}<span className="nav-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

/* ---- HEADER ---- */
function Header() {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <h1>C&I – Severity and Cases</h1>
        <span className="tagline">Unified Site Health, Severity & Case Intelligence</span>
      </div>
      <div className="top-header-right">
        <span className="data-source-indicator">
          <span className="data-source-dot" />
          Data: Representative &middot; Live API: Pending Access
        </span>
        <User size={16} />
      </div>
    </header>
  );
}

/* ---- EMPTY STATE ---- */
function EmptyState({ message = 'No data matches current filters', icon }: { message?: string; icon?: React.ReactNode }) {
  return (
    <div className="empty-state">
      {icon || <Filter size={32} />}
      <p>{message}</p>
    </div>
  );
}

/* ---- LOADING STATE ---- */
function LoadingState() {
  return (
    <div className="loading-state">
      <RefreshCw size={20} className="spin" />
      <p>Loading...</p>
    </div>
  );
}

/* ---- FILTER BAR ---- */
function FilterBar() {
  const { filters, setFilters, clearFilters, filterOptions } = useContext(FilterContext);
  const hasFilters = (filters.connectionType?.length ?? 0) > 0
    || (filters.siteStage?.length ?? 0) > 0
    || (filters.miProductSku?.length ?? 0) > 0;

  const handleChange = (field: keyof DashboardFilters, value: string) => {
    if (!value) {
      const next = { ...filters };
      delete next[field];
      setFilters(next);
    } else {
      setFilters({ ...filters, [field]: [value] as never });
    }
  };

  const chips: { label: string; field: keyof DashboardFilters; value: string }[] = [];
  if (filters.connectionType?.length) filters.connectionType.forEach((v) => chips.push({ label: `Connection: ${v}`, field: 'connectionType', value: v }));
  if (filters.siteStage?.length) filters.siteStage.forEach((v) => chips.push({ label: `Stage: ${v}`, field: 'siteStage', value: v }));
  if (filters.miProductSku?.length) filters.miProductSku.forEach((v) => chips.push({ label: `SKU: ${v}`, field: 'miProductSku', value: v }));

  const removeChip = (field: keyof DashboardFilters, value: string) => {
    const current = (filters[field] as string[] | undefined) ?? [];
    const next = current.filter((v: string) => v !== value);
    if (next.length === 0) {
      const f = { ...filters };
      delete f[field];
      setFilters(f);
    } else {
      setFilters({ ...filters, [field]: next as never });
    }
  };

  return (
    <div className="filter-bar">
      <label>Filters</label>
      <select className="filter-select" value={filters.connectionType?.[0] ?? ''} onChange={(e) => handleChange('connectionType', e.target.value)}>
        <option value="">Connection Type</option>
        {(filterOptions['connectionType'] ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <select className="filter-select" value={filters.siteStage?.[0] ?? ''} onChange={(e) => handleChange('siteStage', e.target.value)}>
        <option value="">Site Stage</option>
        {(filterOptions['siteStage'] ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <select className="filter-select" value={filters.miProductSku?.[0] ?? ''} onChange={(e) => handleChange('miProductSku', e.target.value)}>
        <option value="">SKU</option>
        {(filterOptions['miProductSku'] ?? []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      {chips.map((c, i) => (
        <span key={i} className="filter-chip">{c.label} <button onClick={() => removeChip(c.field, c.value)}><X size={12} /></button></span>
      ))}
      {hasFilters && <button className="filter-clear" onClick={clearFilters}>Clear All</button>}
    </div>
  );
}

/* ---- KPI CARD ---- */
function KpiCard({ label, value, className = '', primary = false, icon, subtitle }: {
  label: string; value: string | number; className?: string; primary?: boolean;
  icon?: React.ReactNode; subtitle?: string;
}) {
  return (
    <div className={`kpi-card${primary ? ' primary' : ''}`}>
      <div className="kpi-card-header">
        <div className={`kpi-value ${className}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>
      <div className="kpi-label">{label}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}

/* ---- SITE TABLE ---- */
function SiteTable({ sites, showSearch = true, onSiteClick }: { sites: Site[]; showSearch?: boolean; onSiteClick?: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return sites;
    const t = search.toLowerCase();
    return sites.filter((s) => s.siteName.toLowerCase().includes(t) || s.siteId.includes(t) || s.installerName.toLowerCase().includes(t));
  }, [sites, search]);
  const { sorted, toggle, sortKey, sortDir } = useSort(filtered, 'siteId');
  const { page, setPage, totalPages, pageItems, total } = usePagination(sorted, 20);
  const arrow = (key: keyof Site) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (sites.length === 0) return <EmptyState message="No sites match current filters" />;

  return (
    <>
      {showSearch && (
        <div className="table-search-wrapper">
          <Search size={14} className="table-search-icon" />
          <input className="table-search" placeholder="Search by site name, ID, or installer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}
      <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggle('siteId')}>Site Id{arrow('siteId')}</th>
              <th onClick={() => toggle('siteName')}>Site Name{arrow('siteName')}</th>
              <th onClick={() => toggle('siteStatus')}>Status{arrow('siteStatus')}</th>
              <th onClick={() => toggle('severity')}>Severity{arrow('severity')}</th>
              <th onClick={() => toggle('lastIntervalEndDate')}>Last Interval (PST){arrow('lastIntervalEndDate')}</th>
              <th onClick={() => toggle('miProductSku')}>MI Product SKU{arrow('miProductSku')}</th>
              <th onClick={() => toggle('connectionType')}>Connection{arrow('connectionType')}</th>
              <th onClick={() => toggle('microCount')}>Micros{arrow('microCount')}</th>
              <th onClick={() => toggle('envoyCount')}>Envoys{arrow('envoyCount')}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s) => (
              <tr key={s.siteId}>
                <td><span className="site-link" onClick={() => onSiteClick?.(s.siteId)}>{s.siteId}</span></td>
                <td title={s.siteName}>{s.siteName}</td>
                <td><span className={statusBadgeClass(s.siteStatus)}>{s.siteStatus}</span></td>
                <td><span className={sevBadgeClass(s.severity)}>{formatSev(s.severity, s.severitySubcategory)}</span></td>
                <td>{s.lastIntervalEndDate}</td>
                <td>{s.miProductSku}</td>
                <td>{s.connectionType}</td>
                <td>{s.microCount}</td>
                <td>{s.envoyCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Displaying {total} row(s)</span>
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page + 1} / {totalPages || 1}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </>
  );
}

/* =============== PAGES =============== */

/* ---- OVERVIEW ---- */
function OverviewPage() {
  const { filters } = useContext(FilterContext);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [sevDist, setSevDist] = useState<SeverityDistribution[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [cases, setCases] = useState<SfdcCase[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dataProvider.getKpis(filters),
      dataProvider.getSeverityDistribution(filters),
      dataProvider.getSites(filters),
      dataProvider.getCases(filters),
    ]).then(([k, sd, s, c]) => {
      setKpis(k); setSevDist(sd); setSites(s); setCases(c); setLoading(false);
    });
  }, [filters]);

  if (loading || !kpis) return <div className="page-content"><LoadingState /></div>;

  const sevBarData = sevDist.filter((d) => d.level !== null).map((d) => ({
    name: `Sev ${d.level} · ${SEV_LABELS[d.level as number]}`,
    total: d.count, a: d.subcategoryA, b: d.subcategoryB, c: d.subcategoryC,
    fill: SEV_COLORS[d.level as number] ?? '#999',
  }));

  const statusCounts: Record<string, number> = {};
  sites.forEach((s) => { statusCounts[s.siteStatus] = (statusCounts[s.siteStatus] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] ?? '#999' }));

  const criticalSites = sites.filter((s) => s.severity === 1);
  const highSevSites = sites.filter((s) => s.severity === 2);
  const notReportingSites = sites.filter((s) => s.siteStatus.includes('Not Reporting'));
  const openCaseCount = cases.length;
  const newCases = cases.filter((c) => c.caseStatus === 'New');

  return (
    <div className="page-content">
      <h2 className="page-title">Overview</h2>

      {/* PRIMARY KPIs — executive summary */}
      <div className="kpi-group">
        <div className="kpi-group-label">Executive Summary</div>
        <div className="kpi-row">
          <KpiCard label="Total C&I Sites" value={kpis.totalSites.value} primary icon={<LayoutDashboard size={18} />} />
          <KpiCard label="Total Open Cases" value={openCaseCount} className="orange" primary icon={<FolderOpen size={18} />} />
          <KpiCard label={kpis.pctSev123.label} value={kpis.pctSev123.value} className="orange" primary icon={<Shield size={18} />}
            subtitle={`${kpis.countSev123.value} sites in Critical/High/Medium`} />
          <KpiCard label="Sites with Open Cases" value={kpis.sitesWithOpenCases.value} className="sev1"
            icon={<AlertTriangle size={18} />} />
        </div>
      </div>

      {/* WHAT NEEDS ATTENTION */}
      <div className="section-card attention-section">
        <h3><AlertTriangle size={16} className="inline-icon" /> What Needs Attention</h3>
        <div className="attention-grid">
          <div className="attention-item attention-critical" onClick={() => nav('/site-health')}>
            <div className="attention-count">{criticalSites.length}</div>
            <div className="attention-label">Critical Sites (Sev 1)</div>
            <div className="attention-desc">Immediate investigation needed</div>
          </div>
          <div className="attention-item attention-high" onClick={() => nav('/site-health')}>
            <div className="attention-count">{highSevSites.length}</div>
            <div className="attention-label">High Severity Sites (Sev 2)</div>
            <div className="attention-desc">Escalation candidates</div>
          </div>
          <div className="attention-item attention-new" onClick={() => nav('/case-tracker')}>
            <div className="attention-count">{newCases.length}</div>
            <div className="attention-label">New Cases</div>
            <div className="attention-desc">Awaiting triage</div>
          </div>
          <div className="attention-item attention-reporting" onClick={() => nav('/site-health')}>
            <div className="attention-count">{notReportingSites.length}</div>
            <div className="attention-label">Not Reporting</div>
            <div className="attention-desc">Envoy/Microinverter communication lost</div>
          </div>
        </div>
      </div>

      {/* SECONDARY KPIs — subcategory breakdown */}
      <div className="kpi-group">
        <div className="kpi-group-label">Severity 1/2/3 Subcategories</div>
        <div className="kpi-row">
          <KpiCard label={kpis.sev123a.label} value={kpis.sev123a.value} className="sev1" />
          <KpiCard label={kpis.sev123b.label} value={kpis.sev123b.value} className="sev3" />
          <KpiCard label={kpis.sev123c.label} value={kpis.sev123c.value} />
          <KpiCard label={kpis.pctSev4.label} value={kpis.pctSev4.value} className="sev4" />
          <KpiCard label={kpis.countSev4.label} value={kpis.countSev4.value} className="sev4" />
        </div>
      </div>

      {/* Per-Level Breakdown with severity labels */}
      <div className="kpi-group">
        <div className="kpi-group-label">Per-Level Breakdown</div>
        <div className="kpi-row kpi-row-compact">
          <KpiCard label="Sev 1 · Critical" value={kpis.pctSev1.value} className="sev1" />
          <KpiCard label="Sev 2 · High" value={kpis.pctSev2.value} className="sev2" />
          <KpiCard label="Sev 3 · Medium" value={kpis.pctSev3.value} className="sev3" />
          <KpiCard label="Sev 4 · Low" value={kpis.pctSev4.value} className="sev4" />
        </div>
      </div>

      {/* Severity Breakdown Section — matches Incorta layout */}
      <div className="section-card">
        <h3>Severity Breakdown</h3>
        <div className="sev-breakdown-grid">
          {sevDist.filter((d) => d.level !== null).map((d) => (
            <div key={d.level} className="sev-breakdown-item">
              <div className="sev-breakdown-header">
                <div>
                  <span className={sevBadgeClass(d.level)}>Sev {d.level}</span>
                  <span className="sev-label-text">{SEV_LABELS[d.level as number]}</span>
                </div>
                <span className="sev-breakdown-total">{d.count}</span>
              </div>
              <div className="sev-breakdown-subs">
                <span className="sev-sub"><strong>{d.subcategoryA}</strong> <small>(a)</small></span>
                <span className="sev-sub"><strong>{d.subcategoryB}</strong> <small>(b)</small></span>
                <span className="sev-sub"><strong>{d.subcategoryC}</strong> <small>(c)</small></span>
              </div>
              <div className="sev-breakdown-bar">
                <div style={{ width: `${Math.min((d.count / (sites.length || 1)) * 100 * 5, 100)}%`, background: SEV_COLORS[d.level as number] }} />
              </div>
            </div>
          ))}
        </div>
        <div className="sev-breakdown-legend">
          <span>(a) Open case, not In Progress</span>
          <span>(b) Open case, In Progress</span>
          <span>(c) No open cases</span>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="section-card">
          <h3>Severity Subcategory Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevBarData} margin={{ left: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="a" name="(a) Open, not In Progress" stackId="s" fill={SUB_COLORS.a} />
              <Bar dataKey="b" name="(b) Open, In Progress" stackId="s" fill={SUB_COLORS.b} />
              <Bar dataKey="c" name="(c) No open cases" stackId="s" fill={SUB_COLORS.c} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Site Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }} style={{ fontSize: 10 }}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Site Table */}
      <div className="section-card">
        <h3>C&I Sites with Severity</h3>
        <SiteTable sites={sites.filter((s) => s.severity !== null)} onSiteClick={(id) => nav(`/site/${id}`)} />
      </div>
    </div>
  );
}

/* ---- SITE HEALTH ---- */
function SiteHealthPage() {
  const { filters } = useContext(FilterContext);
  const [sites, setSites] = useState<Site[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dataProvider.getSites(filters),
      dataProvider.getKpis(filters),
    ]).then(([s, k]) => { setSites(s); setKpis(k); setLoading(false); });
  }, [filters]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const statusCounts: Record<string, number> = {};
  const connCounts: Record<string, number> = {};
  const sevCounts: Record<string, number> = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'None': 0 };
  sites.forEach((s) => {
    statusCounts[s.siteStatus] = (statusCounts[s.siteStatus] || 0) + 1;
    connCounts[s.connectionType] = (connCounts[s.connectionType] || 0) + 1;
    const label = s.severity ? SEV_LABELS[s.severity] : 'None';
    sevCounts[label] = (sevCounts[label] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] ?? '#999' }));
  const connData = Object.entries(connCounts).map(([name, value]) => ({ name, value }));

  const healthyCount = statusCounts['Normal'] || 0;
  const warningCount = (statusCounts['Production Issue'] || 0) + (statusCounts['Meter Issue'] || 0);
  const criticalCount = (statusCounts['Microinverters Not Reporting'] || 0) + (statusCounts['Envoy Not Reporting'] || 0);

  return (
    <div className="page-content">
      <h2 className="page-title">Site Health</h2>
      <p className="page-description">Investigate site health, connection status, and severity distribution across the fleet.</p>

      {/* Health Summary */}
      <div className="kpi-row">
        {kpis && <KpiCard label="Total Sites" value={kpis.totalSites.value} primary icon={<LayoutDashboard size={18} />} />}
        <KpiCard label="Healthy" value={healthyCount} className="green" icon={<Activity size={18} />} subtitle="Normal status" />
        <KpiCard label="Warning" value={warningCount} className="sev3" icon={<AlertTriangle size={18} />} subtitle="Production/Meter issues" />
        <KpiCard label="Critical" value={criticalCount} className="sev1" icon={<Shield size={18} />} subtitle="Not reporting" />
      </div>

      {/* Severity Distribution Summary */}
      <div className="section-card">
        <h3>Severity Distribution</h3>
        <div className="health-severity-bar">
          {Object.entries(sevCounts).filter(([, v]) => v > 0).map(([label, count]) => {
            const pct = sites.length > 0 ? (count / sites.length * 100) : 0;
            const color = label === 'Critical' ? 'var(--sev1)' : label === 'High' ? 'var(--sev2)' : label === 'Medium' ? 'var(--sev3)' : label === 'Low' ? 'var(--sev4)' : 'var(--text-tertiary)';
            return (
              <div key={label} className="health-sev-segment" style={{ width: `${Math.max(pct, 2)}%`, background: color }} title={`${label}: ${count} (${pct.toFixed(1)}%)`}>
                {pct > 5 && <span>{count}</span>}
              </div>
            );
          })}
        </div>
        <div className="health-severity-legend">
          {Object.entries(sevCounts).filter(([, v]) => v > 0).map(([label, count]) => {
            const color = label === 'Critical' ? 'var(--sev1)' : label === 'High' ? 'var(--sev2)' : label === 'Medium' ? 'var(--sev3)' : label === 'Low' ? 'var(--sev4)' : 'var(--text-tertiary)';
            return <span key={label} className="health-legend-item"><span className="health-legend-dot" style={{ background: color }} />{label}: {count}</span>;
          })}
        </div>
      </div>

      <div className="chart-grid">
        <div className="section-card">
          <h3>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="section-card">
          <h3>Connection Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={connData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: 11 }}>
                {connData.map((_, i) => <Cell key={i} fill={['#F37421', '#2563EB', '#16A34A'][i % 3]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="section-card">
        <h3>All Sites</h3>
        <SiteTable sites={sites} onSiteClick={(id) => nav(`/site/${id}`)} />
      </div>
    </div>
  );
}

/* ---- OPEN CASES ---- */
function OpenCasesPage() {
  const { filters } = useContext(FilterContext);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    dataProvider.getSites(filters).then((s) => { setSites(s); setLoading(false); });
  }, [filters]);

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const openCaseSites = sites.filter((s) => s.hasOpenCase);
  const noOpenCaseSites = sites.filter((s) => s.severity !== null && !s.hasOpenCase);

  return (
    <div className="page-content">
      <h2 className="page-title">Open Cases — Site-Level View</h2>
      <p className="page-description">This page shows <strong>sites</strong> grouped by whether they have open SFDC cases. For individual case records, see <span className="site-link" onClick={() => nav('/case-tracker')}>Case Tracker</span>.</p>

      <div className="kpi-row" style={{ marginTop: 12 }}>
        <KpiCard label="Sites with SFDC Open Cases" value={openCaseSites.length} className="sev1" primary />
        <KpiCard label="Severity Sites — No Open Cases" value={noOpenCaseSites.length} className="sev4" primary />
      </div>

      <div className="section-card">
        <h3>C&I Sites & SFDC OPEN Cases Only</h3>
        <p className="section-subtitle">Each row is a <strong>site</strong> (not a case). These {openCaseSites.length} sites have at least one open SFDC case.</p>
        <SiteTable sites={openCaseSites} onSiteClick={(id) => nav(`/site/${id}`)} />
      </div>

      <div className="section-card">
        <h3>C&I Sites & SFDC NO OPEN Cases</h3>
        <p className="section-subtitle">Severity sites with no open SFDC cases. These {noOpenCaseSites.length} sites may need proactive case creation.</p>
        <SiteTable sites={noOpenCaseSites} onSiteClick={(id) => nav(`/site/${id}`)} />
      </div>
    </div>
  );
}

/* ---- CASE TRACKER ---- */
function CaseTrackerPage() {
  const { filters } = useContext(FilterContext);
  const [cases, setCases] = useState<SfdcCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    dataProvider.getCases(filters).then((c) => { setCases(c); setLoading(false); });
  }, [filters]);

  const filtered = useMemo(() => {
    if (!search) return cases;
    const t = search.toLowerCase();
    return cases.filter((c) =>
      c.siteName.toLowerCase().includes(t) || c.siteId.includes(t) || c.caseNumber.includes(t)
    );
  }, [cases, search]);

  const { sorted, toggle, sortKey, sortDir } = useSort(filtered, 'caseNumber');
  const { page, setPage, totalPages, pageItems, total } = usePagination(sorted, 25);
  const arrow = (key: keyof SfdcCase) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const newCount = cases.filter((c) => c.caseStatus === 'New').length;
  const inProgressCount = cases.filter((c) => c.caseStatus === 'Case - In Progress').length;
  const uniqueSites = new Set(cases.map((c) => c.siteId)).size;

  return (
    <div className="page-content">
      <h2 className="page-title">Case Tracker — Case-Level Records</h2>
      <p className="page-description">Each row is an individual <strong>SFDC case</strong>. For site-level grouping, see <span className="site-link" onClick={() => nav('/open-cases')}>Open Cases</span>.</p>
      <div className="kpi-row" style={{ marginTop: 12 }}>
        <KpiCard label="Total Case Records" value={cases.length} primary icon={<ListChecks size={18} />} />
        <KpiCard label="New Cases" value={newCount} className="sev1" icon={<AlertTriangle size={18} />} subtitle="Awaiting triage" />
        <KpiCard label="In Progress" value={inProgressCount} className="sev3" icon={<Clock size={18} />} />
        <KpiCard label="Affected Sites" value={uniqueSites} subtitle={`${(uniqueSites / Math.max(cases.length, 1) * 100).toFixed(0)}% unique`} />
      </div>
      <div className="section-card">
        <h3>C&I Sites Case Tracker</h3>
        <div className="table-search-wrapper">
          <Search size={14} className="table-search-icon" />
          <input className="table-search" placeholder="Search by case number, site name, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? <EmptyState message="No cases match the search criteria" /> : (
          <>
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => toggle('caseNumber')}>Case Number{arrow('caseNumber')}</th>
                    <th onClick={() => toggle('siteId')}>Site Id{arrow('siteId')}</th>
                    <th>Site Link</th>
                    <th onClick={() => toggle('siteName')}>Site Name{arrow('siteName')}</th>
                    <th onClick={() => toggle('siteStatus')}>Site Status{arrow('siteStatus')}</th>
                    <th onClick={() => toggle('lastIntervalEndDate')}>Last Interval (PST){arrow('lastIntervalEndDate')}</th>
                    <th onClick={() => toggle('miProductSku')}>MI Product SKU{arrow('miProductSku')}</th>
                    <th onClick={() => toggle('connectionType')}>Connection{arrow('connectionType')}</th>
                    <th onClick={() => toggle('caseStatus')}>Case Status{arrow('caseStatus')}</th>
                    <th onClick={() => toggle('severity')}>Severity{arrow('severity')}</th>
                    <th onClick={() => toggle('caseCategory')}>Category{arrow('caseCategory')}</th>
                    <th onClick={() => toggle('caseType')}>Case Type{arrow('caseType')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c, i) => (
                    <tr key={`${c.caseNumber}-${i}`}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{c.caseNumber}</span></td>
                      <td>{c.siteId}</td>
                      <td><span className="site-link" onClick={() => nav(`/site/${c.siteId}`)}>{c.siteLink}</span></td>
                      <td title={c.siteName}>{c.siteName}</td>
                      <td><span className={statusBadgeClass(c.siteStatus)}>{c.siteStatus}</span></td>
                      <td>{c.lastIntervalEndDate}</td>
                      <td>{c.miProductSku}</td>
                      <td>{c.connectionType}</td>
                      <td><span className={caseStatusBadgeClass(c.caseStatus)}>{c.caseStatus}</span></td>
                      <td><span className={sevBadgeClass(parseInt(c.severity) || null)}>{c.severity}</span></td>
                      <td><span className="category-chip">{c.caseCategory}</span></td>
                      <td>{c.caseType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Displaying {total} row(s)</span>
              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
                <span>{page + 1} / {totalPages || 1}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- HISTORICAL TRENDS ---- */
function HistoricalTrendsPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalSeverity[]>([]);
  const [selectedInstaller, setSelectedInstaller] = useState<string>('');
  const [installers, setInstallers] = useState<string[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [tableDatePage, setTableDatePage] = useState(0);
  const DATES_PER_PAGE = 7;

  useEffect(() => {
    dataProvider.getHistoricalSeverity().then((data) => {
      setHistoricalData(data);
      const ins = [...new Set(data.map((d) => d.installer))].sort();
      setInstallers(ins);
      const dates = [...new Set(data.map((d) => d.date))].sort();
      setAllDates(dates);
      setTableDatePage(Math.max(0, Math.ceil(dates.length / DATES_PER_PAGE) - 1));
    });
  }, []);

  const trendData = useMemo(() => {
    const filtered = selectedInstaller ? historicalData.filter((d) => d.installer === selectedInstaller) : historicalData;
    const byDate: Record<string, { sev1: number; sev2: number; sev3: number; total: number }> = {};
    filtered.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = { sev1: 0, sev2: 0, sev3: 0, total: 0 };
      byDate[d.date].sev1 += d.sev1;
      byDate[d.date].sev2 += d.sev2;
      byDate[d.date].sev3 += d.sev3;
      byDate[d.date].total += d.total;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-90)
      .map(([date, vals]) => ({ date: date.slice(5), ...vals }));
  }, [historicalData, selectedInstaller]);

  const tableDates = useMemo(() => {
    const start = tableDatePage * DATES_PER_PAGE;
    return allDates.slice(start, start + DATES_PER_PAGE);
  }, [allDates, tableDatePage]);

  const totalDatePages = Math.ceil(allDates.length / DATES_PER_PAGE);

  const tableInstallers = useMemo(() => {
    const filtered = selectedInstaller
      ? historicalData.filter((d) => d.installer === selectedInstaller && tableDates.includes(d.date))
      : historicalData.filter((d) => tableDates.includes(d.date));
    const map: Record<string, Record<string, { sev1: number; sev2: number; sev3: number; total: number }>> = {};
    filtered.forEach((d) => {
      if (!map[d.installer]) map[d.installer] = {};
      map[d.installer][d.date] = { sev1: d.sev1, sev2: d.sev2, sev3: d.sev3, total: d.total };
    });
    return map;
  }, [historicalData, tableDates, selectedInstaller]);

  const totalRow = useMemo(() => {
    const totals: Record<string, { sev1: number; sev2: number; sev3: number; total: number }> = {};
    tableDates.forEach((d) => { totals[d] = { sev1: 0, sev2: 0, sev3: 0, total: 0 }; });
    Object.values(tableInstallers).forEach((dates) => {
      tableDates.forEach((d) => {
        const v = dates[d];
        if (v) { totals[d].sev1 += v.sev1; totals[d].sev2 += v.sev2; totals[d].sev3 += v.sev3; totals[d].total += v.total; }
      });
    });
    return totals;
  }, [tableInstallers, tableDates]);

  return (
    <div className="page-content">
      <h2 className="page-title">Historical Trends</h2>
      <p className="page-description">Historical Data per Installer (saved since 2025-05-27). Does <strong>not</strong> include Sev-4.</p>

      <div className="section-card">
        <h3>Severity Trend</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <select className="filter-select" value={selectedInstaller} onChange={(e) => setSelectedInstaller(e.target.value)}>
            <option value="">All Installers ({installers.length})</option>
            {installers.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(trendData.length / 15))} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="sev1" name="Sev-1" stroke="#DC2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sev2" name="Sev-2" stroke="#EA580C" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sev3" name="Sev-3" stroke="#D97706" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#111827" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-card">
        <h3>Historical Data per Installer<span className="demo-label">MOCK</span></h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {allDates.length} date(s) total &middot; {Object.keys(tableInstallers).length} installer(s) &middot; Showing dates {tableDatePage * DATES_PER_PAGE + 1}–{Math.min((tableDatePage + 1) * DATES_PER_PAGE, allDates.length)} of {allDates.length}
          </span>
          <div className="pagination">
            <button disabled={tableDatePage === 0} onClick={() => setTableDatePage(0)}>First</button>
            <button disabled={tableDatePage === 0} onClick={() => setTableDatePage(tableDatePage - 1)}>Prev</button>
            <span>{tableDatePage + 1} / {totalDatePages || 1}</span>
            <button disabled={tableDatePage >= totalDatePages - 1} onClick={() => setTableDatePage(tableDatePage + 1)}>Next</button>
            <button disabled={tableDatePage >= totalDatePages - 1} onClick={() => setTableDatePage(totalDatePages - 1)}>Last</button>
          </div>
        </div>
        <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1F2937', minWidth: 180 }}>Installer</th>
                {tableDates.map((d) => (
                  <th key={d} colSpan={4} style={{ textAlign: 'center', borderLeft: '2px solid #374151' }}>{d}</th>
                ))}
              </tr>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1F2937', minWidth: 180 }} />
                {tableDates.map((d) => (
                  <React.Fragment key={`sub-${d}`}>
                    <th style={{ fontSize: 10 }}>Sev-1</th>
                    <th style={{ fontSize: 10 }}>Sev-2</th>
                    <th style={{ fontSize: 10 }}>Sev-3</th>
                    <th style={{ fontSize: 10, borderRight: '1px solid #374151' }}>Total</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableInstallers).map(([installer, dates]) => (
                <tr key={installer}>
                  <td style={{ position: 'sticky', left: 0, background: '#fff', fontWeight: 500, zIndex: 1, minWidth: 180 }}>{installer}</td>
                  {tableDates.map((d) => {
                    const v = dates[d] ?? { sev1: 0, sev2: 0, sev3: 0, total: 0 };
                    return (
                      <React.Fragment key={d}>
                        <td>{v.sev1}</td>
                        <td>{v.sev2}</td>
                        <td>{v.sev3}</td>
                        <td style={{ fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>{v.total}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #1F2937', fontWeight: 700, background: '#F3F4F6' }}>
                <td style={{ position: 'sticky', left: 0, background: '#F3F4F6', fontWeight: 700, zIndex: 1, minWidth: 180 }}>TOTAL</td>
                {tableDates.map((d) => {
                  const v = totalRow[d] ?? { sev1: 0, sev2: 0, sev3: 0, total: 0 };
                  return (
                    <React.Fragment key={`tot-${d}`}>
                      <td>{v.sev1}</td>
                      <td>{v.sev2}</td>
                      <td>{v.sev3}</td>
                      <td style={{ borderRight: '1px solid #E5E7EB' }}>{v.total}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Displaying {Object.keys(tableInstallers).length} installer(s) × {tableDates.length} date(s)</span>
          <div className="pagination">
            <button disabled={tableDatePage === 0} onClick={() => setTableDatePage(tableDatePage - 1)}>← Older dates</button>
            <span>Page {tableDatePage + 1} of {totalDatePages || 1}</span>
            <button disabled={tableDatePage >= totalDatePages - 1} onClick={() => setTableDatePage(tableDatePage + 1)}>Newer dates →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- SITE DETAIL ---- */
function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [cases, setCases] = useState<SfdcCase[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    if (siteId) {
      dataProvider.getSiteById(siteId).then(setSite);
      dataProvider.getCasesBySiteId(siteId).then(setCases);
    }
  }, [siteId]);

  if (!site) return <div className="page-content"><LoadingState /></div>;

  return (
    <div className="page-content">
      <div className="back-link" onClick={() => nav(-1)}>
        <ChevronLeft size={16} /> Back
      </div>
      <div className="detail-header">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Site Detail: {site.siteName}</h2>
        <span className={sevBadgeClass(site.severity)}>{formatSev(site.severity, site.severitySubcategory)}</span>
        <span className={statusBadgeClass(site.siteStatus)}>{site.siteStatus}</span>
        {site.hasOpenCase && <span className="case-status-badge case-status-new">Has Open Cases</span>}
      </div>

      <div className="section-card">
        <div className="detail-grid">
          {[
            ['Site Id', site.siteId],
            ['Site Name', site.siteName],
            ['Site Stage', site.siteStage],
            ['Site Status', site.siteStatus],
            ['Severity', formatSev(site.severity, site.severitySubcategory)],
            ['Last Interval End Date', site.lastIntervalEndDate],
            ['MI Product SKU', site.miProductSku],
            ['Connection Type', site.connectionType],
            ['Envoy Type', site.envoyType],
            ['Micro Count', String(site.microCount)],
            ['Envoy Count', String(site.envoyCount)],
            ['Installer', site.installerName],
            ['State', site.state],
            ['Country', site.country],
          ].map(([lbl, val]) => (
            <div className="detail-field" key={lbl}>
              <label>{lbl}</label>
              <div className="detail-value">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {cases.length > 0 ? (
        <div className="section-card">
          <h3>Associated Cases ({cases.length})</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Case Status</th>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <tr key={i}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{c.caseNumber}</span></td>
                    <td><span className={caseStatusBadgeClass(c.caseStatus)}>{c.caseStatus}</span></td>
                    <td><span className={sevBadgeClass(parseInt(c.severity) || null)}>{c.severity}</span></td>
                    <td><span className="category-chip">{c.caseCategory}</span></td>
                    <td>{c.caseType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="section-card">
          <h3>Associated Cases</h3>
          <EmptyState message="No cases associated with this site" icon={<FolderOpen size={32} />} />
        </div>
      )}
    </div>
  );
}

/* ---- APP ---- */
function AppContent() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    Promise.all([
      dataProvider.getFilterOptions('connectionType'),
      dataProvider.getFilterOptions('siteStage'),
      dataProvider.getFilterOptions('miProductSku'),
    ]).then(([conn, stage, sku]) => {
      setFilterOptions({ connectionType: conn, siteStage: stage, miProductSku: sku });
    });
  }, []);

  const clearFilters = () => setFilters({});

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters, filterOptions }}>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <FilterBar />
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/site-health" element={<SiteHealthPage />} />
            <Route path="/open-cases" element={<OpenCasesPage />} />
            <Route path="/case-tracker" element={<CaseTrackerPage />} />
            <Route path="/historical" element={<HistoricalTrendsPage />} />
            <Route path="/site/:siteId" element={<SiteDetailPage />} />
          </Routes>
        </div>
      </div>
    </FilterContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
