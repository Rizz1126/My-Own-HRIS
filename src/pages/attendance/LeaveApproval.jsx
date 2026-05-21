import { useState, useEffect } from 'react';
import { Check, X, Filter } from 'lucide-react';
import { formatDate, getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function LeaveApproval() {
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/attendance/leaves');
      const formatted = data.map(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return {
          ...l,
          employeeName: l.employee?.name || 'Unknown',
          department: l.employee?.department || 'N/A',
          days: diff > 0 ? diff : 0,
          managerStatus: l.status,
          hrStatus: l.status,
          finalStatus: l.status,
        };
      });
      setRequests(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const pendingRequests = requests.filter(r => r.finalStatus === 'Pending');
  const allRequests = requests;

  const handleApprove = async (id) => {
    try {
      setIsUpdating(true);
      await api.patch(`/attendance/leaves/${id}`, { status: 'Approved' });
      fetchLeaves();
      toast.success('Leave Approved', 'Leave request has been approved successfully.');
    } catch (err) {
      toast.error('Approve Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setIsUpdating(true);
      await api.patch(`/attendance/leaves/${id}`, { status: 'Rejected' });
      setShowRejectModal(null);
      setRejectReason('');
      fetchLeaves();
      toast.info('Leave Rejected', 'Leave request has been rejected.');
    } catch (err) {
      toast.error('Reject Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const displayList = tab === 'pending' ? pendingRequests : allRequests;

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading approvals...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Leave Approval</h1>
        <p className="page-subtitle">Approve or reject leave requests from your team</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending My Approval
          {pendingRequests.length > 0 && (
            <span className="badge warning" style={{ marginLeft: '8px', fontSize: '0.72rem' }}>{pendingRequests.length}</span>
          )}
        </button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Requests
        </button>
      </div>

      {/* Workflow Info */}
      <div style={{
        padding: '14px 18px', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)',
        marginBottom: '20px', fontSize: '0.85rem', color: 'var(--color-info)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Filter size={16} />
        <span>
          <strong>Approval Workflow:</strong> Employee submits → Manager approves → HR approves → Leave confirmed.
          Once fully approved, leave is removed from employee's Self-Service view.
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Date Range</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Manager</th>
              <th>HR</th>
              <th>Final Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No pending requests
                </td>
              </tr>
            ) : (
              displayList.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="table-avatar">
                      <div className="table-avatar-img">{getInitials(r.employeeName)}</div>
                      <div>
                        <div className="table-name">{r.employeeName}</div>
                        <div className="table-sub">{r.department}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge neutral">{r.type}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.startDate)} — {formatDate(r.endDate)}</td>
                  <td className="font-semibold">{r.days}d</td>
                  <td style={{ maxWidth: '160px' }}>{r.reason}</td>
                  <td>
                    <span className={`badge ${r.managerStatus === 'Approved' ? 'success' : r.managerStatus === 'Rejected' ? 'danger' : 'warning'}`}>
                      <span className="badge-dot" />{r.managerStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.hrStatus === 'Approved' ? 'success' : r.hrStatus === 'Rejected' ? 'danger' : 'warning'}`}>
                      <span className="badge-dot" />{r.hrStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.finalStatus === 'Approved' ? 'success' : r.finalStatus === 'Rejected' ? 'danger' : 'warning'}`}>
                      <span className="badge-dot" />{r.finalStatus}
                    </span>
                  </td>
                  <td>
                    {r.finalStatus === 'Pending' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(r.id)} disabled={isUpdating} title="Approve">
                          <Check size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setShowRejectModal(r.id)} disabled={isUpdating} title="Reject">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reject Leave Request</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for rejection</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Explain why this leave request is rejected..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReject(showRejectModal)} disabled={!rejectReason.trim() || isUpdating}>
                <X size={16} /> {isUpdating ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
