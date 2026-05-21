import { useState, useEffect } from 'react';
import { X, Edit, Users, Mail, Phone, MapPin, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { getInitials, formatDate } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const LEVEL_ORDER = { 'Director': 0, 'Manager': 1, 'Senior': 2, 'Junior': 3, 'Staff': 4 };
const DEPT_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#14B8A6', '#EF4444', '#F97316', '#06B6D4',
];

function buildOrgTree(employees, departments) {
  // Group employees by department
  const deptMap = {};
  departments.forEach((dept, i) => {
    deptMap[dept.id] = {
      id: dept.id,
      name: dept.name,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
      employees: [],
    };
  });

  employees.forEach(emp => {
    const deptId = emp.department?.id || emp.departmentId;
    const deptName = typeof emp.department === 'string' ? emp.department : emp.department?.name;

    if (deptId && deptMap[deptId]) {
      deptMap[deptId].employees.push(emp);
    } else {
      // Try match by name
      const matched = Object.values(deptMap).find(d => d.name === deptName);
      if (matched) matched.employees.push(emp);
    }
  });

  // For each department, sort by level and build hierarchy
  return Object.values(deptMap).filter(d => d.employees.length > 0).map(dept => {
    const sorted = [...dept.employees].sort((a, b) =>
      (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99)
    );

    // Make first employee the dept head, rest as direct reports
    const [head, ...rest] = sorted;
    return {
      ...dept,
      head,
      members: rest,
    };
  });
}

function DeptCard({ dept, onMemberClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '16px',
      border: `1px solid ${dept.color}30`,
      overflow: 'hidden',
      minWidth: '260px',
      flex: '1 1 260px',
      maxWidth: '340px',
    }}>
      {/* Dept Header */}
      <div style={{
        background: `linear-gradient(135deg, ${dept.color}15, ${dept.color}08)`,
        borderBottom: `1px solid ${dept.color}20`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: `${dept.color}20`, color: dept.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dept.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dept.employees.length} members</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Dept Head */}
      {dept.head && (
        <div
          onClick={() => onMemberClick(dept.head, dept.color)}
          style={{
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: `linear-gradient(135deg, ${dept.color}, ${dept.color}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
            boxShadow: `0 2px 8px ${dept.color}40`,
          }}>
            {getInitials(dept.head.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dept.head.name}</div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{dept.head.position}</div>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: `${dept.color}18`, color: dept.color, fontWeight: 700, flexShrink: 0 }}>
            {dept.head.level}
          </span>
        </div>
      )}

      {/* Members */}
      {!collapsed && dept.members.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {dept.members.map(member => (
            <div
              key={member.id}
              onClick={() => onMemberClick(member, dept.color)}
              style={{
                padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `${dept.color}25`, color: dept.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.72rem', flexShrink: 0,
              }}>
                {getInitials(member.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.position}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!collapsed && dept.members.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          No other members
        </div>
      )}
    </div>
  );
}

export default function Organization() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', position: '', level: '', email: '', phone: '', address: '' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [emps, depts] = await Promise.all([
        api.get('/employees'),
        api.get('/master-data/departments'),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const orgTree = buildOrgTree(employees, departments);

  const handleMemberClick = (member, color) => {
    setSelectedMember(member);
    setSelectedColor(color);
  };

  const handleEditOpen = () => {
    setEditForm({
      name: selectedMember.name || '',
      position: selectedMember.position || '',
      level: selectedMember.level || '',
      email: selectedMember.email || '',
      phone: selectedMember.phone || '',
      address: selectedMember.address || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/employees/${selectedMember.id}`, {
        name: editForm.name,
        position: editForm.position,
        phone: editForm.phone,
        address: editForm.address,
      });
      toast.success('Employee Updated', `${editForm.name}'s details have been saved.`);
      setShowEditModal(false);
      setSelectedMember(null);
      fetchData();
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  const totalDepts = new Set(employees.map(e => typeof e.department === 'string' ? e.department : e.department?.name)).size;

  if (isLoading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p>Loading organization chart...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Organization Structure</h1>
        <p className="page-subtitle">Company hierarchy and reporting lines — click on a person to view or edit</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{employees.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Employees</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalDepts}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Departments</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{employees.filter(e => e.status !== 'Inactive' && e.status !== 'Resigned').length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Employees</div>
          </div>
        </div>
      </div>

      {/* Org Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {orgTree.map(dept => (
          <DeptCard key={dept.id} dept={dept} onMemberClick={handleMemberClick} />
        ))}
        {orgTree.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', flex: 1 }}>
            No department data found
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {selectedMember && !showEditModal && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Employee Detail</h2>
              <button className="modal-close" onClick={() => setSelectedMember(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px',
                padding: '20px', borderRadius: 'var(--radius-lg)',
                background: `linear-gradient(135deg, ${selectedColor}08, ${selectedColor}15)`,
                border: `1px solid ${selectedColor}25`,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {getInitials(selectedMember.name)}
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedMember.name}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedMember.position}</div>
                  <span style={{
                    display: 'inline-block', marginTop: '6px',
                    fontSize: '0.72rem', fontWeight: 600,
                    padding: '3px 10px', borderRadius: '12px',
                    background: `${selectedColor}18`, color: selectedColor,
                  }}>
                    {selectedMember.level || 'Staff'}
                  </span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <span className="form-label">Employee ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedMember.id}</span>
                </div>
                <div className="form-group">
                  <span className="form-label">Department</span>
                  <span>{typeof selectedMember.department === 'string' ? selectedMember.department : selectedMember.department?.name || '—'}</span>
                </div>
                <div className="form-group">
                  <span className="form-label"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email</span></span>
                  <span style={{ fontSize: '0.88rem' }}>{selectedMember.email || '—'}</span>
                </div>
                <div className="form-group">
                  <span className="form-label"><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone</span></span>
                  <span style={{ fontSize: '0.88rem' }}>{selectedMember.phone || '—'}</span>
                </div>
                <div className="form-group">
                  <span className="form-label">Status</span>
                  <span className={`badge ${selectedMember.status !== 'Inactive' && selectedMember.status !== 'Resigned' ? 'success' : 'danger'}`}>
                    <span className="badge-dot" />{selectedMember.status}
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Join Date</span>
                  <span>{selectedMember.joinDate ? formatDate(selectedMember.joinDate) : '—'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMember(null)}>Close</button>
              <button className="btn btn-primary" onClick={handleEditOpen}>
                <Edit size={16} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit — {selectedMember.id}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  { label: 'Full Name *', key: 'name', placeholder: 'Full name' },
                  { label: 'Position *', key: 'position', placeholder: 'e.g. Senior Developer' },
                  { label: 'Email', key: 'email', placeholder: 'email@company.com', type: 'email', readOnly: true },
                  { label: 'Phone', key: 'phone', placeholder: '+62 8xx-xxxx-xxxx' },
                  { label: 'Address', key: 'address', placeholder: 'Office or home address' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input
                      className="form-input" type={f.type || 'text'} placeholder={f.placeholder}
                      value={editForm[f.key] || ''} readOnly={f.readOnly}
                      style={f.readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      onChange={e => !f.readOnly && setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
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
