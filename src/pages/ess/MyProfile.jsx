import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Briefcase, Building, Edit, X, Save, User, Sparkles, Edit2, Users, CreditCard } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import { formatDate, getInitials } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function MyProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState('personal');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [skillInput, setSkillInput] = useState('');

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const [p, a] = await Promise.all([
        api.get(`/employees/${user?.employeeId}`),
        api.get(`/employees/${user?.employeeId}/assignments`)
      ]);
      setProfile(p);
      setMyAssignments(a);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchProfile();
  }, [user]);

  const openEditModal = () => {
    setEditForm({
      bio: profile.bio || '',
      phone: profile.phone || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      emergencyContact: profile.emergencyContact || '',
      emergencyPhone: profile.emergencyPhone || '',
      maritalStatus: profile.maritalStatus || 'TK/0',
      bankName: profile.bankName || '',
      bankAccountNumber: profile.bankAccountNumber || '',
      skills: profile.skills || []
    });
    setShowEditModal(true);
  };

  const addSkill = () => {
    if (skillInput.trim() && !editForm.skills.includes(skillInput.trim())) {
      setEditForm(p => ({ ...p, skills: [...p.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setEditForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  const saveEdit = async () => {
    try {
      setIsSaving(true);
      const payload = {
        bio: editForm.bio,
        phone: editForm.phone,
        address: editForm.address,
        dateOfBirth: editForm.dateOfBirth,
        emergencyContact: editForm.emergencyContact,
        emergencyPhone: editForm.emergencyPhone,
        maritalStatus: editForm.maritalStatus,
        bankName: editForm.bankName,
        bankAccountNumber: editForm.bankAccountNumber,
        skills: editForm.skills,
      };
      await api.patch(`/ess/profile/${user?.employeeId}`, payload);
      
      // Update local profile state with new values (Note: name is not updated here anymore)
      setProfile(prev => ({ ...prev, ...payload }));
      
      setShowEditModal(false);
      toast.success('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err) {
      toast.error('Update Failed', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;
  if (!profile) return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Profile not found</div>;


  const avatarColor = profile.avatarColor || '#6366F1';
  const displayName = profile.name || 'Employee';

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your personal information</p>
        </div>
        <button className="btn btn-secondary" onClick={openEditModal}>
          <Edit2 size={18} /> Edit Profile
        </button>

      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, ${avatarColor}, #8B5CF6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.6rem', fontWeight: 800,
            boxShadow: `0 4px 20px ${avatarColor}44`, flexShrink: 0,
          }}>
            {getInitials(displayName)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '10px' }}>{profile.position} • {profile.department?.name || 'Engineering'}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Building size={14} /> {profile.department?.name || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Calendar size={14} /> Joined {profile.joinDate ? formatDate(profile.joinDate) : '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <User size={14} /> {profile.employeeId}
              </span>
              <span className={`badge ${profile.status !== 'Inactive' && profile.status !== 'Resigned' ? 'success' : 'danger'}`}>
                <span className="badge-dot" />{profile.status || 'Active'}
              </span>
            </div>
            {profile.bio && (
              <p style={{ marginTop: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '520px' }}>
                "{profile.bio}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['personal', 'employment', 'skills', 'documents', 'assignments'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {tab === 'personal' && (
        <div className="card">
          <div className="grid-2">
            {[
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Phone', value: profile.phone || '—' },
              { icon: MapPin, label: 'Address', value: profile.address || '—' },
              { icon: Calendar, label: 'Date of Birth', value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—' },
              { icon: User, label: 'Emergency Contact', value: profile.emergencyContact || '—' },
              { icon: Phone, label: 'Emergency Phone', value: profile.emergencyPhone || '—' },
              { icon: Users, label: 'Marital Status (PTKP)', value: profile.maritalStatus || 'TK/0' },
              { icon: CreditCard, label: 'Bank Account', value: profile.bankAccountNumber ? `${profile.bankName} - ${profile.bankAccountNumber}` : '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  <div className="font-semibold">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment */}
      {tab === 'employment' && (
        <div className="card">
          <div className="grid-2">
            {[
              { label: 'Employee ID', value: profile.id },
              { label: 'Department', value: profile.department?.name },
              { label: 'Position', value: profile.position },
              { label: 'Level', value: profile.level || '—' },
              { label: 'Role', value: user?.role || 'Employee' },
              { label: 'Join Date', value: profile.joinDate ? formatDate(profile.joinDate) : '—' },
              { label: 'Status', value: profile.status || 'Active' },
              { label: 'Email', value: profile.email },
            ].map((item, i) => (
              <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                <div className="font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {tab === 'skills' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Skills & Certifications</h3>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Technical Skills (Synced with Career Path)</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(profile.skills || []).length > 0
                ? profile.skills.map(skill => (
                    <span key={skill} className="badge primary" style={{ padding: '6px 12px', borderRadius: '8px' }}>{skill}</span>
                  ))
                : <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No skills added yet. Click "Edit Profile" to add.</span>
              }
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Certifications</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'AWS Certified Solutions Architect', year: '2025' },
                { name: 'Google Data Analytics Professional', year: '2024' },
              ].map((cert, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div className="font-semibold">{cert.name}</div>
                  <div className="badge neutral">{cert.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>My Uploaded Documents</h3>
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit size={14} /> Upload New
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['KTP', 'NPWP', 'Degree Certificate', 'Employment Contract', 'BPJS Card'].map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={18} style={{ color: 'var(--color-primary)' }} />
                  <span className="font-semibold">{doc}</span>
                </div>
                <span className="badge success">Uploaded</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      {tab === 'assignments' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Current Project Assignments</h3>
          {myAssignments.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              No active project assignments found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myAssignments.map(a => (
                <div key={a.id} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="font-semibold" style={{ fontSize: '1.05rem' }}>{a.project?.name || a.department?.name}</div>
                    <span className={`badge ${a.active ? 'success' : 'neutral'}`}>{a.active ? 'Active' : 'Completed'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
                    <div><div style={{ color: 'var(--text-muted)' }}>Role</div><div className="font-semibold">{a.role}</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Client</div><div className="font-semibold">{a.client?.name || '-'}</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Period</div><div className="font-semibold">{formatDate(a.startDate)} – {a.endDate ? formatDate(a.endDate) : 'Present'}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Profile Modal ──────────────────────────────── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={18} style={{ marginRight: '8px' }} />Edit Biodata & Settings</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

              {/* Bio */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Bio / Summary</label>
                <textarea
                  className="form-input form-textarea" rows={2}
                  value={editForm.bio || ''}
                  onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Write a short bio about yourself..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" placeholder="+62 812 xxxx xxxx" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={editForm.dateOfBirth || ''} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address..." value={editForm.address || ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input className="form-input" placeholder="Contact name" value={editForm.emergencyContact || ''} onChange={e => setEditForm(p => ({ ...p, emergencyContact: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone</label>
                  <input className="form-input" placeholder="+62 812 xxxx xxxx" value={editForm.emergencyPhone || ''} onChange={e => setEditForm(p => ({ ...p, emergencyPhone: e.target.value }))} />
                </div>
              </div>

              {/* Marital & Banking details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Marital Status (PTKP)</label>
                  <select 
                    className="form-input" 
                    value={editForm.maritalStatus || 'TK/0'} 
                    onChange={e => setEditForm(p => ({ ...p, maritalStatus: e.target.value }))}
                  >
                    <option value="TK/0">TK/0 - Single / No Dependents</option>
                    <option value="K/0">K/0 - Married / No Dependents</option>
                    <option value="K/1">K/1 - Married / 1 Dependent</option>
                    <option value="K/2">K/2 - Married / 2 Dependents</option>
                    <option value="K/3">K/3 - Married / 3 Dependents</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Note: Changes to Marital Status will automatically adjust PTKP calculations in Payroll.
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input className="form-input" placeholder="e.g. BCA, Mandiri" value={editForm.bankName || ''} onChange={e => setEditForm(p => ({ ...p, bankName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Account Number</label>
                  <input className="form-input" placeholder="Account number" value={editForm.bankAccountNumber || ''} onChange={e => setEditForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
                </div>
              </div>

              {/* Skills */}
              <div className="form-group">
                <label className="form-label">Skills (Synced with Career Path)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    className="form-input" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Type skill + Enter to add"
                    style={{ flex: 1 }}
                  />
                  <button onClick={addSkill} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(editForm.skills || []).map(skill => (
                    <span key={skill} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                      {skill}
                      <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(editForm.skills || []).length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added yet</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
