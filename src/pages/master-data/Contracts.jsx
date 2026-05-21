import { useState, useEffect } from 'react';
import { Search, Plus, Eye, RefreshCw, X, Upload, FileText } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [allContracts, setAllContracts] = useState([]);
  const { employees, isLoadingEmployees } = useEmployees();
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const contractsRes = await api.get('/master-data/contracts');

      const formattedContracts = contractsRes.map(c => ({
        id: c.id,
        employeeId: c.employee?.id,
        name: c.employee?.name || 'Unknown',
        startDate: c.startDate,
        endDate: c.endDate,
        remaining: c.endDate ? Math.max(0, Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : null,
        active: true, // We can derive this properly later
        documentName: c.documentUrl,
        remarks: ''
      }));

      setAllContracts(formattedContracts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const [addForm, setAddForm] = useState({
    name: '', startDate: '', endDate: '', remarks: '', document: null,
  });

  const [renewForm, setRenewForm] = useState({
    startDate: '', endDate: '', remarks: '', document: null,
  });

  const filtered = allContracts.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchActive = activeFilter === 'All' || (activeFilter === 'Yes' ? c.active : !c.active);

    let matchDuration = true;
    if (durationFilter === '<30') {
      matchDuration = c.remaining !== null && c.remaining > 0 && c.remaining < 30;
    } else if (durationFilter === '<60') {
      matchDuration = c.remaining !== null && c.remaining > 0 && c.remaining < 60;
    } else if (durationFilter === '>60') {
      matchDuration = c.remaining !== null && c.remaining > 60;
    }

    return matchSearch && matchActive && matchDuration;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleRenew = (contract) => {
    setSelectedContract(contract);
    const endDate = contract.endDate ? new Date(contract.endDate) : new Date();
    const newStart = new Date(endDate);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    setRenewForm({
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
      remarks: '',
      document: null,
    });
    setShowRenewModal(true);
  };

  const confirmRenew = async () => {
    if (!selectedContract) return;

    try {
      await api.post('/master-data/contracts', {
        employeeId: selectedContract.employeeId,
        type: 'Contract Fulltime',
        startDate: renewForm.startDate,
        endDate: renewForm.endDate || null,
      });

      setShowRenewModal(false);
      setSelectedContract(null);
      await fetchData();
      toast.success('Contract Renewed', `Contract for ${selectedContract.name} has been renewed successfully.`);
    } catch (err) {
      toast.error('Renewal Failed', err.message);
    }
  };

  const handleView = (c) => {
    setSelectedContract(c);
    setShowViewModal(true);
  };

  const summary = {
    active: allContracts.filter(c => c.active).length,
    expiring: allContracts.filter(c => c.active && c.remaining !== null && c.remaining <= 60 && c.remaining > 0).length,
    expired: allContracts.filter(c => c.remaining === 0 && c.endDate !== null).length,
    total: allContracts.length,
  };

  const handleFileChange = (e, formType) => {
    const file = e.target.files[0];
    if (formType === 'add') {
      setAddForm(prev => ({ ...prev, document: file || null }));
    } else {
      setRenewForm(prev => ({ ...prev, document: file || null }));
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">{summary.total} total contracts • {summary.active} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Contract</button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search by employee name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="All">All Contracts</option>
          <option value="Yes">Active Only</option>
          <option value="No">Inactive Only</option>
        </select>
        <select className="filter-select" value={durationFilter} onChange={(e) => { setDurationFilter(e.target.value); setPage(1); }}>
          <option value="All">All Duration</option>
          <option value="<30">{'< 30 days'}</option>
          <option value="<60">{'< 60 days'}</option>
          <option value=">60">{'> 60 days'}</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Remaining</th>
              <th>Active</th>
              <th>Document</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isLoadingEmployees ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading contracts...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No contracts found.
                </td>
              </tr>
            ) : paginated.map((c) => (
              <tr key={c.id} style={{ opacity: c.active ? 1 : 0.6 }}>
                <td>
                  <div className="table-name">{c.name}</div>
                  <div className="table-sub" style={{ fontSize: '0.75rem' }}>{c.id}</div>
                </td>
                <td>{formatDate(c.startDate)}</td>
                <td>{c.endDate ? formatDate(c.endDate) : <span style={{ color: 'var(--text-muted)' }}>Permanent</span>}</td>
                <td>
                  {c.remaining !== null ? (
                    <span style={{
                      fontWeight: 600,
                      color: c.remaining === 0 ? 'var(--color-danger)' : c.remaining <= 60 ? 'var(--color-warning)' : 'var(--color-success)'
                    }}>
                      {c.remaining === 0 ? 'Expired' : `${c.remaining}d`}
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>∞</span>}
                </td>
                <td>
                  <span className={`badge ${c.active ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{c.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  {c.documentName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.82rem' }}>
                      <FileText size={14} />
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.documentName}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                  )}
                </td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {c.remarks || '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-sm btn-secondary" title="View" onClick={() => handleView(c)}><Eye size={14} /></button>
                    {c.active && c.endDate && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleRenew(c)}>
                        <RefreshCw size={14} /> Renew
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              if (num > totalPages) return null;
              return <button key={num} className={`pagination-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>;
            })}
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {/* View Contract Modal */}
      {showViewModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Contract Detail</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><span className="form-label">Contract ID</span><span style={{ fontFamily: 'monospace' }}>{selectedContract.id}</span></div>
                <div className="form-group"><span className="form-label">Employee Name</span><span>{selectedContract.name}</span></div>
                <div className="form-group"><span className="form-label">Start Date</span><span>{formatDate(selectedContract.startDate)}</span></div>
                <div className="form-group"><span className="form-label">End Date</span><span>{selectedContract.endDate ? formatDate(selectedContract.endDate) : 'Permanent'}</span></div>
                <div className="form-group"><span className="form-label">Remaining Days</span><span>{selectedContract.remaining !== null ? (selectedContract.remaining === 0 ? 'Expired' : `${selectedContract.remaining} days`) : '∞'}</span></div>
                <div className="form-group"><span className="form-label">Active</span><span className={`badge ${selectedContract.active ? 'success' : 'danger'}`}>{selectedContract.active ? 'Yes' : 'No'}</span></div>
                <div className="form-group full-width"><span className="form-label">Remarks</span><span>{selectedContract.remarks || '—'}</span></div>
                <div className="form-group full-width">
                  <span className="form-label">Contract Document</span>
                  {selectedContract.documentName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
                      <FileText size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{selectedContract.documentName}</span>
                      <span className="badge success" style={{ marginLeft: 'auto' }}>Uploaded</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Upload size={16} />
                      <span>No document uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract History */}
              <div className="form-section-title" style={{ marginTop: '20px' }}>Contract History for {selectedContract.name}</div>
              {allContracts.filter(c => c.name === selectedContract.name).map(c => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: c.id === selectedContract.id ? 'var(--color-primary-bg)' : 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)', marginBottom: '6px', fontSize: '0.85rem',
                  border: c.id === selectedContract.id ? '1px solid var(--color-primary)' : '1px solid transparent'
                }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', marginRight: '10px' }}>{c.id}</span>
                    <span>{c.startDate ? formatDate(c.startDate) : '—'} → {c.endDate ? formatDate(c.endDate) : 'Permanent'}</span>
                    {c.documentName && <FileText size={12} style={{ marginLeft: '8px', color: 'var(--color-primary)' }} />}
                  </div>
                  <span className={`badge ${c.active ? 'success' : 'neutral'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Contract</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Employee Name & ID *</label>
                  <input 
                    className="form-input" 
                    placeholder="Search employee..." 
                    list="employee-names"
                    value={addForm.name} 
                    onChange={e => {
                      const val = e.target.value;
                      setAddForm(prev => {
                        const next = { ...prev, name: val };
                        const empIdMatch = val.match(/\(([^)]+)\)/);
                        if (empIdMatch) {
                          const empId = empIdMatch[1];
                          const emp = employees.find(e => e.id === empId);
                          if (emp && emp.joinDate) {
                            next.startDate = emp.joinDate;
                          }
                        }
                        return next;
                      });
                    }} 
                  />
                  <datalist id="employee-names">
                    {employees.map((emp) => (
                      <option key={emp.id} value={`${emp.name} (${emp.id})`} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={addForm.startDate} onChange={e => setAddForm({...addForm, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={addForm.endDate} onChange={e => setAddForm({...addForm, endDate: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" placeholder="Additional notes" value={addForm.remarks} onChange={e => setAddForm({...addForm, remarks: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Upload Contract Document</label>
                  <div style={{
                    border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                    padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: addForm.document ? 'var(--color-primary-bg)' : 'var(--bg-tertiary)',
                    transition: 'all 0.2s ease',
                  }}
                    onClick={() => document.getElementById('add-contract-file').click()}
                  >
                    <input id="add-contract-file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(e, 'add')} />
                    {addForm.document ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: 500 }}>{addForm.document.name}</span>
                        <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setAddForm(prev => ({ ...prev, document: null })); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click to upload contract document</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>PDF, DOC, DOCX, JPG, PNG</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                try {
                  const empIdMatch = addForm.name.match(/\(([^)]+)\)/);
                  const empId = empIdMatch ? empIdMatch[1] : null;
                  
                  await api.post('/master-data/contracts', {
                    employeeId: empId,
                    type: 'Contract Fulltime',
                    startDate: addForm.startDate,
                    endDate: addForm.endDate || null,
                  });
                  
                  setShowAddModal(false);
                  setAddForm({ name: '', startDate: '', endDate: '', remarks: '', document: null });
                  fetchData();
                  toast.success('Contract Added', 'New contract has been saved successfully.');
                } catch (err) {
                  toast.error('Add Failed', err.message);
                }
              }}>Save Contract</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Contract Modal */}
      {showRenewModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Renew Contract — {selectedContract.name}</h2>
              <button className="modal-close" onClick={() => setShowRenewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--color-warning-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                ⚠️ The current contract ({selectedContract.id}) will be deactivated. A new contract will be created with the dates below.
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Previous End Date</label>
                  <input className="form-input" value={selectedContract.endDate ? formatDate(selectedContract.endDate) : 'N/A'} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Previous Contract ID</label>
                  <input className="form-input" value={selectedContract.id} disabled style={{ opacity: 0.6, fontFamily: 'monospace' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Start Date *</label>
                  <input type="date" className="form-input" value={renewForm.startDate}
                    onChange={e => setRenewForm({...renewForm, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">New End Date *</label>
                  <input type="date" className="form-input" value={renewForm.endDate}
                    onChange={e => setRenewForm({...renewForm, endDate: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" placeholder="Renewal notes" value={renewForm.remarks}
                    onChange={e => setRenewForm({...renewForm, remarks: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Upload Renewal Contract Document</label>
                  <div style={{
                    border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                    padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: renewForm.document ? 'var(--color-primary-bg)' : 'var(--bg-tertiary)',
                    transition: 'all 0.2s ease',
                  }}
                    onClick={() => document.getElementById('renew-contract-file').click()}
                  >
                    <input id="renew-contract-file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => handleFileChange(e, 'renew')} />
                    {renewForm.document ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: 500 }}>{renewForm.document.name}</span>
                        <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setRenewForm(prev => ({ ...prev, document: null })); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click to upload renewal contract document</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>PDF, DOC, DOCX, JPG, PNG</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmRenew}>
                <RefreshCw size={16} /> Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
