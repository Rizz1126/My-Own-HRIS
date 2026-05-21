import { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
import { api } from '../../utils/api';
import { getInitials, formatDate } from '../../utils/formatters';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';

export default function Employees() {
  const { employees, isLoadingEmployees, updateEmployee, setEmployees } = useEmployees();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', position: '', status: 'Active', joinDate: '' });
  const perPage = 10;

  const formatEmployee = (emp) => ({
    ...emp,
    department: typeof emp.department === 'string'
      ? { name: emp.department }
      : emp.department || { name: '' },
  });
  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.name || '',
      email: emp.email || '',
      department: typeof emp.department === 'string' ? emp.department : emp.department?.name || '',
      position: emp.position || '',
      status: emp.status || 'Active',
      joinDate: emp.joinDate || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    const payload = {
      name: editForm.name,
      email: editForm.email,
      position: editForm.position,
      status: editForm.status,
      joinDate: editForm.joinDate,
    };

    try {
      const updated = await updateEmployee(selectedEmployee.id, payload);
      setSelectedEmployee(formatEmployee({ ...selectedEmployee, ...updated }));
      setShowEditModal(false);
      toast.success('Employee Updated', `${editForm.name}'s details have been saved.`);
    } catch (err) {
      toast.error('Update Failed', 'Failed to save employee changes.');
      console.error(err);
    }
  };

  const handleDelete = (emp) => {
    const confirmDelete = window.confirm(`Delete ${emp.name}?`);
    if (confirmDelete) {
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
    }
  };


  const departmentsList = ['All', ...new Set(employees.map((e) => typeof e.department === 'string' ? e.department : e.department?.name || 'Unassigned'))];

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.toLowerCase().includes(search.toLowerCase());
    const departmentName = typeof emp.department === 'string' ? emp.department : emp.department?.name || '';
    const matchDept = deptFilter === 'All' || departmentName === deptFilter;
    const matchStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (isLoadingEmployees) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employee database...</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Employee Database</h1>
          <p className="page-subtitle">{filtered.length} employees found</p>
        </div>
        <button className="btn btn-primary"><Plus size={18} /> Add Employee</button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          {departmentsList.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Position</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="table-avatar">
                    <div className="table-avatar-img" style={{ background: emp.avatarColor }}>{getInitials(emp.name)}</div>
                    <div>
                      <div className="table-name">{emp.name}</div>
                      <div className="table-sub">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.id}</td>
                <td>{typeof emp.department === 'string' ? emp.department : emp.department?.name || 'Unassigned'}</td>
                <td>{emp.position}</td>
                <td>{formatDate(emp.joinDate)}</td>
                <td><span className={`badge ${emp.status === 'Active' ? 'success' : 'danger'}`}><span className="badge-dot" />{emp.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => handleView(emp)}><Eye size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => handleEdit(emp)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Delete" onClick={() => handleDelete(emp)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>

      {showViewModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Employee details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width"><span className="form-label">Name</span><span>{selectedEmployee.name}</span></div>
                <div className="form-group full-width"><span className="form-label">Email</span><span>{selectedEmployee.email}</span></div>
                <div className="form-group"><span className="form-label">Department</span><span>{typeof selectedEmployee.department === 'string' ? selectedEmployee.department : selectedEmployee.department?.name || 'Unassigned'}</span></div>
                <div className="form-group"><span className="form-label">Position</span><span>{selectedEmployee.position}</span></div>
                <div className="form-group"><span className="form-label">Status</span><span>{selectedEmployee.status}</span></div>
                <div className="form-group"><span className="form-label">Join Date</span><span>{selectedEmployee.joinDate ? formatDate(selectedEmployee.joinDate) : '-'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Employee — {selectedEmployee.name}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={editForm.department} onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="form-input" value={editForm.position} onChange={(e) => setEditForm((prev) => ({ ...prev, position: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input type="date" className="form-input" value={editForm.joinDate} onChange={(e) => setEditForm((prev) => ({ ...prev, joinDate: e.target.value }))} />
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
    </div>
  );
}
