import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { FilterContext, KpiCard, LoadingState, EmptyState, SEV_COLORS } from '../App';
import { exportToCsv } from '../utils/csvExport';

export default function CaseTrackerPage() {
  const { cases, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<string>('caseAge');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    let result = [...cases];
    if (search) {
      const t = search.toLowerCase();
      result = result.filter(c =>
        c.siteName.toLowerCase().includes(t) || c.siteId.includes(t) ||
        c.caseNumber.includes(t) || c.caseOwner.toLowerCase().includes(t)
      );
    }
    if (sevFilter) result = result.filter(c => c.severity.startsWith(sevFilter));
    if (skuFilter) result = result.filter(c => c.miProductSku === skuFilter);
    if (ownerFilter) result = result.filter(c => c.caseOwner === ownerFilter);
    if (statusFilter) result = result.filter(c => c.caseStatus === statusFilter);
    result.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortKey];
      const vb = (b as unknown as Record<string, unknown>)[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [cases, search, sevFilter, skuFilter, ownerFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const owners = useMemo(() => [...new Set(cases.map(c => c.caseOwner))].sort(), [cases]);
  const skus = useMemo(() => [...new Set(cases.map(c => c.miProductSku))].sort(), [cases]);
  const statuses = useMemo(() => [...new Set(cases.map(c => c.caseStatus))].sort(), [cases]);

  const exportAll = () => {
    if (!filtered.length) return;
    exportToCsv('case_tracker.csv', filtered.map(c => ({
      CaseNumber: c.caseNumber, SiteName: c.siteName, SiteID: c.siteId,
      Severity: c.severity, SKU: c.miProductSku, CaseStatus: c.caseStatus,
      Owner: c.caseOwner, CaseAge: c.caseAge, Installer: c.installerName,
      LastUpdate: c.lastUpdate, State: c.state,
    })));
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const aging30 = cases.filter(c => c.caseAge > 30).length;
  const aging7 = cases.filter(c => c.caseAge > 7).length;

  const SortTh = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <th className="sortable" onClick={() => toggleSort(k)}>
      {children} {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  const sevColor = (sev: string) => {
    if (sev.startsWith('1')) return SEV_COLORS[1];
    if (sev.startsWith('2')) return SEV_COLORS[2];
    if (sev.startsWith('3')) return SEV_COLORS[3];
    if (sev.startsWith('4')) return SEV_COLORS[4];
    return '#94A3B8';
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Case Tracker</h2>
      <p className="page-desc">All open SFDC cases with severity indicators, ownership, and aging.</p>

      <div className="kpi-row">
        <KpiCard label="Total Open Cases" value={cases.length} color="#2563EB" />
        <KpiCard label="Aging > 7 Days" value={aging7} color="#F37421" subtitle={`${Math.round(aging7 / Math.max(cases.length, 1) * 100)}%`} />
        <KpiCard label="Aging > 30 Days" value={aging30} color="#E01B1B" subtitle={`${Math.round(aging30 / Math.max(cases.length, 1) * 100)}%`} />
        <KpiCard label="Unique Owners" value={owners.length} color="#10B981" />
      </div>

      {/* Filters */}
      <div className="installer-controls" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="table-search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="table-search" placeholder="Search cases..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(0); }}>
          <option value="">All Severities</option>
          {['1', '2', '3', '4'].map(s => <option key={s} value={s}>Sev {s}</option>)}
        </select>
        <select value={skuFilter} onChange={e => { setSkuFilter(e.target.value); setPage(0); }}>
          <option value="">All SKUs</option>
          {skus.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={ownerFilter} onChange={e => { setOwnerFilter(e.target.value); setPage(0); }}>
          <option value="">All Owners</option>
          {owners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="link-btn" onClick={exportAll}><Download size={14} /> Export CSV</button>
      </div>

      {filtered.length === 0 ? <EmptyState message="No cases match filters" /> : (
        <div className="section-card">
          <h3>Cases ({filtered.length})</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <SortTh k="siteName">Site Name</SortTh>
                  <SortTh k="siteId">Site ID</SortTh>
                  <SortTh k="severity">Severity</SortTh>
                  <SortTh k="miProductSku">SKU</SortTh>
                  <SortTh k="caseNumber">SFDC Case #</SortTh>
                  <SortTh k="caseStatus">Case Status</SortTh>
                  <SortTh k="caseOwner">Case Owner</SortTh>
                  <SortTh k="caseAge">Case Age</SortTh>
                  <SortTh k="installerName">Installer</SortTh>
                  <SortTh k="lastUpdate">Last Update</SortTh>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(c => (
                  <tr key={c.caseNumber} className="clickable-row" onClick={() => navigate(`/site/${c.siteId}`)}>
                    <td>{c.siteName}</td>
                    <td className="mono">{c.siteId}</td>
                    <td><span className="sev-badge" style={{ background: sevColor(c.severity) }}>{c.severity}</span></td>
                    <td className="sku-name">{c.miProductSku}</td>
                    <td className="mono">{c.caseNumber}</td>
                    <td><span className={`status-badge ${c.caseStatus.includes('Progress') ? 'status-issue' : 'status-normal'}`}>{c.caseStatus}</span></td>
                    <td>{c.caseOwner}</td>
                    <td style={{ color: c.caseAge > 30 ? '#E01B1B' : c.caseAge > 7 ? '#F37421' : undefined, fontWeight: c.caseAge > 7 ? 700 : 400 }}>
                      {c.caseAge}d
                    </td>
                    <td>{c.installerName || '—'}</td>
                    <td>{c.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
