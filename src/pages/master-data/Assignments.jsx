import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, X } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { DEPARTMENTS } from '../../utils/constants';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';

export default function Assignments() {
  const { employees: ctxEmployees, isLoadingEmployees } = useEmployees();
  const [localEmpFallback, setLocalEmpFallback] = useState([]);
  // Use context employees if available, fall back to locally fetched
  const employees = (ctxEmployees && ctxEmployees.length > 0) ? ctxEmployees : localEmpFallback;
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [allAssignments, setAllAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [a, p, c, e] = await Promise.all([
        api.get('/master-data/assignments'),
        api.get('/master-data/projects'),
        api.get('/master-data/clients'),
        api.get('/employees'),
      ]);
      setAllAssignments(a);
      setProjects(p);
      setClients(c);
      if (e && e.length > 0) setLocalEmpFallback(e);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [form, setForm] = useState({
    employeeId: '', projectId: '', departmentId: '',
    role: '', startDate: '', endDate: '', allocation: 100, active: true,
  });

  const [editForm, setEditForm] = useState({
    employeeId: '', projectId: '', departmentId: '',
    role: '', startDate: '', endDate: '', allocation: 100, active: true,
  });

  // Auto-derive client from selected project
  const getClientForProject = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    return proj?.client?.name || proj?.clientName || '';
  };

  const filtered = allAssignments.filter((a) => {
    const q = search.toLowerCase();
    const empName = a.employee?.name || '';
    const projName = a.project?.name || a.department?.name || '';
    const clientName = a.client?.name || '-';
    
    const matchSearch = empName.toLowerCase().includes(q) ||
      projName.toLowerCase().includes(q) ||
      clientName.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q);
    const matchActive = activeFilter === 'All' || (activeFilter === 'Yes' ? a.active : !a.active);
    return matchSearch && matchActive;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assignments...</div>;

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setEditForm({
      employeeId: assignment.employee?.id || '',
      projectId: assignment.project?.id || '',
      departmentId: assignment.department?.id || '',
      role: assignment.role,
      startDate: assignment.startDate || '',
      endDate: assignment.endDate || '',
      allocation: assignment.allocation || 100,
      active: assignment.active,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        employeeId: editForm.employeeId || undefined,
        projectId: editForm.projectId || null,
        departmentId: editForm.departmentId || null,
        role: editForm.role,
        startDate: editForm.startDate,
        endDate: editForm.endDate || null,
        allocation: editForm.allocation,
        active: editForm.active,
      };
      await api.patch(`/master-data/assignments/${selectedAssignment.id}`, payload);
      setShowEditModal(false);
      fetchData();
      toast.success('Assignment Updated', 'Assignment has been saved successfully.');
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to save assignment');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">{filtered.length} assignments found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Assignment</button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search by name, project, client, role, or status..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="All">All Assignments</option>
          <option value="Yes">Active Only</option>
          <option value="No">Inactive Only</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Project / Department</th>
              <th>Client</th>
              <th>Role</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Allocation</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr key={a.id} style={{ opacity: a.active ? 1 : 0.6 }}>
                <td>
                  <div className="table-name">{a.employee?.name || 'Unknown'}</div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{a.employee?.position || 'N/A'}</td>
                <td>
                  <span style={{ fontWeight: 500 }}>{a.project?.name || a.department?.name || 'N/A'}</span>
                </td>
                <td style={{ color: !a.client?.name ? 'var(--text-muted)' : 'var(--text-primary)' }}>{a.client?.name || '-'}</td>
                <td><span className="badge info">{a.role}</span></td>
                <td>{formatDate(a.startDate)}</td>
                <td>{a.endDate ? formatDate(a.endDate) : '—'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar-wrapper" style={{ width: '60px', height: '6px' }}>
                      <div className={`progress-bar-fill ${a.allocation >= 100 ? '' : a.allocation >= 50 ? 'warning' : 'danger'}`}
                        style={{ width: `${a.allocation}%` }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '35px' }}>{a.allocation}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${a.active ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{a.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => { setSelectedAssignment(a); setShowViewModal(true); }}><Eye size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => handleEdit(a)}><Edit size={15} /></button>
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

      {/* View Assignment Modal */}
      {showViewModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Assignment Detail</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><span className="form-label">Assignment ID</span><span style={{ fontFamily: 'monospace' }}>{selectedAssignment.id.slice(0, 8)}</span></div>
                <div className="form-group"><span className="form-label">Employee Name</span><span>{selectedAssignment.employee?.name}</span></div>
                <div className="form-group"><span className="form-label">Position</span><span>{selectedAssignment.employee?.position}</span></div>
                <div className="form-group"><span className="form-label">Project / Department</span><span>{selectedAssignment.project?.name || selectedAssignment.department?.name}</span></div>
                <div className="form-group"><span className="form-label">Client</span><span>{selectedAssignment.client?.name || '-'}</span></div>
                <div className="form-group"><span className="form-label">Role</span><span className="badge info">{selectedAssignment.role}</span></div>
                <div className="form-group"><span className="form-label">Start Date</span><span>{formatDate(selectedAssignment.startDate)}</span></div>
                <div className="form-group"><span className="form-label">End Date</span><span>{selectedAssignment.endDate ? formatDate(selectedAssignment.endDate) : '—'}</span></div>
                <div className="form-group"><span className="form-label">Allocation</span><span style={{ fontWeight: 600 }}>{selectedAssignment.allocation}%</span></div>
                <div className="form-group"><span className="form-label">Active</span><span className={`badge ${selectedAssignment.active ? 'success' : 'danger'}`}>{selectedAssignment.active ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit size={20} style={{ color: 'var(--color-primary)' }} />
                  Edit Assignment — {selectedAssignment.employee?.name}
                </div>
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select className="form-select" value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId: e.target.value})}>
                    <option value="">— Select employee —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.position || ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project (External)</label>
                  <select className="form-select" value={editForm.projectId} onChange={e => setEditForm({...editForm, projectId: e.target.value, departmentId: ''})}>
                    <option value="">— Select project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.projectName}</option>
                    ))}
                  </select>
                  {editForm.projectId && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Client: {getClientForProject(editForm.projectId) || '—'}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input className="form-input" placeholder="Role in assignment" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Allocation (%)</label>
                  <input type="number" className="form-input" min="0" max="100" value={editForm.allocation} onChange={e => setEditForm({...editForm, allocation: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
                </div>

                <div className="form-divider" />

                <div className="form-group">
                  <label className="form-label">Active</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${editForm.active ? 'active' : ''}`} onClick={() => setEditForm({...editForm, active: !editForm.active})} />
                    <span className="toggle-label">{editForm.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Assignment</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select className="form-select" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                    <option value="">— Select employee —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.position || ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project (External)</label>
                  <select className="form-select" value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value, departmentId: ''})}>
                    <option value="">— Select project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.projectName}</option>
                    ))}
                  </select>
                  {form.projectId && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Client: {getClientForProject(form.projectId) || '—'}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input className="form-input" placeholder="Role in assignment" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Allocation (%)</label>
                  <input type="number" className="form-input" min="0" max="100" value={form.allocation} onChange={e => setForm({...form, allocation: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if (!form.employeeId || !form.role || !form.startDate) {
                  toast.warning('Validation Error', 'Employee, Role, and Start Date are required.');
                  return;
                }
                try {
                  await api.post('/master-data/assignments', {
                    employeeId: form.employeeId,
                    projectId: form.projectId || null,
                    departmentId: form.departmentId || null,
                    role: form.role,
                    startDate: form.startDate,
                    endDate: form.endDate || null,
                    allocation: form.allocation,
                    active: true,
                  });
                  setShowAddModal(false);
                  setForm({ employeeId: '', projectId: '', departmentId: '', role: '', startDate: '', endDate: '', allocation: 100, active: true });
                  fetchData();
                  toast.success('Assignment Added', 'New assignment has been created successfully.');
                } catch (err) {
                  toast.error('Add Failed', err.message || 'Failed to add assignment');
                }
              }}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
