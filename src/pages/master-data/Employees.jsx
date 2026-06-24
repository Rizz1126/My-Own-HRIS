import { useState, useMemo } from 'react';
import { Search, Plus, Eye, Edit, DollarSign, Download, X, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatters';
import { calculateRemuneration } from '../../utils/taxCalculator';
import { useAuth } from '../../context/AuthContext';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';

const ROLE_CODES = {
  'Super Admin': '1',
  'Admin': '2',
  'Employee': '3'
};

const DIRECTORATES = {
  'Technology': { code: '01', divisions: ['Engineering', 'Product', 'Design', 'Data'] },
  'HR & Admin': { code: '02', divisions: ['Talent Acquisition', 'Payroll', 'General Affair'] },
  'Finance': { code: '03', divisions: ['Accounting', 'Tax', 'Treasury'] },
  'Operations': { code: '04', divisions: ['Customer Support', 'Logistics'] },
  'Sales & Marketing': { code: '05', divisions: ['Sales', 'Digital Marketing', 'Partnership'] },
};

const getDirectorateByDivision = (divisionName) => {
  for (const [dir, data] of Object.entries(DIRECTORATES)) {
    if (data.divisions.includes(divisionName)) return dir;
  }
  return '';
};

const getStatusBadge = (status) => {
  const map = {
    'Contract Fulltime': 'contract-ft',
    'Contract Part-time': 'contract-pt',
    'Internship': 'internship',
    'Permanent': 'permanent',
  };
  return map[status] || 'neutral';
};

export default function Employees() {
  const { user, updateUser } = useAuth();
  const { employees, isLoadingEmployees, updateEmployee, refreshEmployees } = useEmployees();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemunerationModal, setShowRemunerationModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const perPage = 10;

  const employeesData = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      idNumber: emp.id,
      name: emp.name,
      email: emp.email,
      nik: emp.nik,
      avatarColor: '#6366F1',
      status: emp.status || 'Contract Fulltime',
      level: emp.level || 'Staff',
      position: emp.position || '',
      project: emp.projectName || 'Not Assigned',
      active: emp.active !== false,
      sendPayslip: emp.sendPayslip !== false,
      department: typeof emp.department === 'string' ? emp.department : emp.department?.name || 'Unknown',
      joinDate: emp.joinDate,
      salary: emp.baseSalary ?? 0,
      allowances: emp.allowances || [],
      gender: emp.gender || 'Male',
      npwp: emp.npwp || '-',
      dependents: emp.dependents ?? 0,
      maritalStatus: emp.maritalStatus || 'Single',
      bankName: emp.bankName || '-',
      bankAccountNumber: emp.bankAccountNumber ?? '-',
      bankAccountName: emp.bankAccountName || '-',
      bankRemark: emp.bankRemark || '',
    }));
  }, [employees]);

  const formatEmployee = (emp) => ({
    id: emp.id,
    idNumber: emp.idNumber || emp.id,
    name: emp.name,
    email: emp.email,
    nik: emp.nik,
    avatarColor: emp.avatarColor || '#6366F1',
    status: emp.status || 'Contract Fulltime',
    level: emp.level || 'Staff',
    position: emp.position || '',
    project: emp.projectName || emp.project || 'Not Assigned',
    active: emp.active !== false,
    sendPayslip: emp.sendPayslip !== false,
    department: typeof emp.department === 'string' ? emp.department : emp.department?.name || 'Unknown',
    joinDate: emp.joinDate,
    salary: emp.salary ?? emp.baseSalary ?? 0,
    allowances: emp.allowances || [],
    gender: emp.gender || 'Male',
    npwp: emp.npwp || '-',
    dependents: emp.dependents ?? 0,
    maritalStatus: emp.maritalStatus || 'Single',
    bankName: emp.bankName || '-',
    bankAccountNumber: emp.bankAccountNumber ?? '-',
    bankAccountName: emp.bankAccountName || '-',
    bankRemark: emp.bankRemark || '',
    extendPlan: emp.extendPlan || false,
  });

  const isLoading = isLoadingEmployees;

  // Add employee form state
  const [form, setForm] = useState({
    name: '', joinDate: '', gender: 'Male', nik: '', npwp: '',
    role: 'Employee', division: '', directorate: '', generatedId: '',
    employmentStatus: 'Contract Fulltime', dependents: 0, maritalStatus: 'Single',
    active: true, extendPlan: false, sendPayslip: true,
    bankAccountNumber: '', bankAccountName: '', bankName: '', bankRemark: '',
  });

  // Calculate Employee ID when dependencies change
  const generateEmployeeId = (role, directorate, joinDate) => {
    if (!role || !directorate || !joinDate) return '';
    const roleCode = ROLE_CODES[role] || '3';
    const dirCode = DIRECTORATES[directorate]?.code || '00';
    const year = new Date(joinDate).getFullYear().toString().slice(-2);
    // Mock sequential number for demo
    const sequence = String(Math.floor(Math.random() * 99) + 1).padStart(3, '0');
    return `${roleCode}-${dirCode}-${year}-${sequence}`;
  };

  const handleDivisionChange = (div) => {
    const dir = getDirectorateByDivision(div);
    setForm(prev => {
      const next = { ...prev, division: div, directorate: dir };
      next.generatedId = generateEmployeeId(next.role, next.directorate, next.joinDate);
      return next;
    });
  };

  const handleRoleDateChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      next.generatedId = generateEmployeeId(next.role, next.directorate, next.joinDate);
      return next;
    });
  };

  // Edit employee form state
  const [editForm, setEditForm] = useState({
    name: '', joinDate: '', gender: 'Male', nik: '', npwp: '',
    position: '', level: '', project: '',
    employmentStatus: 'Contract Fulltime', dependents: 0, maritalStatus: 'Single',
    active: true, extendPlan: false, sendPayslip: true,
    bankAccountNumber: '', bankAccountName: '', bankName: '', bankRemark: '',
  });

  // Remuneration form state
  const [remuForm, setRemuForm] = useState({
    salary: 0,
    allowances: [],
    dependents: 0,
  });

  const filtered = employeesData.filter((emp) => {
    const matchSearch = emp.name?.toLowerCase().includes(search.toLowerCase()) || emp.idNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = 
      statusFilter === 'All' ? true :
      statusFilter === 'Active' ? emp.active === true :
      statusFilter === 'Inactive' ? emp.active === false :
      emp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleRemuneration = (emp) => {
    setSelectedEmployee(emp);
    setRemuForm({
      salary: emp.salary || emp.baseSalary || 0,
      allowances: [...(emp.allowances || [])],
      dependents: emp.dependents ?? 0,
    });
    setShowRemunerationModal(true);
  };

  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.name,
      joinDate: emp.joinDate,
      gender: emp.gender,
      nik: emp.nik,
      npwp: emp.npwp,
      position: emp.position,
      level: emp.level,
      project: emp.project,
      employmentStatus: emp.status,
      dependents: emp.dependents,
      maritalStatus: emp.maritalStatus,
      active: emp.active ?? true,
      extendPlan: emp.extendPlan ?? false,
      sendPayslip: emp.sendPayslip ?? true,
      bankAccountNumber: emp.bankAccountNumber,
      bankAccountName: emp.bankAccountName,
      bankName: emp.bankName,
      bankRemark: emp.bankRemark,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;
    const payload = {
      name: editForm.name,
      joinDate: editForm.joinDate,
      gender: editForm.gender,
      nik: editForm.nik,
      npwp: editForm.npwp,
      position: editForm.position,
      level: editForm.level,
      project: editForm.project,
      status: editForm.employmentStatus,
      dependents: editForm.dependents,
      maritalStatus: editForm.maritalStatus,
      active: editForm.active,
      extendPlan: editForm.extendPlan,
      sendPayslip: editForm.sendPayslip,
      bankAccountNumber: editForm.bankAccountNumber,
      bankAccountName: editForm.bankAccountName,
      bankName: editForm.bankName,
      bankRemark: editForm.bankRemark,
    };

    try {
      const updated = await updateEmployee(selectedEmployee.id, payload);
      setSelectedEmployee((prev) => prev ? formatEmployee({ ...prev, ...updated }) : prev);

      const employeeIdValue = user?.employeeId ? String(user.employeeId) : null;
      const selectedId = selectedEmployee ? String(selectedEmployee.id) : null;
      const selectedIdNumber = selectedEmployee ? String(selectedEmployee.idNumber) : null;
      const currentEmployeeMatch = employeeIdValue && (employeeIdValue === selectedId || employeeIdValue === selectedIdNumber);
      if (currentEmployeeMatch) {
        updateUser({ name: updated.name });
      }

      setShowEditModal(false);
      toast.success('Employee Updated', `${editForm.name}'s data has been saved successfully.`);
    } catch (err) {
      toast.error('Update Failed', err.message || 'Failed to save employee changes.');
      console.error(err);
    }
  };

  const remuCalc = calculateRemuneration(
    remuForm.salary,
    remuForm.allowances,
    selectedEmployee?.maritalStatus || 'Single',
    remuForm.dependents
  );

  const handleSaveRemuneration = async () => {
    if (!selectedEmployee) return;
    try {
      await updateEmployee(selectedEmployee.id, {
        baseSalary: remuForm.salary,
      });
      setShowRemunerationModal(false);
      toast.success('Remuneration Saved', `Salary data for ${selectedEmployee.name} has been updated.`);
    } catch (err) {
      toast.error('Save Failed', err.message || 'Failed to save remuneration.');
    }
  };

  const addAllowance = () => {
    setRemuForm(prev => ({
      ...prev,
      allowances: [...prev.allowances, { name: '', amount: 0 }]
    }));
  };

  const removeAllowance = (idx) => {
    setRemuForm(prev => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== idx)
    }));
  };

  const updateAllowance = (idx, field, value) => {
    setRemuForm(prev => ({
      ...prev,
      allowances: prev.allowances.map((a, i) => i === idx ? { ...a, [field]: field === 'amount' ? Number(value) : value } : a)
    }));
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{filtered.length} employees found</p>
        </div>
        <div className="master-actions">
          <button className="btn btn-secondary" onClick={() => {
            const rows = [
              ['ID', 'Name', 'Email', 'NIK', 'Position', 'Status', 'Level', 'Department', 'Join Date', 'Active'],
              ...employeesData.map(e => [e.idNumber, e.name, e.email, e.nik, e.position, e.status, e.level, e.department, e.joinDate, e.active ? 'Yes' : 'No'])
            ];
            const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'employees.csv'; a.click();
          }}><Download size={16} /> Export Employee</button>
          <button className="btn btn-secondary" onClick={() => {
            const rows = [
              ['ID', 'Name', 'Position', 'Bank', 'Account Number', 'Account Name', 'Base Salary', 'Marital Status', 'Dependents'],
              ...employeesData.map(e => [e.idNumber, e.name, e.position, e.bankName, e.bankAccountNumber, e.bankAccountName, e.salary, e.maritalStatus, e.dependents])
            ];
            const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'salaries.csv'; a.click();
          }}><Download size={16} /> Export Salaries</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={18} /> Add Employee</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input type="text" className="filter-search-input" placeholder="Search by name or ID..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Contract Fulltime">Contract Fulltime</option>
          <option value="Contract Part-time">Contract Part-time</option>
          <option value="Internship">Internship</option>
          <option value="Permanent">Permanent</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID Number</th>
              <th>Position</th>
              <th>Status</th>
              <th>Level</th>
              <th>Active</th>
              <th>Project</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading employees...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No employees found.
                </td>
              </tr>
            ) : paginated.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="table-avatar">
                    <div className="table-avatar-img" style={{ background: emp.avatarColor }}>{getInitials(emp.name)}</div>
                    <div className="table-name">{emp.name}</div>
                  </div>
                </td>
                <td><code className="text-xs font-mono">{emp.idNumber}</code></td>
                <td>{emp.position}</td>
                <td><span className={`badge ${getStatusBadge(emp.status)}`}>{emp.status}</span></td>
                <td>{emp.level}</td>
                <td>
                  <span className={`badge ${emp.active ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{emp.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{emp.project}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-icon btn-secondary btn-sm" title="View" onClick={() => handleView(emp)}><Eye size={15} /></button>
                    <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => handleEdit(emp)}><Edit size={15} /></button>
                    <button className="btn btn-icon btn-sm" title="Remuneration" onClick={() => handleRemuneration(emp)}
                      style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><DollarSign size={15} /></button>
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

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Employee Detail — {selectedEmployee.name}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><span className="form-label">ID Number</span><span>{selectedEmployee.idNumber}</span></div>
                <div className="form-group"><span className="form-label">Full Name</span><span>{selectedEmployee.name}</span></div>
                <div className="form-group"><span className="form-label">Gender</span><span>{selectedEmployee.gender}</span></div>
                <div className="form-group"><span className="form-label">NIK</span><span style={{ fontFamily: 'monospace' }}>{selectedEmployee.nik}</span></div>
                <div className="form-group"><span className="form-label">NPWP</span><span style={{ fontFamily: 'monospace' }}>{selectedEmployee.npwp}</span></div>
                <div className="form-group"><span className="form-label">Join Date</span><span>{formatDate(selectedEmployee.joinDate)}</span></div>
                <div className="form-group"><span className="form-label">Employment Status</span><span className={`badge ${getStatusBadge(selectedEmployee.status)}`}>{selectedEmployee.status}</span></div>
                <div className="form-group"><span className="form-label">Level</span><span>{selectedEmployee.level}</span></div>
                <div className="form-group"><span className="form-label">Position</span><span>{selectedEmployee.position}</span></div>
                <div className="form-group"><span className="form-label">Project</span><span>{selectedEmployee.project}</span></div>
                <div className="form-group"><span className="form-label">Marital Status</span><span>{selectedEmployee.maritalStatus}</span></div>
                <div className="form-group"><span className="form-label">Dependents</span><span>{selectedEmployee.dependents}</span></div>
                <div className="form-group"><span className="form-label">Active</span><span className={`badge ${selectedEmployee.active ? 'success' : 'danger'}`}>{selectedEmployee.active ? 'Yes' : 'No'}</span></div>
                <div className="form-group"><span className="form-label">Send Payslip</span><span className={`badge ${selectedEmployee.sendPayslip ? 'success' : 'danger'}`}>{selectedEmployee.sendPayslip ? 'Yes' : 'No'}</span></div>
                <div className="form-group"><span className="form-label">Payslip Email</span><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedEmployee.email} <em>(auto from registered email)</em></span></div>
                <div className="form-section-title">Bank Account</div>
                <div className="form-group"><span className="form-label">Bank</span><span>{selectedEmployee.bankName}</span></div>
                <div className="form-group"><span className="form-label">Account Number</span><span style={{ fontFamily: 'monospace' }}>{selectedEmployee.bankAccountNumber}</span></div>
                <div className="form-group"><span className="form-label">Account Name</span><span>{selectedEmployee.bankAccountName}</span></div>
                <div className="form-group"><span className="form-label">Remark</span><span>{selectedEmployee.bankRemark || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date *</label>
                  <input type="date" className="form-input" value={form.joinDate} onChange={e => handleRoleDateChange('joinDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={e => handleRoleDateChange('role', e.target.value)}>
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Division *</label>
                  <select className="form-select" value={form.division} onChange={e => handleDivisionChange(e.target.value)}>
                    <option value="">Select division</option>
                    {Object.values(DIRECTORATES).flatMap(d => d.divisions).sort().map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Directorate <span style={{fontSize: '0.75rem', opacity: 0.6}}>(Auto-filled)</span></label>
                  <input className="form-input" value={form.directorate} disabled style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID <span style={{fontSize: '0.75rem', opacity: 0.6}}>(Auto-generated)</span></label>
                  <input className="form-input" value={form.generatedId} disabled placeholder="e.g. 1-01-26-001" style={{ background: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--color-primary)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">NIK *</label>
                  <input className="form-input" placeholder="16-digit NIK" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">NPWP *</label>
                  <input className="form-input" placeholder="NPWP number" value={form.npwp} onChange={e => setForm({...form, npwp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Employment Status *</label>
                  <select className="form-select" value={form.employmentStatus} onChange={e => setForm({...form, employmentStatus: e.target.value})}>
                    <option value="Contract Fulltime">Contract Fulltime</option>
                    <option value="Contract Part-time">Contract Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Permanent">Permanent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dependents *</label>
                  <select className="form-select" value={form.dependents} onChange={e => setForm({...form, dependents: Number(e.target.value)})}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marital Status *</label>
                  <select className="form-select" value={form.maritalStatus} onChange={e => setForm({...form, maritalStatus: e.target.value})}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>

                <div className="form-divider" />

                <div className="form-group">
                  <label className="form-label">Active</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${form.active ? 'active' : ''}`} onClick={() => setForm({...form, active: !form.active})} />
                    <span className="toggle-label">{form.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Extend Plan</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${form.extendPlan ? 'active' : ''}`} onClick={() => setForm({...form, extendPlan: !form.extendPlan})} />
                    <span className="toggle-label">{form.extendPlan ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Send Payslip</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${form.sendPayslip ? 'active' : ''}`} onClick={() => setForm({...form, sendPayslip: !form.sendPayslip})} />
                    <span className="toggle-label">{form.sendPayslip ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Payslip will be sent to registered email</div>
                </div>

                <div className="form-section-title">Bank Account</div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input className="form-input" placeholder="Account number" value={form.bankAccountNumber} onChange={e => setForm({...form, bankAccountNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input className="form-input" placeholder="Account holder name" value={form.bankAccountName} onChange={e => setForm({...form, bankAccountName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank</label>
                  <select className="form-select" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})}>
                    <option value="">Select bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Danamon">Danamon</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remark</label>
                  <input className="form-input" placeholder="Optional note" value={form.bankRemark} onChange={e => setForm({...form, bankRemark: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                try {
                  // Simplistic mapping for pilot
                  await api.post('/employees', {
                    id: form.generatedId,
                    name: form.name,
                    email: form.name.toLowerCase().replace(/\s+/g, '.') + '@example.com',
                    nik: form.nik,
                    npwp: form.npwp,
                    position: form.role,
                    level: 'Staff',
                    departmentId: null, // Hardcoded or omitted for now
                    joinDate: form.joinDate,
                    baseSalary: 0,
                    status: form.employmentStatus,
                    dependents: form.dependents,
                    active: form.active,
                    extendPlan: form.extendPlan,
                    sendPayslip: form.sendPayslip,
                    bankAccountNumber: form.bankAccountNumber,
                    bankAccountName: form.bankAccountName,
                    bankName: form.bankName,
                    bankRemark: form.bankRemark
                  });
                  setShowAddModal(false);
                  await refreshEmployees(); // Refresh list
                  toast.success('Employee Added', `${form.name} has been added successfully.`);
                } catch (err) {
                  toast.error('Add Failed', err.message);
                }
              }}>Save Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="table-avatar-img" style={{ background: selectedEmployee.avatarColor, width: 36, height: 36, fontSize: '0.8rem' }}>{getInitials(selectedEmployee.name)}</div>
                  Edit Employee — {selectedEmployee.idNumber}
                </div>
              </h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="Full name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date *</label>
                  <input type="date" className="form-input" value={editForm.joinDate} onChange={e => setEditForm({...editForm, joinDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-select" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">NIK *</label>
                  <input className="form-input" placeholder="16-digit NIK" value={editForm.nik} onChange={e => setEditForm({...editForm, nik: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">NPWP *</label>
                  <input className="form-input" placeholder="NPWP number" value={editForm.npwp} onChange={e => setEditForm({...editForm, npwp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="form-input" placeholder="Position" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-select" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})}>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employment Status *</label>
                  <select className="form-select" value={editForm.employmentStatus} onChange={e => setEditForm({...editForm, employmentStatus: e.target.value})}>
                    <option value="Contract Fulltime">Contract Fulltime</option>
                    <option value="Contract Part-time">Contract Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Permanent">Permanent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dependents *</label>
                  <select className="form-select" value={editForm.dependents} onChange={e => setEditForm({...editForm, dependents: Number(e.target.value)})}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marital Status *</label>
                  <select className="form-select" value={editForm.maritalStatus} onChange={e => setEditForm({...editForm, maritalStatus: e.target.value})}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </select>
                </div>

                <div className="form-divider" />

                <div className="form-group">
                  <label className="form-label">Active</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${editForm.active ? 'active' : ''}`} onClick={() => setEditForm({...editForm, active: !editForm.active})} />
                    <span className="toggle-label">{editForm.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Extend Plan</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${editForm.extendPlan ? 'active' : ''}`} onClick={() => setEditForm({...editForm, extendPlan: !editForm.extendPlan})} />
                    <span className="toggle-label">{editForm.extendPlan ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Send Payslip</label>
                  <div className="toggle-wrapper">
                    <button className={`toggle ${editForm.sendPayslip ? 'active' : ''}`} onClick={() => setEditForm({...editForm, sendPayslip: !editForm.sendPayslip})} />
                    <span className="toggle-label">{editForm.sendPayslip ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Payslip will be sent to registered email</div>
                </div>

                <div className="form-section-title">Bank Account</div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input className="form-input" placeholder="Account number" value={editForm.bankAccountNumber} onChange={e => setEditForm({...editForm, bankAccountNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input className="form-input" placeholder="Account holder name" value={editForm.bankAccountName} onChange={e => setEditForm({...editForm, bankAccountName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank</label>
                  <select className="form-select" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})}>
                    <option value="">Select bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Danamon">Danamon</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remark</label>
                  <input className="form-input" placeholder="Optional note" value={editForm.bankRemark} onChange={e => setEditForm({...editForm, bankRemark: e.target.value})} />
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

      {/* Remuneration Modal */}
      {showRemunerationModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowRemunerationModal(false)}>
          <div className="modal-content wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="table-avatar-img" style={{ background: selectedEmployee.avatarColor, width: 36, height: 36, fontSize: '0.8rem' }}>{getInitials(selectedEmployee.name)}</div>
                  Remuneration — {selectedEmployee.name}
                </div>
              </h2>
              <button className="modal-close" onClick={() => setShowRemunerationModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Base Salary</label>
                  <input type="number" className="form-input" value={remuForm.salary}
                    onChange={e => setRemuForm({...remuForm, salary: Number(e.target.value)})} />
                </div>

                <div className="form-section-title">Allowances</div>
                <div className="allowance-list">
                  {remuForm.allowances.map((a, idx) => (
                    <div key={idx} className="allowance-row">
                      <input className="form-input" placeholder="Allowance name" value={a.name}
                        onChange={e => updateAllowance(idx, 'name', e.target.value)} />
                      <input type="number" className="form-input" placeholder="Amount" value={a.amount}
                        onChange={e => updateAllowance(idx, 'amount', e.target.value)} />
                      <button className="allowance-remove-btn" onClick={() => removeAllowance(idx)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button className="add-allowance-btn" onClick={addAllowance}>
                    <Plus size={14} /> Add Allowance
                  </button>
                </div>

                <div className="form-divider" />

                <div className="form-group">
                  <label className="form-label">Marital Status (from employee data)</label>
                  <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    {selectedEmployee?.maritalStatus || 'Single'} — used for PPh 21 calculation
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dependents</label>
                  <select className="form-select" value={remuForm.dependents}
                    onChange={e => setRemuForm({...remuForm, dependents: Number(e.target.value)})}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>

              <div className="remuneration-summary" style={{ marginTop: '20px' }}>
                <div className="remuneration-row">
                  <span className="remuneration-label">Base Salary</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.salary)}</span>
                </div>
                <div className="remuneration-row">
                  <span className="remuneration-label">Total Allowances</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.totalAllowances)}</span>
                </div>
                {remuForm.allowances.map((a, i) => (
                  <div key={i} className="remuneration-row sub">
                    <span className="remuneration-label">{a.name || 'Unnamed'}</span>
                    <span className="remuneration-value">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
                <div className="remuneration-row" style={{ fontWeight: 600 }}>
                  <span className="remuneration-label">Gross Monthly</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.grossMonthly)}</span>
                </div>

                <div style={{ marginTop: '12px', marginBottom: '4px', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Deductions
                </div>
                <div className="remuneration-row deduction">
                  <span className="remuneration-label">PPh 21 (TER {(remuCalc.pph21.rate * 100).toFixed(2)}%)</span>
                  <span className="remuneration-value negative">- {formatCurrency(remuCalc.pph21.amount)}</span>
                </div>
                <div className="remuneration-row deduction">
                  <span className="remuneration-label">BPJS Kesehatan (Employee 1%)</span>
                  <span className="remuneration-value negative">- {formatCurrency(remuCalc.bpjs.kesehatan.employee)}</span>
                </div>
                <div className="remuneration-row deduction">
                  <span className="remuneration-label">BPJS JHT (Employee 2%)</span>
                  <span className="remuneration-value negative">- {formatCurrency(remuCalc.bpjs.jht.employee)}</span>
                </div>
                <div className="remuneration-row deduction">
                  <span className="remuneration-label">BPJS JP (Employee 1%)</span>
                  <span className="remuneration-value negative">- {formatCurrency(remuCalc.bpjs.jp.employee)}</span>
                </div>

                <div style={{ marginTop: '12px', marginBottom: '4px', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Employer Cost
                </div>
                <div className="remuneration-row sub">
                  <span className="remuneration-label">BPJS Kesehatan (4%)</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.bpjs.kesehatan.employer)}</span>
                </div>
                <div className="remuneration-row sub">
                  <span className="remuneration-label">BPJS JKK (0.24%)</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.bpjs.jkk)}</span>
                </div>
                <div className="remuneration-row sub">
                  <span className="remuneration-label">BPJS JKM (0.30%)</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.bpjs.jkm)}</span>
                </div>
                <div className="remuneration-row sub">
                  <span className="remuneration-label">BPJS JHT Employer (3.70%)</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.bpjs.jht.employer)}</span>
                </div>
                <div className="remuneration-row sub">
                  <span className="remuneration-label">BPJS JP Employer (2%)</span>
                  <span className="remuneration-value">{formatCurrency(remuCalc.bpjs.jp.employer)}</span>
                </div>

                <div className="remuneration-row total">
                  <span className="remuneration-label">Take Home Pay</span>
                  <span className="remuneration-value positive">{formatCurrency(remuCalc.takeHomePay)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRemunerationModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={handleSaveRemuneration}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
