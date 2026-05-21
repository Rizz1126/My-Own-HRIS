import { useState, useEffect, useRef } from 'react';
import { Eye, Download, Check, X, Play, Square, AlertCircle } from 'lucide-react';
import { calculateOvertimeRate } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatCurrency, formatHoursToHHMM, formatTimeRange, durationBetweenTimes } from '../../utils/formatters';

export default function MyOvertime() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showViewModal, setShowViewModal] = useState(null);

  const myEmployeeId = user?.employeeId;

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = myEmployeeId 
        ? await api.get(`/overtime/requests/employee/${myEmployeeId}`)
        : await api.get('/overtime/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [myEmployeeId]);

  const myRequests = myEmployeeId ? requests.filter(r => r.employeeId === myEmployeeId) : requests;
  const incomingRequests = myRequests.filter(r => r.status === 'Pending Employee');
  const approvedRequests = myRequests.filter(r => r.status === 'Accepted by Employee');
  const activeRequest = myRequests.find(r => r.status === 'In Progress') || null;
  const completedRequests = myRequests.filter(r => ['Completed', 'Rejected'].includes(r.status));

  const displayHistory = completedRequests.map((r) => ({ ...r, requestNumber: r.id }));

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeTimer.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAccept = async (id) => {
    try {
      await api.patch(`/overtime/requests/${id}/status`, { status: 'Accepted by Employee' });
      fetchRequests();
      toast.success('Overtime Accepted', 'You have accepted this overtime request.');
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/overtime/requests/${id}/status`, { status: 'Rejected' });
      setShowRejectModal(null);
      setRejectReason('');
      fetchRequests();
      toast.info('Overtime Declined', 'You have declined this overtime request.');
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleStart = async (id) => {
    try {
      await api.patch(`/overtime/requests/${id}/status`, { status: 'In Progress' });
      setElapsed(0);
      setActiveTimer({ id, startedAt: Date.now() });
      fetchRequests();
      toast.success('Overtime Started', 'Timer is now running. Good luck!');
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const handleStop = async (id) => {
    const actualHours = Math.round((elapsed / 3600) * 10) / 10 || 0.1;
    try {
      await api.patch(`/overtime/requests/${id}/status`, { status: 'Completed', actualHours });
      setActiveTimer(null);
      setElapsed(0);
      clearInterval(timerRef.current);
      fetchRequests();
      toast.success('Overtime Completed', `Session recorded — ${actualHours} hours logged.`);
    } catch (err) {
      toast.error('Action Failed', err.message);
    }
  };

  const totalOvertimeHours = myRequests.reduce((sum, r) => sum + (r.actualHours || r.plannedHours || 0), 0);
  const paidInstances = myRequests.filter(r => r.isPaid).length;
  const unpaidInstances = myRequests.filter(r => !r.isPaid).length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">My Overtime</h1>
        <p className="page-subtitle">Review requests, approve incoming overtime, and finish active sessions.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="kpi-card" style={{ padding: '16px' }}>
            <div className="kpi-content">
              <div className="kpi-label">Total Overtime Hours</div>
              <div className="kpi-value">{formatHoursToHHMM(totalOvertimeHours)}</div>
            </div>
          </div>
          <div className="kpi-card" style={{ padding: '16px' }}>
            <div className="kpi-content">
              <div className="kpi-label">Accepted Requests</div>
              <div className="kpi-value">{approvedRequests.length}</div>
            </div>
          </div>
          <div className="kpi-card" style={{ padding: '16px' }}>
            <div className="kpi-content">
              <div className="kpi-label">Unpaid / Processing</div>
              <div className="kpi-value">{unpaidInstances}</div>
            </div>
          </div>
        </div>
      </div>

      {incomingRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Incoming Overtime Requests ({incomingRequests.length})
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Request</th><th>Date</th><th>Plan Time</th><th>Purpose</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {incomingRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="font-semibold">{request.id}</td>
                    <td>{formatDate(request.date)}</td>
                    <td><span className="font-semibold">{request.plannedStartTime} - {request.plannedEndTime}</span></td>
                    <td>{request.purpose}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleAccept(request.id)}>
                          <Check size={14} /> Accept
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setShowRejectModal(request.id)}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {approvedRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Ready to Start ({approvedRequests.length})
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Request</th><th>Date</th><th>Plan Time</th><th>Purpose</th><th>Action</th></tr>
              </thead>
              <tbody>
                {approvedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="font-semibold">{request.id}</td>
                    <td>{formatDate(request.date)}</td>
                    <td>{request.plannedStartTime} - {request.plannedEndTime}</td>
                    <td>{request.purpose}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleStart(request.id)}>
                        <Play size={14} /> Start Overtime
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeRequest && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Overtime</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{activeRequest.id} — {activeRequest.purpose}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Started at {activeRequest.actualStartTime || formatDate(activeRequest.date)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="timer-display" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatTimer(elapsed)}</div>
              <button className="btn btn-danger" onClick={() => handleStop(activeRequest.id)}>
                <Square size={16} /> End Overtime
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
          Overtime History
        </h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Request</th><th>Date</th><th>Plan Time</th><th>Actual Time</th><th>Work Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {displayHistory.map((r) => {
                const planTime = formatTimeRange(r.plannedStartTime, r.plannedEndTime, r.plannedHours);
                const actualTime = r.actualStartTime && r.actualEndTime
                  ? formatTimeRange(r.actualStartTime, r.actualEndTime, r.actualHours)
                  : '—';
                const statusLabel = r.status || (r.isPaid ? 'Paid' : 'Unpaid');
                return (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.requestNumber || r.id}</td>
                    <td>{formatDate(r.date)}</td>
                    <td>{planTime}</td>
                    <td>{actualTime}</td>
                    <td>
                      <span className={`badge ${r.workStatus === 'On Time' ? 'success' : 'warning'}`}>
                        <span className="badge-dot" />{r.workStatus || statusLabel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.isPaid ? 'success' : 'neutral'}`}>
                        {r.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-icon btn-sm btn-secondary" title="View" onClick={() => setShowViewModal(r)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-icon btn-sm btn-secondary" title="Download" onClick={() => {
                          const lines = [
                            `Overtime Receipt: ${r.requestNumber || r.id}`,
                            `Date: ${formatDate(r.date)}`,
                            `Purpose: ${r.purpose || '—'}`,
                            `Plan Time: ${r.plannedStartTime} - ${r.plannedEndTime}`,
                            `Actual Hours: ${r.actualHours || r.plannedHours}h`,
                            `Status: ${r.status || '—'}`,
                          ];
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
                          a.download = `ot-receipt-${r.requestNumber || r.id}.txt`;
                          a.click();
                        }}>
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reject Overtime Request</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for rejection</label>
                <textarea className="form-input form-textarea" rows={3} placeholder="Provide a strong reason for the rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReject(showRejectModal)} disabled={!rejectReason.trim()}>
                <X size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(null)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Overtime Detail — {showViewModal.requestNumber || showViewModal.id}</h3>
              <button className="modal-close" onClick={() => setShowViewModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Date', value: formatDate(showViewModal.date) },
                  { label: 'Plan Time', value: formatTimeRange(showViewModal.plannedStartTime, showViewModal.plannedEndTime, showViewModal.plannedHours) },
                  { label: 'Actual Time', value: showViewModal.actualStartTime && showViewModal.actualEndTime ? formatTimeRange(showViewModal.actualStartTime, showViewModal.actualEndTime, showViewModal.actualHours) : '—' },
                  { label: 'Status', value: showViewModal.status || (showViewModal.isPaid ? 'Paid' : 'Unpaid') },
                  { label: 'Work Status', value: showViewModal.workStatus || ((showViewModal.actualHours || showViewModal.plannedHours) > showViewModal.plannedHours ? 'Extended' : 'On Time') },
                  { label: 'Estimated Pay', value: formatCurrency(calculateOvertimeRate(showViewModal.baseSalary || 8000000, showViewModal.actualHours || showViewModal.plannedHours, showViewModal.isWeekend)) },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Purpose</div>
                <div style={{ fontSize: '0.9rem' }}>{showViewModal.purpose || '—'}</div>
              </div>
              {showViewModal.employeeRejectReason && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Employee Rejection Reason</div>
                  <div>{showViewModal.employeeRejectReason}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => {
                const lines = [
                  `Overtime Receipt: ${showViewModal.requestNumber || showViewModal.id}`,
                  `Date: ${formatDate(showViewModal.date)}`,
                  `Purpose: ${showViewModal.purpose || '—'}`,
                  `Plan Time: ${showViewModal.plannedStartTime} - ${showViewModal.plannedEndTime}`,
                  `Actual Hours: ${showViewModal.actualHours || showViewModal.plannedHours}h`,
                  `Status: ${showViewModal.status || '—'}`,
                ];
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
                a.download = `ot-receipt-${showViewModal.requestNumber || showViewModal.id}.txt`;
                a.click();
              }}>
                <Download size={16} /> Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
