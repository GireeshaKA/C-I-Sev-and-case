import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { FilterContext, LoadingState, EmptyState, SEV_LABELS } from '../App';
import { healthColor, healthGrade } from '../services/FleetAnalytics';

export default function FleetPage() {
  const { sites, loading } = useContext(FilterContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string>('healthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    let result = [...sites];
    if (search) {
      const t = search.toLowerCase();
      result = result.filter(s =>
        s.siteName.toLowerCase().includes(t) || s.siteId.includes(t) ||
        s.installerName.toLowerCase().includes(t) || s.state.toLowerCase().includes(t)
      );
    }
    result.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortKey];
      const vb = (b as unknown as Record<string, unknown>)[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sites, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (loading) return <div className="page-content"><LoadingState /></div>;

  const SortTh = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <th className="sortable" onClick={() => toggleSort(k)}>
      {children} {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="page-content">
      <h2 className="page-title">Fleet Explorer</h2>
      <p className="page-desc">Browse, search, and sort all {sites.length} sites in the C&I fleet.</p>

      <div className="fleet-controls">
        <div className="table-search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="table-search wide" placeholder="Search by site name, ID, installer, or state..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <span className="fleet-count">{filtered.length} sites</span>
      </div>

      {filtered.length === 0 ? <EmptyState /> : (
        <div className="section-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <SortTh k="siteName">Site</SortTh>
                  <SortTh k="healthScore">Health</SortTh>
                  <SortTh k="severity">Severity</SortTh>
                  <SortTh k="siteStatus">Status</SortTh>
                  <SortTh k="installerName">Installer</SortTh>
                  <SortTh k="miProductSku">SKU</SortTh>
                  <SortTh k="state">State</SortTh>
                  <SortTh k="connectionType">Conn</SortTh>
                  <SortTh k="microCount">Micros</SortTh>
                  <SortTh k="energyPerMicroPerDay">Energy/MI</SortTh>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(s => (
                  <tr key={s.siteId} className="clickable-row" onClick={() => navigate(`/site/${s.siteId}`)}>
                    <td className="site-name-cell">{s.siteName}<br /><small className="site-id">{s.siteId}</small></td>
                    <td><span className="health-mini" style={{ color: healthColor(s.healthScore) }}>{healthGrade(s.healthScore)} ({s.healthScore})</span></td>
                    <td>{s.severity ? <span className={`sev-badge sev-${s.severity}`}>{s.severity} · {SEV_LABELS[s.severity]}</span> : '—'}</td>
                    <td>{s.siteStatus}</td>
                    <td>{s.installerName || '—'}</td>
                    <td className="sku-name">{s.miProductSku}</td>
                    <td>{s.state || '—'}</td>
                    <td>{s.connectionType}</td>
                    <td>{s.microCount}</td>
                    <td>{s.energyPerMicroPerDay > 0 ? `${Math.round(s.energyPerMicroPerDay)} Wh` : '—'}</td>
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
