import { useState, useEffect, useMemo } from 'react';
import { Star, CheckCircle, Clock, Plus, X, Send, Trash2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

const DEFAULT_COMPETENCIES = ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Initiative', 'Technical Skills', 'Adaptability', 'Accountability'];
const PAPI_DIMENSIONS = [
  'Hard Intense Worked (G)', 'Leadership Role (L)', 'Making Decisions (I)', 'Pace (T)', 'Vigorous Type (V)',
  'Social Extension (S)', 'Theoretical Type (R)', 'Working with Details (D)', 'Organized Type (C)', 'Emotional Resistant (E)',
  'Need to Finish Task (N)', 'Need to Achieve (A)', 'Need to Control Others (P)', 'Need to be Noticed (X)', 'Need to Belong to Groups (B)',
  'Need for Closeness (O)', 'Need for Change (Z)', 'Need to be Forceful (K)', 'Need to Support Authority (F)', 'Need for Rules (W)'
];

export default function Assessment() {
  const [results, setResults] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('360');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreAssessment, setScoreAssessment] = useState(null);
  const [scoreDetail, setScoreDetail] = useState([]);
  const [scoreInputs, setScoreInputs] = useState({});
  const [scoreRole, setScoreRole] = useState('self');
  const [createForm, setCreateForm] = useState({ employeeId: '', period: `H1 ${new Date().getFullYear()}`, competencies: [...DEFAULT_COMPETENCIES], managerId: '', peerId: '', instrument: '360 Evaluation' });
  const toast = useToast();

  const papiData = useMemo(() => results.filter(r => r.instrument === 'PAPI Kostick').map((emp) => ({
    id: emp.id, employeeId: emp.employeeId, employeeName: emp.employeeName,
    position: emp.position, department: emp.department, status: emp.status
  })), [results]);

  const selectedPapi = useMemo(() => papiData.find(p => p.id === selectedId) || papiData[0], [papiData, selectedId]);
  
  const papiScoresActual = useMemo(() => {
    if (!detail) return [];
    return detail.map(d => ({ dimension: d.competency.match(/\(([^)]+)\)/)?.[1] || d.competency.substring(0,3), score: parseFloat(d.selfScore) || 0, fullDim: d.competency }));
  }, [detail]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [data, emps] = await Promise.all([api.get('/talent/assessments'), api.get('/employees')]);
      setResults(data);
      setEmployees(emps);
      if (data.length > 0) setSelectedId(data[0].id);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchDetail = async (id) => {
    try {
      setIsDetailLoading(true);
      const data = await api.get(`/talent/assessments/${id}`);
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setIsDetailLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);

  const selected = useMemo(() => results.find(r => r.id === selectedId), [results, selectedId]);

  const summary = useMemo(() => {
    const total = results.length;
    const completed = results.filter(r => r.status === 'Completed').length;
    const pending = total - completed;
    const avgScore = total > 0 ? (results.reduce((acc, r) => acc + parseFloat(r.overallScore || 0), 0) / total).toFixed(1) : '0.0';
    return { total, completed, pending, avgScore };
  }, [results]);

  const handleCreateAssessment = async () => {
    if (!createForm.employeeId || !createForm.period || (createForm.instrument !== 'PAPI Kostick' && (!createForm.managerId || !createForm.peerId))) {
      toast.error('Missing Info', 'Please select all required fields.');
      return;
    }
    try {
      await api.post('/talent/assessments', { 
        employeeId: createForm.employeeId, 
        period: createForm.period, 
        competencies: createForm.competencies,
        managerId: createForm.managerId,
        peerId: createForm.peerId,
        instrument: createForm.instrument
      });
      setShowCreateModal(false);
      setCreateForm({ employeeId: '', period: `H1 ${new Date().getFullYear()}`, competencies: [...DEFAULT_COMPETENCIES], managerId: '', peerId: '', instrument: '360 Evaluation' });
      fetchData();
      toast.success('Assessment Created', 'New assessment cycle has been started.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const openScoreModal = async (assessment) => {
    setScoreAssessment(assessment);
    setShowScoreModal(true);
    const data = await api.get(`/talent/assessments/${assessment.id}`);
    setScoreDetail(data);
    const inputs = {};
    data.forEach(s => {
      inputs[s.competency] = { self: parseFloat(s.selfScore || 0), manager: parseFloat(s.managerScore || 0), peer: parseFloat(s.peerScore || 0) };
    });
    setScoreInputs(inputs);
  };

  const handleSubmitScores = async () => {
    try {
      const promises = Object.entries(scoreInputs).map(([competency, scores]) =>
        api.post(`/talent/assessments/${scoreAssessment.id}/scores`, { competency, role: scoreRole, score: scores[scoreRole] })
      );
      await Promise.all(promises);
      toast.success('Scores Saved', `${scoreRole.charAt(0).toUpperCase() + scoreRole.slice(1)} scores have been submitted.`);
      fetchDetail(scoreAssessment.id);
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleCompleteAssessment = async () => {
    try {
      await api.patch(`/talent/assessments/${scoreAssessment.id}/complete`);
      setShowScoreModal(false);
      fetchData();
      toast.success('Assessment Completed', 'Overall scores have been calculated.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleDeleteAssessment = async (id) => {
    try {
      await api.delete(`/talent/assessments/${id}`);
      fetchData();
      toast.success('Deleted', 'Assessment has been removed.');
    } catch (err) { toast.error('Error', err.message); }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading assessments...</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Employee Assessment</h1>
          <p className="page-subtitle">Evaluation and psychometric testing results</p>
        </div>
        {activeTab === '360' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Assessment
          </button>
        )}
      </div>

      <div className="filter-bar">
        <button className={`btn ${activeTab === '360' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('360')}>360° Evaluation</button>
        <button className={`btn ${activeTab === 'papi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('papi')}>PAPI Kostick</button>
      </div>

      {activeTab === '360' ? (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><div className="kpi-icon primary"><Star size={24} /></div><div className="kpi-content"><div className="kpi-label">Average Score</div><div className="kpi-value">{summary.avgScore}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon success"><CheckCircle size={24} /></div><div className="kpi-content"><div className="kpi-label">Completed</div><div className="kpi-value">{summary.completed}/{summary.total}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon warning"><Clock size={24} /></div><div className="kpi-content"><div className="kpi-label">Pending</div><div className="kpi-value">{summary.pending}</div></div></div>
          </div>

          <div className="grid-dashboard">
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Employee</th><th>Period</th><th>Instrument</th><th>Overall Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {results.filter(r => r.instrument !== 'PAPI Kostick').map((a) => (
                    <tr key={a.id} onClick={() => setSelectedId(a.id)} style={{ cursor: 'pointer', background: selectedId === a.id ? 'var(--color-primary-bg)' : undefined }}>
                      <td>
                        <div className="table-avatar">
                          <div className="table-avatar-img" style={{ background: `hsl(${a.employeeId.charCodeAt(0) * 137.5 % 360}, 70%, 50%)` }}>{getInitials(a.employeeName)}</div>
                          <div><div className="table-name">{a.employeeName}</div><div className="table-sub">{a.position}</div></div>
                        </div>
                      </td>
                      <td>{a.period}</td>
                      <td><span className="badge neutral">{a.instrument || '360 Evaluation'}</span></td>
                      <td><span className="font-bold" style={{ color: parseFloat(a.overallScore) >= 4 ? 'var(--color-success)' : parseFloat(a.overallScore) >= 3 ? 'var(--color-primary)' : 'var(--color-warning)' }}>{parseFloat(a.overallScore || 0).toFixed(1)}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`badge ${a.status === 'Completed' ? 'success' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                            <span className="badge-dot" />{a.status}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                             <div title="Self Evaluation" style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'Completed' ? '#10B981' : '#CBD5E1' }} />
                             <div title="Manager Evaluation" style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'Completed' ? '#10B981' : '#CBD5E1' }} />
                             <div title="Peer Evaluation" style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'Completed' ? '#10B981' : '#CBD5E1' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openScoreModal(a)}>
                            {a.status === 'Completed' ? 'View Scores' : 'Input Scores'}
                          </button>
                          <button className="btn-icon" style={{ color: 'var(--color-danger)', padding: '4px' }} onClick={() => handleDeleteAssessment(a.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)' }}>
                <h3 className="card-title" style={{ marginBottom: '4px' }}>{selected.employeeName}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{selected.position} • {selected.department}</p>
                {isDetailLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : detail && detail.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={detail.map(d => ({ subject: d.competency, Self: parseFloat(d.selfScore), Manager: parseFloat(d.managerScore), Peer: parseFloat(d.peerScore) }))}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                        <Radar name="Self" dataKey="Self" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} />
                        <Radar name="Manager" dataKey="Manager" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                        <Radar name="Peer" dataKey="Peer" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '16px' }}>
                      {detail.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.competency}</span>
                          <span className="font-semibold">{((parseFloat(c.selfScore) + parseFloat(c.managerScore) + parseFloat(c.peerScore)) / 3).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No scores entered yet.<br />Click "Input Scores" to begin.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid-dashboard">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Dominant Trait</th><th>Status</th></tr></thead>
              <tbody>
                {papiData.map((p) => {
                  return (
                    <tr key={p.id} onClick={() => setSelectedId(p.id)} style={{ cursor: 'pointer', background: selectedId === p.id ? 'var(--color-primary-bg)' : undefined }}>
                      <td><div className="table-avatar"><div className="table-avatar-img" style={{ background: `hsl(${p.employeeId.charCodeAt(0) * 137.5 % 360}, 70%, 50%)` }}>{getInitials(p.employeeName)}</div><div><div className="table-name">{p.employeeName}</div><div className="table-sub">{p.position}</div></div></div></td>
                      <td><span className="badge primary">{selectedId === p.id && papiScoresActual.length > 0 ? [...papiScoresActual].sort((a,b)=>b.score-a.score)[0]?.fullDim : 'View Profile'}</span></td>
                      <td><span className={`badge ${p.status === 'Completed' ? 'success' : 'warning'}`}><span className="badge-dot" />{p.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedPapi && (
            <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)' }}>
              <h3 className="card-title" style={{ marginBottom: '4px' }}>{selectedPapi.employeeName}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{selectedPapi.position} • PAPI Kostick Profile</p>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={papiScoresActual}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 9]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {papiScoresActual.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.fullDim}</span>
                    <span className="font-semibold">{c.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Plus size={18} style={{ marginRight: '8px' }} />New Assessment Cycle</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Employee to Evaluate *</label>
                <select className="form-input" value={createForm.employeeId} onChange={e => setCreateForm(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                </select>
              </div>
                <div className="form-group">
                  <label className="form-label">Assessment Instrument</label>
                  <select className="form-select" value={createForm.instrument} onChange={e => {
                    const instrument = e.target.value;
                    setCreateForm({
                      ...createForm, 
                      instrument,
                      competencies: instrument === 'PAPI Kostick' ? [...PAPI_DIMENSIONS] : [...DEFAULT_COMPETENCIES],
                      managerId: instrument === 'PAPI Kostick' ? '' : createForm.managerId,
                      peerId: instrument === 'PAPI Kostick' ? '' : createForm.peerId
                    });
                  }}>
                    <option value="360 Evaluation">360° Evaluation</option>
                    <option value="PAPI Kostick">PAPI Kostick</option>
                  </select>
                </div>
              <div className="form-group">
                <label className="form-label">Period *</label>
                <input className="form-input" value={createForm.period} onChange={e => setCreateForm(p => ({ ...p, period: e.target.value }))} placeholder="e.g. H1 2026, Q3 2026" />
              </div>

              {createForm.instrument !== 'PAPI Kostick' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Manager Evaluator *</label>
                    <select className="form-input" value={createForm.managerId} onChange={e => setCreateForm(p => ({ ...p, managerId: e.target.value }))}>
                      <option value="">Select Manager</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peer Evaluator *</label>
                    <select className="form-input" value={createForm.peerId} onChange={e => setCreateForm(p => ({ ...p, peerId: e.target.value }))}>
                      <option value="">Select Peer</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Competencies to Evaluate</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {createForm.competencies.map(c => (
                    <span key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '20px', fontSize: '0.8rem' }}>
                      {c}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0', lineHeight: 1 }} onClick={() => setCreateForm(p => ({ ...p, competencies: p.competencies.filter(x => x !== c) }))}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateAssessment} disabled={!createForm.employeeId || !createForm.period || (createForm.instrument !== 'PAPI Kostick' && (!createForm.managerId || !createForm.peerId))}>Create Assessment</button>
            </div>
          </div>
        </div>
      )}

      {/* Score Input Modal */}
      {showScoreModal && scoreAssessment && (
        <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Assessment Scores — {scoreAssessment.employeeName}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{scoreAssessment.period} • {scoreAssessment.status}</p>
              </div>
              <button className="modal-close" onClick={() => setShowScoreModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['self', 'manager', 'peer'].map(r => (
                  <button key={r} className={`btn ${scoreRole === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setScoreRole(r)} style={{ textTransform: 'capitalize' }}>{r} Score</button>
                ))}
              </div>
              <table className="data-table">
                <thead><tr><th>Competency</th><th>Self</th><th>Manager</th><th>Peer</th><th style={{ width: '140px' }}>Input ({scoreRole})</th></tr></thead>
                <tbody>
                  {scoreDetail.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.competency}</td>
                      <td>{parseFloat(s.selfScore || 0).toFixed(1)}</td>
                      <td>{parseFloat(s.managerScore || 0).toFixed(1)}</td>
                      <td>{parseFloat(s.peerScore || 0).toFixed(1)}</td>
                      <td>
                        <input
                          type="number" min="0" max="5" step="0.5"
                          className="form-input"
                          style={{ padding: '6px 10px', width: '100%' }}
                          value={scoreInputs[s.competency]?.[scoreRole] ?? 0}
                          onChange={e => setScoreInputs(prev => ({ ...prev, [s.competency]: { ...prev[s.competency], [scoreRole]: parseFloat(e.target.value) } }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowScoreModal(false)}>Close</button>
              <button className="btn btn-secondary" onClick={handleSubmitScores}><Send size={15} style={{ marginRight: '6px' }} />Save {scoreRole} Scores</button>
              {scoreAssessment.status !== 'Completed' && (
                <button className="btn btn-primary" onClick={handleCompleteAssessment}><CheckCircle size={15} style={{ marginRight: '6px' }} />Complete Assessment</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
