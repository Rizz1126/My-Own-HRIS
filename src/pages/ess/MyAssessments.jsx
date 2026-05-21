import { useState, useEffect } from 'react';
import { Star, CheckCircle, Clock, Send, ChevronRight, User, Users, ShieldCheck } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { PAPI_STATEMENTS, calculatePapiScores } from '../../utils/papiKostick';

export default function MyAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentDetail, setAssessmentDetail] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [scoreRole, setScoreRole] = useState(''); // 'self', 'manager', 'peer'
  const [scoreInputs, setScoreInputs] = useState({});
  const [papiAnswers, setPapiAnswers] = useState(Array(90).fill(''));
  const toast = useToast();

  useEffect(() => {
    if (user?.employeeId) {
      fetchMyAssessments();
    }
  }, [user]);

  const fetchMyAssessments = async () => {
    if (!user?.employeeId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.get(`/talent/assessments/my/${user.employeeId}`);
      setAssessments(data);
    } catch (err) {
      console.error(err);
      toast.error('Fetch Error', err.response?.data?.error || 'Failed to fetch assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const openAssessment = async (assessment) => {
    setSelectedAssessment(assessment);
    // Determine role
    if (assessment.employeeId === user.employeeId) setScoreRole('self');
    else if (assessment.managerId === user.employeeId) setScoreRole('manager');
    else if (assessment.peerId === user.employeeId) setScoreRole('peer');
    
    try {
      setIsDetailLoading(true);
      const data = await api.get(`/talent/assessments/${assessment.id}`);
      setAssessmentDetail(data);

      const role = assessment.employeeId === user.employeeId ? 'self' : 
                   assessment.managerId === user.employeeId ? 'manager' : 'peer';
      setScoreRole(role);

      const inputs = {};
      data.forEach(s => {
        inputs[s.competency] = parseFloat(s[`${role}Score`] || 0);
      });
      setScoreInputs(inputs);
      if (assessment.instrument === 'PAPI Kostick') {
        setPapiAnswers(Array(90).fill('')); // Reset answers
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSubmitScores = async () => {
    try {
      let promises = [];
      if (selectedAssessment.instrument === 'PAPI Kostick') {
        if (papiAnswers.includes('')) {
          toast.error('Incomplete', 'Please answer all 90 statements.');
          return;
        }
        const calculatedScores = calculatePapiScores(papiAnswers);
        promises = Object.entries(calculatedScores).map(([competency, score]) =>
          api.post(`/talent/assessments/${selectedAssessment.id}/scores`, { competency, role: scoreRole, score })
        );
      } else {
        promises = Object.entries(scoreInputs).map(([competency, score]) =>
          api.post(`/talent/assessments/${selectedAssessment.id}/scores`, { competency, role: scoreRole, score })
        );
      }
      
      await Promise.all(promises);
      toast.success('Scores Saved', `Your ${scoreRole} assessment has been submitted.`);
      setSelectedAssessment(null);
      fetchMyAssessments();
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">My Performance Assessments</h1>
        <p className="page-subtitle">Tasks assigned to you for self, peer, or subordinate evaluation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: (selectedAssessment && selectedAssessment.instrument === 'PAPI Kostick') ? '1fr' : (selectedAssessment ? '1fr 1fr' : '1fr'), gap: '24px' }}>
        {/* List of Assessments */}
        {!(selectedAssessment && selectedAssessment.instrument === 'PAPI Kostick') && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Pending Evaluations</h3>
          {!user?.employeeId ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No employee record linked to your user account. Please contact HR.
            </div>
          ) : assessments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending assessments at this time.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {assessments.map(a => {
                const isSelf = a.employeeId === user.employeeId;
                const isManager = a.managerId === user.employeeId;
                const roleLabel = isSelf ? 'Self Assessment' : isManager ? 'Manager Assessment' : 'Peer Assessment';
                const roleIcon = isSelf ? <User size={16} /> : isManager ? <ShieldCheck size={16} /> : <Users size={16} />;
                const roleColor = isSelf ? '#6366F1' : isManager ? '#10B981' : '#F59E0B';

                return (
                  <div 
                    key={a.id} 
                    onClick={() => openAssessment(a)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      background: selectedAssessment?.id === a.id ? 'var(--color-primary-bg)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedAssessment?.id === a.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${roleColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleColor }}>
                        {roleIcon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{isSelf ? 'My Self Evaluation' : `Evaluate: ${a.employeeName}`}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.period} • {roleLabel}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${a.status === 'Completed' ? 'success' : 'warning'}`} style={{ fontSize: '0.7rem' }}>{a.status}</span>
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Evaluation Form */}
        {selectedAssessment && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="card-title">Evaluation Form</h3>
              <button className="btn-icon" onClick={() => setSelectedAssessment(null)}><Star size={20} /></button>
            </div>

            <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedAssessment.employeeName}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{selectedAssessment.position} • {selectedAssessment.period}</div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                Role: {scoreRole.toUpperCase()} {selectedAssessment.instrument ? `• ${selectedAssessment.instrument}` : ''}
              </div>
            </div>

            {isDetailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Loading form...</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                  {selectedAssessment.instrument === 'PAPI Kostick' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ padding: '12px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        Terdapat 90 pasang pernyataan. Pilihlah salah satu dari setiap pasangan pernyataan yang paling menggambarkan diri Anda dengan jujur.
                      </div>
                      {PAPI_STATEMENTS.map((stmt, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nomor {idx + 1}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', padding: '10px', borderRadius: '6px', background: papiAnswers[idx] === 'a' ? 'var(--color-primary-bg)' : 'transparent', border: `1px solid ${papiAnswers[idx] === 'a' ? 'var(--color-primary)' : 'var(--border-color)'}` }}>
                              <input type="radio" name={`papi_${idx}`} checked={papiAnswers[idx] === 'a'} onChange={() => setPapiAnswers(p => { const n = [...p]; n[idx] = 'a'; return n; })} />
                              <span>{stmt.a}</span>
                            </label>
                            <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', padding: '10px', borderRadius: '6px', background: papiAnswers[idx] === 'b' ? 'var(--color-primary-bg)' : 'transparent', border: `1px solid ${papiAnswers[idx] === 'b' ? 'var(--color-primary)' : 'var(--border-color)'}` }}>
                              <input type="radio" name={`papi_${idx}`} checked={papiAnswers[idx] === 'b'} onChange={() => setPapiAnswers(p => { const n = [...p]; n[idx] = 'b'; return n; })} />
                              <span>{stmt.b}</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    assessmentDetail.map(s => (
                      <div key={s.id} className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>{s.competency}</label>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{scoreInputs[s.competency] || 0}</span>
                        </div>
                        <input 
                          type="range" min="1" max="5" step="0.5" 
                          className="form-input" 
                          style={{ padding: 0, height: '6px', appearance: 'none', background: 'var(--border-color)', borderRadius: '5px' }}
                          value={scoreInputs[s.competency] || 0}
                          onChange={e => setScoreInputs(prev => ({ ...prev, [s.competency]: parseFloat(e.target.value) }))}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedAssessment(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmitScores} disabled={selectedAssessment.status === 'Completed'}>
                    <Send size={16} style={{ marginRight: '8px' }} /> Submit Evaluation
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
