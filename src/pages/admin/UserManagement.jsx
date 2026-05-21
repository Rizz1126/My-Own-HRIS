import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldCheck, User, ChevronDown, Info } from 'lucide-react';
import { api } from '../../utils/api';
import { ROLES, NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const ROLE_COLORS = {
  'Super Admin': { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', icon: ShieldCheck },
  'Admin': { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', icon: Shield },
  'Employee': { bg: 'var(--color-info-bg)', color: 'var(--color-info)', icon: User },
};


export default function UserManagement() {

  const { user, rolePermissions, updateRolePermissions } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ id: '', role: '' });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/employees/users/all');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const name = u.name || '';
    const empId = u.employeeId || '';
    const email = u.email || '';
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleEditClick = (u) => {
    setEditingUser(u.id);
    setEditForm({ id: u.id, role: u.role });
  };

  const handleSaveEdit = async (userId) => {
    try {
      await api.patch(`/employees/users/${userId}/role`, { role: editForm.role });
      setEditingUser(null);
      fetchUsers();
      toast.success('Role Updated', `User role has been changed to ${editForm.role}.`);
    } catch (err) {
      toast.error('Update Failed', 'Failed to update role.');
    }
  };

  const roleCounts = {
    'Super Admin': users.filter(u => u.role === 'Super Admin').length,
    'Admin': users.filter(u => u.role === 'Admin').length,
    'Employee': users.filter(u => u.role === 'Employee').length,
  };

  const handlePermissionToggle = (role, menuId) => {
    // If not super admin exploring, we could block it, but UI assumes admin is operating this page
    if (user?.role !== 'Super Admin') {
      toast.warning('Access Denied', 'Only Super Admin can modify module permissions.');
      return;
    }
    const current = rolePermissions[role] || [];
    let updated;
    if (current.includes(menuId)) {
      updated = current.filter(id => id !== menuId);
    } else {
      updated = [...current, menuId];
    }
    updateRolePermissions({ ...rolePermissions, [role]: updated });
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage user roles and access permissions</p>
      </div>

      {/* Role Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        {Object.entries(ROLE_COLORS).map(([role, style]) => {
          const RoleIcon = style.icon;
          return (
            <div key={role} className="kpi-card">
              <div className="kpi-icon" style={{ background: style.bg, color: style.color }}>
                <RoleIcon size={24} />
              </div>
              <div className="kpi-content">
                <div className="kpi-label">{role}</div>
                <div className="kpi-value">{roleCounts[role]}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Info & Editable Access Matrix */}
      <div style={{
        padding: '14px 18px', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)',
        marginBottom: '20px', fontSize: '0.85rem', color: 'var(--color-info)',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Role Permissions Sandbox:</strong> You are granted absolute power to modify what modules the Admin and Employee roles can see in their sidebars. Changes apply system-wide instantly.
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>System Module</th>
              <th>Super Admin</th>
              <th>Admin</th>
              <th>Employee</th>
            </tr>
          </thead>
          <tbody>
            {NAV_ITEMS.map(nav => (
              <React.Fragment key={nav.id}>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <nav.icon size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{nav.label}</span>
                    </div>
                  </td>
                  <td>
                    <div className="toggle-wrapper" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                      <button className="toggle active" disabled />
                      <span className="toggle-label" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Absolute</span>
                    </div>
                  </td>
                  <td>
                    <div className="toggle-wrapper">
                      <button 
                        className={`toggle ${rolePermissions['Admin']?.includes(nav.id) ? 'active' : ''}`}
                        onClick={() => handlePermissionToggle('Admin', nav.id)}
                      />
                      <span className="toggle-label" style={{ minWidth: '40px' }}>
                        {rolePermissions['Admin']?.includes(nav.id) ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="toggle-wrapper">
                      <button 
                        className={`toggle ${rolePermissions['Employee']?.includes(nav.id) ? 'active' : ''}`}
                        onClick={() => handlePermissionToggle('Employee', nav.id)}
                      />
                      <span className="toggle-label" style={{ minWidth: '40px' }}>
                        {rolePermissions['Employee']?.includes(nav.id) ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </td>
                </tr>
                {nav.children && nav.children.map(child => (
                  <tr key={child.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '28px' }}>
                        <span style={{ color: 'var(--border-color)', fontFamily: 'monospace' }}>├─</span>
                        <child.icon size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{child.label}</span>
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                        <button className="toggle active" disabled style={{ transform: 'scale(0.8)' }} />
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <button 
                          className={`toggle ${rolePermissions['Admin']?.includes(child.id) ? 'active' : ''}`}
                          style={{ transform: 'scale(0.8)' }}
                          onClick={() => handlePermissionToggle('Admin', child.id)}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="toggle-wrapper">
                        <button 
                          className={`toggle ${rolePermissions['Employee']?.includes(child.id) ? 'active' : ''}`}
                          style={{ transform: 'scale(0.8)' }}
                          onClick={() => handlePermissionToggle('Employee', child.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, Employee ID, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="form-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: '180px' }}>
          <option value="All">All Roles</option>
          {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const roleStyle = ROLE_COLORS[u.role] || ROLE_COLORS['Employee'];
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="table-avatar">
                      <div className="table-avatar-img">{getInitials(u.name)}</div>
                      <div>
                        <div className="table-name">{u.name}</div>
                        <div className="table-sub">{u.department || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-semibold" style={{ fontFamily: 'monospace' }}>
                    {u.employeeId || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{u.email}</td>
                  <td>
                    {editingUser === u.id ? (
                      <select 
                        className="form-select" 
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        value={editForm.role}
                        onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                      >
                        {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="badge" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                        <span className="badge-dot" />{u.role}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive === 'Active' ? 'success' : 'danger'}`}>
                      <span className="badge-dot" />{u.isActive || 'Active'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(u.lastLogin)}</td>
                  <td>
                    {editingUser === u.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(u.id)}>
                          Save
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingUser(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditClick(u)}
                        disabled={isSelf}
                      >
                        Edit User <ChevronDown size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
