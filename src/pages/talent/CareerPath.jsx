import { useState, useEffect, useMemo } from 'react';
import { ArrowUp, Lock, CheckCircle, Circle, Settings, Plus, Trash2, X, UserPlus, Edit2 } from 'lucide-react';
import { getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function CareerPath() {
  const [careerPaths, setCareerPaths] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignForm, setAssignForm] = useState({ employeeId: '', trackId: '', currentLevel: 1, yearsInRole: 0, readiness: 0 });
  const [editingProgress, setEditingProgress] = useState(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackType, setNewTrackType] = useState('Technical');
  const [newLevelData, setNewLevelData] = useState({ level: '', title: '', minYears: '', salaryRange: '', requirements: '' });
  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [pathsRes, empsRes, allEmpsRes] = await Promise.all([
        api.get('/talent/career-tracks'),
        api.get('/talent/employee-career'),
        api.get('/employees')
      ]);
      setCareerPaths(pathsRes);
      setEmployeeData(empsRes);
      setAllEmployees(allEmpsRes);
      if (pathsRes.length > 0) setSelectedTrackId(pathsRes[0].id);
      if (empsRes.length > 0) setSelectedEmployeeId(empsRes[0].employeeId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const track = useMemo(() => careerPaths.find((t) => t.id === selectedTrackId), [careerPaths, selectedTrackId]);
  const trackEmployees = useMemo(() => employeeData.filter((e) => e.trackId === selectedTrackId), [employeeData, selectedTrackId]);
  const selectedEmployee = useMemo(() => employeeData.find((e) => e.employeeId === selectedEmployeeId), [employeeData, selectedEmployeeId]);

  const handleAddTrack = async () => {
    if (!newTrackName.trim()) return;
    try {
      await api.post('/talent/career-tracks', { name: `${newTrackName.trim()} (${newTrackType})` });
      setNewTrackName('');
      fetchData();
      toast.success('Track Added', 'New career track created.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleDeleteTrack = async (id) => {
    try {
      await api.delete(`/talent/career-tracks/${id}`);
      fetchData();
      toast.success('Track Deleted', 'Career track removed.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleAddLevel = async (trackId) => {
    if (!newLevelData.level || !newLevelData.title) return;
    try {
      await api.post(`/talent/career-tracks/${trackId}/levels`, {
        level: parseInt(newLevelData.level),
        title: newLevelData.title,
        minYears: parseInt(newLevelData.minYears) || 0,
        salaryRange: newLevelData.salaryRange,
        requirements: newLevelData.requirements
      });
      setNewLevelData({ level: '', title: '', minYears: '', salaryRange: '', requirements: '' });
      fetchData();
      toast.success('Level Added', 'New career level added.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleDeleteLevel = async (id) => {
    try {
      await api.delete(`/talent/career-levels/${id}`);
      fetchData();
      toast.success('Level Deleted', 'Career level removed.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleAssignEmployee = async () => {
    if (!assignForm.employeeId || !assignForm.trackId) return;
    try {
      await api.post('/talent/employee-career', assignForm);
      setIsAssignModalOpen(false);
      setAssignForm({ employeeId: '', trackId: '', currentLevel: 1, yearsInRole: 0, readiness: 0 });
      fetchData();
      toast.success('Employee Assigned', 'Employee has been added to the career track.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleUpdateProgress = async () => {
    if (!editingProgress) return;
    try {
      await api.patch(`/talent/employee-career/${editingProgress.id}`, {
        readiness: editingProgress.readiness,
        currentLevel: editingProgress.currentLevel,
        yearsInRole: editingProgress.yearsInRole
      });
      setEditingProgress(null);
      fetchData();
      toast.success('Progress Updated', 'Career progress has been updated.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await api.delete(`/talent/employee-career/${id}`);
      fetchData();
      toast.success('Assignment Removed', 'Employee removed from career track.');
    } catch (err) { toast.error('Error', err.message); }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading career paths...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Career Path</h1>
        <p className="page-subtitle">Career ladders and progression tracking</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {careerPaths.map((cp) => (
            <button
              key={cp.id}
              className={`btn ${selectedTrackId === cp.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedTrackId(cp.id)}
            >
              {cp.name}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={() => setIsManageModalOpen(true)}>
          <Settings size={18} />
          Manage Tracks
        </button>
        <button className="btn btn-primary" onClick={() => { setAssignForm(p => ({ ...p, trackId: selectedTrackId || '' })); setIsAssignModalOpen(true); }}>
          <UserPlus size={18} />
          Assign Employee
        </button>
      </div>

      <div className="grid-dashboard">
        {/* Career Ladder */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>{track ? `${track.name} Career Ladder` : 'Career Ladder'}</h3>
          {!track ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No career tracks found. Please manage tracks to create one.
            </div>
          ) : (
          <div className="career-ladder">
            {track.levels.slice().reverse().map((level, i, arr) => {
              const empLevel = selectedEmployee ? selectedEmployee.currentLevel : 0;
              const isCurrent = level.level === empLevel;
              const isCompleted = level.level < empLevel;
              const isLocked = level.level > empLevel;

              return (
                <div key={level.level} style={{ width: '100%', maxWidth: 500 }}>
                  <div className={`career-node ${isCurrent ? 'current' : isCompleted ? 'completed' : isLocked ? 'locked' : ''}`}>
                    <div style={{ minWidth: 40, display: 'flex', justifyContent: 'center' }}>
                      {isCompleted ? (
                        <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
                      ) : isCurrent ? (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Circle size={10} fill="white" color="white" />
                        </div>
                      ) : (
                        <Lock size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: isCurrent ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                          Level {level.level}: {level.title}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{level.salaryRange}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Min. {level.minYears} years experience</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(level.requirements || '').split(',').map((skill) => (
                          <span key={skill} className="badge neutral" style={{ fontSize: '0.72rem' }}>{skill.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                      <ArrowUp size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Employee Readiness */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Employee Readiness</h3>
            {trackEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No employees assigned to this track yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trackEmployees.map((emp) => {
                  const nextLevel = track.levels.find(l => l.level === emp.currentLevel + 1);
                  return (
                    <div key={emp.employeeId} className="card"
                      onClick={() => setSelectedEmployeeId(emp.employeeId)}
                      style={{ cursor: 'pointer', padding: '14px', border: selectedEmployeeId === emp.employeeId ? '2px solid var(--color-primary)' : undefined }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div className="table-avatar-img" style={{ background: `hsl(${(emp.employeeId || '').charCodeAt(0) * 137.5 % 360}, 60%, 50%)`, width: 36, height: 36, fontSize: '0.8rem' }}>
                          {getInitials(emp.employeeName)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{emp.employeeName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.position} • Lvl {emp.currentLevel} • {emp.yearsInRole}y</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button className="btn-icon" style={{ padding: '4px' }} onClick={() => setEditingProgress({ ...emp })}><Edit2 size={14} /></button>
                          <button className="btn-icon" style={{ color: 'var(--color-danger)', padding: '4px' }} onClick={() => handleDeleteAssignment(emp.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {nextLevel && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Readiness for {nextLevel.title}</span>
                            <span className="font-bold" style={{ color: emp.readiness >= 80 ? 'var(--color-success)' : emp.readiness >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{emp.readiness}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div className={`progress-bar-fill ${emp.readiness >= 80 ? 'success' : emp.readiness >= 50 ? 'warning' : 'danger'}`} style={{ width: `${emp.readiness}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isManageModalOpen && (
        <div className="modal-overlay" onClick={() => setIsManageModalOpen(false)}>
          <div className="modal-container modal-md" style={{ maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Career Tracks</h2>
              <button className="btn-icon" onClick={() => setIsManageModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <h4 style={{ marginBottom: '10px' }}>Career Tracks</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" className="form-input" placeholder="New track name (e.g. Engineering)" value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} />
                <select className="form-input" style={{ width: '150px' }} value={newTrackType} onChange={(e) => setNewTrackType(e.target.value)}>
                  <option value="Technical">Technical</option>
                  <option value="Managerial">Managerial</option>
                </select>
                <button className="btn btn-primary" onClick={handleAddTrack}>Add</button>
              </div>
              {careerPaths.map(cp => (
                <div key={cp.id} style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ fontSize: '1rem', fontWeight: 600 }}>{cp.name}</h5>
                    <button className="btn-icon" onClick={() => handleDeleteTrack(cp.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                  </div>
                  <div style={{ paddingLeft: '16px', borderLeft: '2px solid var(--border-color-light)', marginBottom: '12px' }}>
                    {cp.levels.map(l => (
                      <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Level {l.level}: {l.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min {l.minYears} years • {l.salaryRange}</div>
                        </div>
                        <button className="btn-icon" onClick={() => handleDeleteLevel(l.id)} style={{ color: 'var(--color-danger)', opacity: 0.7 }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <input type="number" className="form-input" style={{ width: '80px' }} placeholder="Lvl" value={newLevelData.level} onChange={e => setNewLevelData({...newLevelData, level: e.target.value})} />
                    <input type="text" className="form-input" style={{ flex: 1, minWidth: '120px' }} placeholder="Title" value={newLevelData.title} onChange={e => setNewLevelData({...newLevelData, title: e.target.value})} />
                    <input type="number" className="form-input" style={{ width: '80px' }} placeholder="Yrs" value={newLevelData.minYears} onChange={e => setNewLevelData({...newLevelData, minYears: e.target.value})} />
                    <input type="text" className="form-input" style={{ width: '120px' }} placeholder="Salary Range" value={newLevelData.salaryRange} onChange={e => setNewLevelData({...newLevelData, salaryRange: e.target.value})} />
                    <button className="btn btn-secondary" onClick={() => handleAddLevel(cp.id)}><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {isAssignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><UserPlus size={18} style={{ marginRight: '8px' }} />Assign Employee to Career Track</h3>
              <button className="modal-close" onClick={() => setIsAssignModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="form-input" value={assignForm.employeeId} onChange={e => setAssignForm(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">Select Employee</option>
                  {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Career Track *</label>
                <select className="form-input" value={assignForm.trackId} onChange={e => setAssignForm(p => ({ ...p, trackId: e.target.value }))}>
                  <option value="">Select Track</option>
                  {careerPaths.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Starting Level</label>
                  <input type="number" min="1" className="form-input" value={assignForm.currentLevel} onChange={e => setAssignForm(p => ({ ...p, currentLevel: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Years in Role</label>
                  <input type="number" min="0" step="0.5" className="form-input" value={assignForm.yearsInRole} onChange={e => setAssignForm(p => ({ ...p, yearsInRole: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Readiness %</label>
                  <input type="number" min="0" max="100" className="form-input" value={assignForm.readiness} onChange={e => setAssignForm(p => ({ ...p, readiness: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignEmployee} disabled={!assignForm.employeeId || !assignForm.trackId}>Assign to Track</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Progress Modal */}
      {editingProgress && (
        <div className="modal-overlay" onClick={() => setEditingProgress(null)}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit2 size={18} style={{ marginRight: '8px' }} />Update Progress — {editingProgress.employeeName}</h3>
              <button className="modal-close" onClick={() => setEditingProgress(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Current Level</label>
                <input type="number" min="1" className="form-input" value={editingProgress.currentLevel} onChange={e => setEditingProgress(p => ({ ...p, currentLevel: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Years in Role</label>
                <input type="number" min="0" step="0.5" className="form-input" value={editingProgress.yearsInRole} onChange={e => setEditingProgress(p => ({ ...p, yearsInRole: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Readiness %</label>
                <input type="number" min="0" max="100" className="form-input" value={editingProgress.readiness} onChange={e => setEditingProgress(p => ({ ...p, readiness: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingProgress(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateProgress}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
