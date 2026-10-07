import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Activity, User, AlertTriangle, Shield,
  Search, Filter, Cpu, Zap, MapPin, Users, X, RefreshCw, FolderOpen,
  Moon, Sun, ClipboardList, TrendingUp, Crosshair, ShieldCheck,
} from 'lucide-react';
import { MockDataProvider } from './services/MockDataProvider';
import { BackendDataProvider, type DataSourceInfo } from './services/BackendDataProvider';
import { healthColor, healthGrade } from './services/FleetAnalytics';
import type { Site, SfdcCase, DashboardFilters, MicroinverterType } from './types';
import { MICROINVERTER_TYPE_LABELS, MICROINVERTER_TYPE_COLORS, classifyMicroinverterType } from './utils/skuFamily';
import './index.css';

// ── Data provider selection ──────────────────────────────────────────────────
// VITE_DATA_PROVIDER = 'backend' → use live Incorta via Express backend (default for production)
// VITE_DATA_PROVIDER = 'mock'    → use local mock data (for dev/test without server)
// Tests always use mock.

const IS_TEST = import.meta.env.MODE === 'test' ||
  typeof (globalThis as Record<string, unknown>).__vitest_worker__ !== 'undefined';

const DATA_PROVIDER_MODE = IS_TEST ? 'mock' : (import.meta.env.VITE_DATA_PROVIDER ?? 'backend');
export const USE_LIVE     = DATA_PROVIDER_MODE === 'backend';
export const dataProvider = USE_LIVE ? new BackendDataProvider() : new MockDataProvider();

/* ---- CONTEXT ---- */
export interface FilterCtx {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  clearFilters: () => void;
  filterOptions: Record<string, string[]>;
  sites: Site[];
  cases: SfdcCase[];
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dataSourceInfo: DataSourceInfo | null;
  refresh: () => void;
  refreshing: boolean;
}
export const FilterContext = createContext<FilterCtx>({
  filters: {}, setFilters: () => {}, clearFilters: () => {},
  filterOptions: {}, sites: [], cases: [], loading: true,
  theme: 'light', toggleTheme: () => {},
  dataSourceInfo: null, refresh: () => {}, refreshing: false,
});

/* ---- CONSTANTS ---- */
export const SEV_COLORS: Record<number, string> = { 1: '#E01B1B', 2: '#F37421', 3: '#E89B0C', 4: '#0EA5E9' };
export const SEV_LABELS: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
export const STATUS_COLORS: Record<string, string> = {
  Normal: '#10B981', 'Production Issue': '#E89B0C',
  'Microinverters Not Reporting': '#E01B1B', 'Envoy Not Reporting': '#C026D3', 'Meter Issue': '#6366F1',
};

/* ---- SHARED UI ---- */
export function LoadingState() {
  return <div className="loading-state"><RefreshCw size={24} className="spin" /><p>Loading fleet data...</p></div>;
}
export function EmptyState({ message = 'No data matches current filters' }: { message?: string }) {
  return <div className="empty-state"><FolderOpen size={32} /><p>{message}</p></div>;
}
export function KpiCard({ label, value, subtitle, color, icon }: {
  label: string; value: string | number; subtitle?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="kpi-card" style={color ? { borderTopColor: color } : {}}>
      <div className="kpi-card-header">{icon}{label}</div>
      <div className="kpi-value" style={color ? { color } : {}}>{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
export function HealthBadge({ score }: { score: number }) {
  return (
    <span className="health-badge" style={{ background: healthColor(score) + '18', color: healthColor(score), borderColor: healthColor(score) }}>
      {healthGrade(score)} ({score})
    </span>
  );
}

/* ---- LAYOUT ---- */
function Sidebar() {
  const nav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Executive Summary' },
    { to: '/severity', icon: <Shield size={18} />, label: 'Severity Analysis' },
    { to: '/cases', icon: <ClipboardList size={18} />, label: 'Case Intelligence' },
    { to: '/action-queue', icon: <Crosshair size={18} />, label: 'Action Queue' },
    { to: '/case-tracker', icon: <Activity size={18} />, label: 'Case Tracker' },
    { to: '/trends', icon: <TrendingUp size={18} />, label: 'Trends & History' },
    { to: '/installers', icon: <Users size={18} />, label: 'Installer Performance' },
    { to: '/sku', icon: <Cpu size={18} />, label: 'Microinverter Intelligence' },
    { to: '/management', icon: <Shield size={18} />, label: 'Management Report' },
    { to: '/risk', icon: <AlertTriangle size={18} />, label: 'Risk Stratification' },
    { to: '/geography', icon: <MapPin size={18} />, label: 'Geographic View' },
    { to: '/fleet', icon: <Activity size={18} />, label: 'Fleet Explorer' },
    { to: '/data-quality', icon: <ShieldCheck size={18} />, label: 'Data Quality' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Zap size={20} /><span>Fleet Intelligence</span></div>
      <nav className="sidebar-nav">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            {n.icon}<span className="nav-label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Header() {
  const { theme, toggleTheme, dataSourceInfo, refresh, refreshing } = useContext(FilterContext);

  const statusLabel = USE_LIVE
    ? dataSourceInfo?.status === 'live' ? '● LIVE'
    : dataSourceInfo?.status === 'partial' ? '◐ PARTIAL DATA'
    : dataSourceInfo?.status === 'error' ? '! DATA ERROR'
    : '↻ Connecting…'
    : '— REPRESENTATIVE DATA';

  const statusClass = USE_LIVE
    ? dataSourceInfo?.status === 'live'    ? 'data-source-indicator data-source-live'
    : dataSourceInfo?.status === 'partial' ? 'data-source-indicator data-source-partial'
    : dataSourceInfo?.status === 'error'   ? 'data-source-indicator data-source-error'
    : 'data-source-indicator'
    : 'data-source-indicator';

  const refreshedAt = dataSourceInfo?.lastRefreshedAt
    ? new Date(dataSourceInfo.lastRefreshedAt).toLocaleTimeString() : null;

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h1>ENPHASE C&amp;I FLEET HEALTH INTELLIGENCE</h1>
        <span className="tagline">Severity · Cases · IQ8 · IQ9 · Installer Performance · SKU Intelligence</span>
      </div>
      <div className="top-header-right">
        {USE_LIVE && (
          <button className="refresh-btn" onClick={refresh} disabled={refreshing} title="Refresh data">
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshedAt ? `Refreshed ${refreshedAt}` : 'Refresh'}
          </button>
        )}
        <span className={statusClass} title={dataSourceInfo?.fleetError ?? ''}>
          {statusLabel}
        </span>
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <User size={16} />
      </div>
    </header>
  );
}

const TYPE_FILTER_ORDER: MicroinverterType[] = ['IQ8', 'IQ9', 'OTHER', 'UNKNOWN'];

function FilterBar() {
  const { filters, setFilters, clearFilters, filterOptions } = useContext(FilterContext);
  const hasFilters = Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v));

  function addFilter(field: string, value: string) {
    const curr = (filters as Record<string, string[]>)[field] || [];
    if (!curr.includes(value)) setFilters({ ...filters, [field]: [...curr, value] });
  }
  function removeFilter(field: string, value: unknown) {
    const arr = (filters as Record<string, unknown[]>)[field]?.filter(x => x !== value) || [];
    setFilters({ ...filters, [field]: arr.length ? arr : undefined });
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-left"><Filter size={14} /><span className="filter-label">Filters</span></div>
      <div className="filter-bar-controls">
        {/* Microinverter Type — first, as top-level dimension */}
        <select value="" onChange={e => { if (e.target.value) addFilter('microinverterType', e.target.value); }}>
          <option value="">Type</option>
          {TYPE_FILTER_ORDER
            .filter(t => (filterOptions.microinverterType || []).includes(t))
            .map(t => (
              <option key={t} value={t} style={{ color: MICROINVERTER_TYPE_COLORS[t] }}>
                {MICROINVERTER_TYPE_LABELS[t]}
              </option>
            ))}
        </select>

        {/* SKU — cascades under selected Type */}
        <select value="" onChange={e => { if (e.target.value) addFilter('miProductSku', e.target.value); }}>
          <option value="">SKU</option>
          {(filterOptions.miProductSku || [])
            .filter(sku => {
              if (!filters.microinverterType?.length) return true;
              return filters.microinverterType.includes(classifyMicroinverterType(sku));
            })
            .map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        {/* Severity */}
        <select value="" onChange={e => { if (e.target.value) addFilter('severity', e.target.value); }}>
          <option value="">Severity</option>
          {[1,2,3,4].map(s => <option key={s} value={String(s)}>Sev {s}</option>)}
        </select>

        {/* Stage + Connection */}
        {['siteStage', 'connectionType'].map(field => (
          <select key={field} value="" onChange={e => { if (e.target.value) addFilter(field, e.target.value); }}>
            <option value="">{field === 'connectionType' ? 'Connection' : 'Stage'}</option>
            {(filterOptions[field] || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        <div className="table-search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="table-search" placeholder="Search sites..." value={filters.searchTerm || ''}
            onChange={e => setFilters({ ...filters, searchTerm: e.target.value })} />
        </div>
      </div>
      {hasFilters && (
        <div className="filter-chips">
          {Object.entries(filters).filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : v)).map(([k, v]) =>
            Array.isArray(v) ? v.map(val => (
              <span key={`${k}-${val}`} className="filter-chip"
                style={k === 'microinverterType' ? { borderColor: MICROINVERTER_TYPE_COLORS[val as MicroinverterType], color: MICROINVERTER_TYPE_COLORS[val as MicroinverterType] } : {}}>
                {k === 'microinverterType' ? `Type: ${MICROINVERTER_TYPE_LABELS[val as MicroinverterType]}` : String(val)}
                <X size={12} onClick={() => removeFilter(k, val)} />
              </span>
            )) : k === 'searchTerm' && v ? (
              <span key={k} className="filter-chip">
                &quot;{String(v)}&quot; <X size={12} onClick={() => setFilters({ ...filters, searchTerm: undefined })} />
              </span>
            ) : null
          )}
          <button className="filter-clear" onClick={clearFilters}>Clear all</button>
        </div>
      )}
    </div>
  );
}

/* ---- LAZY PAGE IMPORTS ---- */
const ExecutivePage       = React.lazy(() => import('./pages/ExecutivePage'));
const SeverityPage        = React.lazy(() => import('./pages/SeverityPage'));
const CaseIntelligencePage= React.lazy(() => import('./pages/CaseIntelligencePage'));
const ActionQueuePage     = React.lazy(() => import('./pages/ActionQueuePage'));
const CaseTrackerPage     = React.lazy(() => import('./pages/CaseTrackerPage'));
const TrendsPage          = React.lazy(() => import('./pages/TrendsPage'));
const InstallerPage       = React.lazy(() => import('./pages/InstallerPage'));
const SkuPage             = React.lazy(() => import('./pages/SkuPage'));
const RiskPage            = React.lazy(() => import('./pages/RiskPage'));
const GeoPage             = React.lazy(() => import('./pages/GeoPage'));
const FleetPage           = React.lazy(() => import('./pages/FleetPage'));
const SiteDetailPage      = React.lazy(() => import('./pages/SiteDetailPage'));
const DataQualityPage       = React.lazy(() => import('./pages/DataQualityPage'));
const ManagementReportPage  = React.lazy(() => import('./pages/ManagementReportPage'));

/* ---- APP ---- */
function AppContent() {
  const [filters, setFilters]         = useState<DashboardFilters>({});
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});
  const [sites, setSites]             = useState<Site[]>([]);
  const [cases, setCases]             = useState<SfdcCase[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);
  const refreshCount = useRef(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof localStorage !== 'undefined' && localStorage.getItem('theme') as 'dark') || 'light'
  );

  const toggleTheme = useCallback(() => {
    setTheme(t => { const next = t === 'light' ? 'dark' : 'light'; localStorage.setItem('theme', next); return next; });
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const loadData = useCallback(async (f: DashboardFilters) => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        dataProvider.getSites(f),
        dataProvider.getCases(f),
      ]);
      setSites(s); setCases(c);
      if (USE_LIVE && 'getStatus' in dataProvider) {
        const bp = dataProvider as BackendDataProvider;
        bp.getStatus().then(setDataSourceInfo).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      dataProvider.getFilterOptions('microinverterType'),
      dataProvider.getFilterOptions('miProductSku'),
      dataProvider.getFilterOptions('connectionType'),
      dataProvider.getFilterOptions('siteStage'),
    ]).then(([miType, sku, conn, stage]) =>
      setFilterOptions({ microinverterType: miType, miProductSku: sku, connectionType: conn, siteStage: stage })
    );
  }, []);

  useEffect(() => { loadData(filters); }, [filters, loadData, refreshCount.current]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (USE_LIVE && 'refresh' in dataProvider) {
        await (dataProvider as BackendDataProvider).refresh();
      }
      refreshCount.current += 1;
      await loadData(filters);
    } finally { setRefreshing(false); }
  }, [refreshing, filters, loadData]);

  const clearFilters = () => setFilters({});

  return (
    <FilterContext.Provider value={{
      filters, setFilters, clearFilters, filterOptions,
      sites, cases, loading, theme, toggleTheme,
      dataSourceInfo, refresh, refreshing,
    }}>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <FilterBar />
          <React.Suspense fallback={<div className="page-content"><LoadingState /></div>}>
            <Routes>
              <Route path="/" element={<ExecutivePage />} />
              <Route path="/severity" element={<SeverityPage />} />
              <Route path="/cases" element={<CaseIntelligencePage />} />
              <Route path="/action-queue" element={<ActionQueuePage />} />
              <Route path="/case-tracker" element={<CaseTrackerPage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/installers" element={<InstallerPage />} />
              <Route path="/sku" element={<SkuPage />} />
              <Route path="/risk" element={<RiskPage />} />
              <Route path="/geography" element={<GeoPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/site/:siteId" element={<SiteDetailPage />} />
              <Route path="/data-quality" element={<DataQualityPage />} />
              <Route path="/management" element={<ManagementReportPage />} />
            </Routes>
          </React.Suspense>
        </div>
      </div>
    </FilterContext.Provider>
  );
}

function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}

export default App;
