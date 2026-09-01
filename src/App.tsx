import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import {
  LayoutDashboard, Activity, FolderOpen, ListChecks, TrendingUp,
  RefreshCw, User, ChevronLeft, X,
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
        <span className="refresh-badge"><RefreshCw size={12} /> Updated just now</span>
        <User size={16} />
      </div>
    </header>
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
function KpiCard({ label, value, className = '', primary = false }: { label: string; value: string | number; className?: string; primary?: boolean }) {
  return (
    <div className={`kpi-card${primary ? ' primary' : ''}`}>
      <div className={`kpi-value ${className}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="kpi-label">{label}</div>
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

  return (
    <>
      {showSearch && <input className="table-search" placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} />}
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
  const nav = useNavigate();

  useEffect(() => {
    dataProvider.getKpis(filters).then(setKpis);
    dataProvider.getSeverityDistribution(filters).then(setSevDist);
    dataProvider.getSites(filters).then(setSites);
  }, [filters]);

  if (!kpis) return null;

  const sevBarData = sevDist.filter((d) => d.level !== null).map((d) => ({
    name: `Sev ${d.level}`, total: d.count, a: d.subcategoryA, b: d.subcategoryB, c: d.subcategoryC,
    fill: SEV_COLORS[d.level as number] ?? '#999',
  }));

  const statusCounts: Record<string, number> = {};
  sites.forEach((s) => { statusCounts[s.siteStatus] = (statusCounts[s.siteStatus] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] ?? '#999' }));

  return (
    <div className="page-content">
      <h2 className="page-title">Overview</h2>

      {/* Primary KPIs */}
      <div className="kpi-row">
        <KpiCard label={kpis.totalSites.label} value={kpis.totalSites.value} primary />
        <KpiCard label={kpis.pctSev123.label} value={kpis.pctSev123.value} className="orange" />
        <KpiCard label={kpis.countSev123.label} value={kpis.countSev123.value} className="orange" />
        <KpiCard label={kpis.sev123a.label} value={kpis.sev123a.value} className="sev1" />
        <KpiCard label={kpis.sev123b.label} value={kpis.sev123b.value} className="sev3" />
        <KpiCard label={kpis.sev123c.label} value={kpis.sev123c.value} />
        <KpiCard label={kpis.pctSev4.label} value={kpis.pctSev4.value} className="sev4" />
        <KpiCard label={kpis.countSev4.label} value={kpis.countSev4.value} className="sev4" />
      </div>

      {/* Percentage KPIs */}
      <div className="kpi-row">
        <KpiCard label={kpis.pctSev1.label} value={kpis.pctSev1.value} className="sev1" />
        <KpiCard label={kpis.pctSev2.label} value={kpis.pctSev2.value} className="sev2" />
        <KpiCard label={kpis.pctSev3.label} value={kpis.pctSev3.value} className="sev3" />
        <KpiCard label={kpis.pctSev4.label} value={kpis.pctSev4.value} className="sev4" />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="section-card">
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevBarData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {sevBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3>Severity Subcategory Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevBarData} margin={{ left: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="a" name="(a) Open, not In Progress" stackId="s" fill={SUB_COLORS.a} />
              <Bar dataKey="b" name="(b) Open, In Progress" stackId="s" fill={SUB_COLORS.b} />
              <Bar dataKey="c" name="(c) No open cases" stackId="s" fill={SUB_COLORS.c} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid">
        <div className="section-card">
          <h3>Site Status Distribution<span className="demo-label">DEMO</span></h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={{ strokeWidth: 1 }} style={{ fontSize: 10 }}>
                {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="section-card">
          <h3>Sites by Severity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
            {sevDist.filter((d) => d.level !== null).map((d) => (
              <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={sevBadgeClass(d.level)} style={{ width: 50, textAlign: 'center' }}>Sev {d.level}</span>
                <div style={{ flex: 1, background: '#E5E7EB', borderRadius: 4, height: 20, position: 'relative' }}>
                  <div style={{ width: `${Math.min((d.count / (sites.length || 1)) * 100 * 5, 100)}%`, height: '100%', background: SEV_COLORS[d.level as number], borderRadius: 4 }} />
                </div>
                <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{d.count}</span>
                <span style={{ color: '#6B7280', fontSize: 11, minWidth: 40 }}>{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Site Table */}
      <div className="section-card">
        <h3>C&I Sites</h3>
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
  const nav = useNavigate();

  useEffect(() => {
    dataProvider.getSites(filters).then(setSites);
    dataProvider.getKpis(filters).then(setKpis);
  }, [filters]);

  const statusCounts: Record<string, number> = {};
  const connCounts: Record<string, number> = {};
  sites.forEach((s) => {
    statusCounts[s.siteStatus] = (statusCounts[s.siteStatus] || 0) + 1;
    connCounts[s.connectionType] = (connCounts[s.connectionType] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] ?? '#999' }));
  const connData = Object.entries(connCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="page-content">
      <h2 className="page-title">Site Health</h2>
      {kpis && (
        <div className="kpi-row">
          <KpiCard label="Total Sites" value={kpis.totalSites.value} primary />
          <KpiCard label="Sites with Open Cases" value={kpis.sitesWithOpenCases.value} className="sev1" />
          <KpiCard label="Sites without Open Cases" value={kpis.sitesWithNoOpenCases.value} className="sev4" />
        </div>
      )}
      <div className="chart-grid">
        <div className="section-card">
          <h3>Status Distribution<span className="demo-label">DEMO</span></h3>
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
  const nav = useNavigate();

  useEffect(() => { dataProvider.getSites(filters).then(setSites); }, [filters]);

  const openCaseSites = sites.filter((s) => s.hasOpenCase);
  const noOpenCaseSites = sites.filter((s) => s.severity !== null && !s.hasOpenCase);

  return (
    <div className="page-content">
      <h2 className="page-title">Open Cases</h2>
      <div className="kpi-row">
        <KpiCard label="Sites with Open Cases" value={openCaseSites.length} className="sev1" primary />
        <KpiCard label="Severity Sites without Open Cases" value={noOpenCaseSites.length} className="sev4" />
      </div>

      <div className="section-card">
        <h3>C&I Sites & SFDC OPEN Cases Only</h3>
        <p className="section-subtitle">Sites that have at least one open SFDC case (site-level view)</p>
        <SiteTable sites={openCaseSites} onSiteClick={(id) => nav(`/site/${id}`)} />
      </div>

      <div className="section-card">
        <h3>C&I Sites & SFDC NO OPEN Cases</h3>
        <p className="section-subtitle">Severity sites without open cases — potential action list for proactive case creation</p>
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
  const nav = useNavigate();

  useEffect(() => { dataProvider.getCases(filters).then(setCases); }, [filters]);

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

  return (
    <div className="page-content">
      <h2 className="page-title">Case Tracker</h2>
      <div className="kpi-row">
        <KpiCard label="Total Cases" value={cases.length} primary />
      </div>
      <div className="section-card">
        <h3>C&I Sites Case Tracker</h3>
        <input className="table-search" placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <td>{c.caseNumber}</td>
                  <td>{c.siteId}</td>
                  <td><span className="site-link" onClick={() => nav(`/site/${c.siteId}`)}>{c.siteLink}</span></td>
                  <td title={c.siteName}>{c.siteName}</td>
                  <td><span className={statusBadgeClass(c.siteStatus)}>{c.siteStatus}</span></td>
                  <td>{c.lastIntervalEndDate}</td>
                  <td>{c.miProductSku}</td>
                  <td>{c.connectionType}</td>
                  <td>{c.caseStatus}</td>
                  <td><span className={sevBadgeClass(parseInt(c.severity) || null)}>{c.severity}</span></td>
                  <td>{c.caseCategory}</td>
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
      </div>
    </div>
  );
}

/* ---- HISTORICAL TRENDS ---- */
function HistoricalTrendsPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalSeverity[]>([]);
  const [selectedInstaller, setSelectedInstaller] = useState<string>('');
  const [installers, setInstallers] = useState<string[]>([]);

  useEffect(() => {
    dataProvider.getHistoricalSeverity().then((data) => {
      setHistoricalData(data);
      const ins = [...new Set(data.map((d) => d.installer))].sort();
      setInstallers(ins);
    });
  }, []);

  // Aggregate by date for trend chart
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
      .slice(-60) // show last 60 data points for readability
      .map(([date, vals]) => ({ date: date.slice(5), ...vals }));
  }, [historicalData, selectedInstaller]);

  // Table data: last 7 dates
  const tableData = useMemo(() => {
    const dates = [...new Set(historicalData.map((d) => d.date))].sort().slice(-7);
    const installerMap: Record<string, Record<string, { sev1: number; sev2: number; sev3: number; total: number }>> = {};
    historicalData.filter((d) => dates.includes(d.date)).forEach((d) => {
      if (!installerMap[d.installer]) installerMap[d.installer] = {};
      installerMap[d.installer][d.date] = { sev1: d.sev1, sev2: d.sev2, sev3: d.sev3, total: d.total };
    });
    return { dates, installerMap };
  }, [historicalData]);

  return (
    <div className="page-content">
      <h2 className="page-title">Historical Trends</h2>
      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>Data saved since 2025-05-27. Does NOT include Sev-4.</p>

      <div className="section-card">
        <h3>Severity Trend</h3>
        <div style={{ marginBottom: 8 }}>
          <select className="filter-select" value={selectedInstaller} onChange={(e) => setSelectedInstaller(e.target.value)}>
            <option value="">All Installers</option>
            {installers.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
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
        <h3>Historical Data per Installer</h3>
        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1F2937' }}>Installer</th>
                {tableData.dates.map((d) => (
                  <th key={d} colSpan={4} style={{ textAlign: 'center', borderLeft: '2px solid #374151' }}>{d}</th>
                ))}
              </tr>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1F2937' }} />
                {tableData.dates.map((d) => (
                  <React.Fragment key={`sub-${d}`}>
                    <th style={{ fontSize: 10 }}>S1</th>
                    <th style={{ fontSize: 10 }}>S2</th>
                    <th style={{ fontSize: 10 }}>S3</th>
                    <th style={{ fontSize: 10, borderRight: '1px solid #374151' }}>Tot</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableData.installerMap).slice(0, 30).map(([installer, dates]) => (
                <tr key={installer}>
                  <td style={{ position: 'sticky', left: 0, background: '#fff', fontWeight: 500, zIndex: 1 }}>{installer}</td>
                  {tableData.dates.map((d) => {
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
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Displaying {Object.keys(tableData.installerMap).length} installer(s) × {tableData.dates.length} date(s)</span>
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

  if (!site) return <div className="page-content"><p>Loading site...</p></div>;

  return (
    <div className="page-content">
      <div className="back-link" onClick={() => nav(-1)}>
        <ChevronLeft size={16} /> Back
      </div>
      <h2 className="page-title">Site Detail: {site.siteName}</h2>

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

      {cases.length > 0 && (
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
                    <td>{c.caseNumber}</td>
                    <td>{c.caseStatus}</td>
                    <td><span className={sevBadgeClass(parseInt(c.severity) || null)}>{c.severity}</span></td>
                    <td>{c.caseCategory}</td>
                    <td>{c.caseType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
