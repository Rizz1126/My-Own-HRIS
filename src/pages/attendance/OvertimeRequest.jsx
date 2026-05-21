import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Download, Search, Filter, Calendar, Clock, Target, TrendingUp, CheckCircle2, AlertCircle, XCircle, User, FileText } from 'lucide-react';
import { calculateOvertimeRate } from '../../utils/formatters';
import { formatDate, formatCurrency, getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function OvertimeRequest() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showViewModal, setShowViewModal] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/overtime/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Fetch Failed', 'Could not load overtime records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.task?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.achievement === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAchievementBadge = (achievement) => {
    switch (achievement) {
      case 'Completed': return <span className="badge success"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Completed</span>;
      case 'On Progress': return <span className="badge warning"><Clock size={12} style={{marginRight: '4px'}}/> In Progress</span>;
      case 'Failed': return <span className="badge danger"><XCircle size={12} style={{marginRight: '4px'}}/> Failed</span>;
      default: return <span className="badge neutral">{achievement}</span>;
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Overtime Request</h1>
          <p className="page-subtitle">Track achievements, progress, and synchronize with payroll</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/attendance/overtime-entry')}>
          <Plus size={18} /> New Overtime Record
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by employee or task..." 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              className="form-input" 
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Achievements</option>
              <option value="Completed">Completed</option>
              <option value="On Progress">On Progress</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date & Time</th>
              <th>Task Description</th>
              <th>Achievement</th>
              <th>Cost (Est.)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading records...</td></tr>
            ) : filteredRequests.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No overtime records found.</td></tr>
            ) : filteredRequests.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="table-avatar">
                    <div className="table-avatar-img">{getInitials(r.employee?.name || 'Unknown')}</div>
                    <div>
                      <div className="table-name">{r.employee?.name || 'Unknown'}</div>
                      <div className="table-sub">{r.employee?.position || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{formatDate(r.date)}</div>
                  <div className="table-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {r.startTime} - {r.endTime} ({r.hours}h)
                  </div>
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-primary)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {r.task}
                  </div>
                  {r.progressDetails && <div className="table-sub">{r.progressDetails}</div>}
                </td>
                <td>{getAchievementBadge(r.achievement)}</td>
                <td className="font-semibold">
                  {formatCurrency(calculateOvertimeRate(r.employee?.baseSalary || 8000000, Number(r.hours), r.isWeekend))}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowViewModal(r)}>
                      <Eye size={14} /> View
                    </button>
                    {r.evidenceUrl && (
                      <button className="btn btn-sm btn-secondary" onClick={() => window.open(r.evidenceUrl, '_blank')}>
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(null)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Overtime Detail — {showViewModal.id}</h3>
              <button className="modal-close" onClick={() => setShowViewModal(null)}><XCircle size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Employee', value: showViewModal.employee?.name, icon: <User size={14}/> },
                  { label: 'Date', value: formatDate(showViewModal.date), icon: <Calendar size={14}/> },
                  { label: 'Time', value: `${showViewModal.startTime} - ${showViewModal.endTime}`, icon: <Clock size={14}/> },
                  { label: 'Total Hours', value: `${showViewModal.hours} Hours`, icon: <Clock size={14}/> },
                  { label: 'Achievement', value: showViewModal.achievement, icon: <Target size={14}/> },
                  { label: 'Cost Est.', value: formatCurrency(calculateOvertimeRate(showViewModal.employee?.baseSalary || 8000000, Number(showViewModal.hours), showViewModal.isWeekend)), icon: <TrendingUp size={14}/> },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Task Description
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{showViewModal.task}</div>
              </div>

              {showViewModal.progressDetails && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 600 }}>
                    Progress Details
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{showViewModal.progressDetails}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
              {showViewModal.evidenceUrl && (
                <button className="btn btn-primary" onClick={() => window.open(showViewModal.evidenceUrl, '_blank')}>
                  <Download size={16} /> View Evidence
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
