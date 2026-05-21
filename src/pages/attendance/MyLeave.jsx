import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Paperclip, Upload } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LEAVE_TYPES = [
  { label: 'Annual Leave', total: 12, color: 'primary' },
  { label: 'Sick Leave', total: 14, color: 'danger' },
  { label: 'Personal Leave', total: 3, color: 'warning' },
  { label: 'Maternity/Paternity', total: 90, color: 'info' },
];

const STATUS_MAP = {
  'Pending': { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Pending Manager' },
  'Manager Approved': { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: 'Manager Approved' },
  'Approved': { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Approved' },
  'Rejected': { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Rejected' },
};

export default function MyLeave() {
  const { user } = useAuth();
  const toast = useToast();
  const currentEmpId = user?.employeeId || 'EMP-0001';
  
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/attendance/leaves');
      // Filter only current user's leaves - normalize IDs
      const myLeaves = data.filter(l => 
        (l.employee?.id === currentEmpId) || (l.employeeId === currentEmpId)
      );
      
      // Calculate days dynamically for the UI
      const formatted = myLeaves.map(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return {
          ...l,
          days: diff > 0 ? diff : 0,
          managerStatus: l.status,
          hrStatus: l.status,
          finalStatus: l.status,
        };
      });
      setLeaves(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate used days per type
  const getUsedDays = (type) => {
    return leaves
      .filter(l => l.type === type && l.status === 'Approved')
      .reduce((sum, l) => sum + l.days, 0);
  };

  const leaveBalances = LEAVE_TYPES.map(t => ({
    ...t,
    used: getUsedDays(t.label)
  }));

  useEffect(() => {
    fetchLeaves();
  }, [currentEmpId]);

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff = Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleApply = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.warning('Validation Error', 'Please select both start and end dates.');
      return;
    }
    if (!formData.reason) {
      toast.warning('Validation Error', 'Please provide a reason for your leave.');
      return;
    }

    const days = calcDays();
    if (days <= 0) {
      toast.warning('Validation Error', 'End date cannot be before start date.');
      return;
    }

    // Check balance
    const balance = leaveBalances.find(b => b.label === formData.type);
    if (balance && (balance.total - balance.used) < days) {
      toast.warning('Insufficient Balance', `You only have ${balance.total - balance.used} days remaining for ${formData.type}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/attendance/leaves', {
        id: `LV-${Date.now()}`,
        employeeId: currentEmpId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'Pending',
      });
      
      toast.success('Leave Request Submitted', `${formData.type} request for ${days} day(s) has been submitted.`);
      setShowApplyModal(false);
      setFormData({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      toast.error('Submit Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your leave requests...</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Leave</h1>
          <p className="page-subtitle">Check your availability and manage leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
          <Plus size={18} /> Apply for Leave
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        {leaveBalances.map((b) => (
          <div key={b.label} className="kpi-card">
            <div className={`kpi-icon ${b.color}`}><Calendar size={24} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{b.label}</div>
              <div className="kpi-value">
                {b.total - b.used}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {b.total} days</span>
              </div>
              <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                <div className={`progress-bar-fill ${b.color === 'primary' ? '' : b.color}`} style={{ width: `${(b.used / b.total) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Status Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Leave Requests</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Date Range</th><th>Days</th><th>Reason</th><th>Manager</th><th>HR</th><th>Final Status</th></tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td><span className="badge neutral">{l.type}</span></td>
                  <td>{formatDate(l.startDate)} — {formatDate(l.endDate)}</td>
                  <td className="font-semibold">{l.days}d</td>
                  <td style={{ maxWidth: '180px' }}>{l.reason}</td>
                  <td>
                    <span className="badge" style={{
                      background: STATUS_MAP[l.managerStatus]?.bg,
                      color: STATUS_MAP[l.managerStatus]?.color,
                    }}>
                      <span className="badge-dot" />{l.managerStatus}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: STATUS_MAP[l.hrStatus]?.bg,
                      color: STATUS_MAP[l.hrStatus]?.color,
                    }}>
                      <span className="badge-dot" />{l.hrStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${l.finalStatus === 'Approved' ? 'success' : l.finalStatus === 'Rejected' ? 'danger' : 'warning'}`}>
                      <span className="badge-dot" />{l.finalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Apply for Leave</h3>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="form-input" value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                  {leaveBalances.map(b => <option key={b.label} value={b.label}>{b.label} ({b.total - b.used} days available)</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              {formData.startDate && formData.endDate && calcDays() > 0 && (
                <div style={{ padding: '10px 14px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.88rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Duration: {calcDays()} day{calcDays() > 1 ? 's' : ''}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-input form-textarea" rows={3} placeholder="Describe your reason for leave..." value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Attachment <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                  <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Upload supporting document</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApplyModal(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
