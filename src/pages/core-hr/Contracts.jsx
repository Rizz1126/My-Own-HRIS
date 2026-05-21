import { useState, useEffect, useMemo } from 'react';
import { FileCheck, AlertTriangle, FileX, Search, RefreshCw, Eye } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate, daysUntil, getInitials } from '../../utils/formatters';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/master-data/contracts');
        setContracts(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const data = useMemo(() => {
    const processed = contracts.map(c => {
      const days = c.endDate ? daysUntil(c.endDate) : null;
      let status = 'Active';
      if (days !== null) {
        if (days < 0) status = 'Expired';
        else if (days <= 60) status = 'Expiring Soon';
      }
      return { ...c, status, days };
    });

    const expiringCount = processed.filter(c => c.status === 'Expiring Soon').length;
    const expiredCount = processed.filter(c => c.status === 'Expired').length;
    const activeCount = processed.filter(c => c.status !== 'Inactive' && c.status !== 'Resigned').length;

    const filtered = processed.filter((c) => {
      const empName = c.employee?.name || '';
      const matchSearch = empName.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || c.type === typeFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });

    return { filtered, expiringCount, expiredCount, activeCount };
  }, [contracts, search, typeFilter, statusFilter]);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contracts...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Contract Tracker</h1>
        <p className="page-subtitle">Monitor and manage employee contracts</p>
      </div>

      {data.expiringCount > 0 && (
        <div className="alert-banner warning">
          <AlertTriangle size={20} />
          <span><strong>{data.expiringCount} contracts</strong> expiring within 60 days. Review and take action.</span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon success"><FileCheck size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Contracts</div>
            <div className="kpi-value">{data.activeCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Expiring Soon</div>
            <div className="kpi-value">{data.expiringCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon danger"><FileX size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Expired</div>
            <div className="kpi-value">{data.expiredCount}</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          <option value="PKWT">PKWT</option>
          <option value="PKWTT">PKWTT</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Contract ID</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.filtered.map((c) => {
              const empName = c.employee?.name || 'Unknown';
              return (
                <tr key={c.id}>
                  <td>
                    <div className="table-avatar">
                      <div className="table-avatar-img">{getInitials(empName)}</div>
                      <div>
                        <div className="table-name">{empName}</div>
                        <div className="table-sub">{c.employee?.position || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.id.slice(0, 8)}</td>
                  <td><span className={`badge ${c.type === 'PKWTT' ? 'info' : 'neutral'}`}>{c.type}</span></td>
                  <td>{formatDate(c.startDate)}</td>
                  <td>{c.endDate ? formatDate(c.endDate) : '—'}</td>
                  <td>
                    {c.days !== null ? (
                      <span style={{ fontWeight: 600, color: c.days < 0 ? 'var(--color-danger)' : c.days <= 30 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {c.days < 0 ? `${Math.abs(c.days)}d overdue` : `${c.days}d`}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Permanent</span>}
                  </td>
                  <td>
                    <span className={`badge ${c.status !== 'Inactive' && c.status !== 'Resigned' ? 'success' : c.status === 'Expiring Soon' ? 'warning' : 'danger'}`}>
                      <span className="badge-dot" />{c.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-secondary"><Eye size={14} /></button>
                      <button className="btn btn-sm btn-primary"><RefreshCw size={14} /> Renew</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
