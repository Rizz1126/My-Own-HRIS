import { useState, useEffect } from 'react';
import { Plus, X, Upload, Check, AlertCircle, FileText, Download, Eye } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function Reimbursement() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [newRequest, setNewRequest] = useState({ title: '', amount: '', type: 'Health', description: '' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/ess/reimbursements?employeeId=${user?.employeeId}`);
      setRequests(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ess/reimbursements', {
        ...newRequest,
        employeeId: user?.employeeId,
        amount: parseInt(newRequest.amount),
        status: 'Pending'
      });
      setShowForm(false);
      setNewRequest({ title: '', amount: '', type: 'Health', description: '' });
      fetchData();
      toast.success('Claim Submitted', `Reimbursement claim "${newRequest.title}" has been submitted for review.`);
    } catch (err) {
      toast.error('Submit Failed', err.message);
    }
  };

  const budgetLimit = 10000000; // Hardcoded for MVP
  const usedBudget = requests
    .filter(r => r.status !== 'Rejected')
    .reduce((sum, r) => sum + r.amount, 0);
  const remainingBudget = budgetLimit - usedBudget;
  const budgetPercent = Math.min(100, (usedBudget / budgetLimit) * 100);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading reimbursements...</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reimbursement</h1>
          <p className="page-subtitle">Submit and track your reimbursement claims</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={18} /> New Claim</button>
      </div>

      {/* Budget Widget */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Annual Budget Usage</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(usedBudget)} / {formatCurrency(budgetLimit)}</span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${budgetPercent}%`, height: '100%', background: budgetPercent > 90 ? 'var(--color-danger)' : 'var(--color-primary)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ padding: '12px 20px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining Budget</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: remainingBudget < 1000000 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatCurrency(remainingBudget)}</div>
        </div>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: '24px' }} onSubmit={handleSubmit}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>New Reimbursement Claim</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={newRequest.type} onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}>
                <option>Health</option><option>Transportation</option><option>Training</option><option>Equipment</option><option>Meals</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (IDR)</label>
              <input type="number" className="form-input" placeholder="Enter amount" value={newRequest.amount} onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" placeholder="Brief title" value={newRequest.title} onChange={(e) => setNewRequest({...newRequest, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="Describe your expense..." value={newRequest.description} onChange={(e) => setNewRequest({...newRequest, description: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Claim</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold" style={{ fontFamily: 'monospace' }}>{r.id.slice(0, 8)}</td>
                <td>{r.title}</td>
                <td><span className="badge neutral">{r.type}</span></td>
                <td><span className="font-bold">{formatCurrency(r.amount)}</span></td>
                <td>{formatDate(r.requestDate || r.date)}</td>
                <td>
                  <span className={`badge ${r.status === 'Approved' || r.status === 'Paid' ? 'success' : r.status === 'Rejected' ? 'danger' : 'warning'}`}>
                    <span className="badge-dot" />{r.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-icon btn-sm btn-secondary" title="View Details" onClick={() => setShowViewModal(r)}><Eye size={14} /></button>
                    {r.receiptUrl && <button className="btn btn-icon btn-sm btn-secondary" title="Download Receipt" onClick={() => window.open(r.receiptUrl, '_blank')}><Download size={14} /></button>}
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
              <h3 className="modal-title">Reimbursement Detail</h3>
              <button className="modal-close" onClick={() => setShowViewModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Title', value: showViewModal.title },
                  { label: 'Type', value: showViewModal.type },
                  { label: 'Amount', value: formatCurrency(showViewModal.amount) },
                  { label: 'Date', value: formatDate(showViewModal.requestDate || showViewModal.date) },
                  { label: 'Status', value: showViewModal.status },
                  { label: 'Description', value: showViewModal.description || '—' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', gridColumn: i >= 4 ? 'span 2' : undefined }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
              {showViewModal.receiptUrl && (
                <button className="btn btn-primary" onClick={() => window.open(showViewModal.receiptUrl, '_blank')}>
                  <Download size={16} /> View Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
