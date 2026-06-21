import { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, CheckCircle, AlertTriangle, Send, X, ChevronRight, ChevronDown, Clock, Plus, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

const CONFIDENCE_CONFIG = {
  'On Track': { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'At Risk': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Off Track': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

function ProgressBar({ value, size = 'md', confidence }) {
  const pct = Math.round(parseFloat(value || 0) * 100);
  const clr = confidence === 'Off Track' ? '#EF4444' : confidence === 'At Risk' ? '#F59E0B' : pct >= 70 ? '#10B981' : pct >= 40 ? '#6366F1' : '#F59E0B';
  const h = size === 'sm' ? '4px' : '8px';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, height: h, borderRadius: '99px', background: 'var(--border-color)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: '99px', background: clr, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: size === 'sm' ? '0.72rem' : '0.82rem', fontWeight: 600, color: clr, minWidth: '36px', textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export default function MyOKR() {
  const [objectives, setObjectives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedObj, setExpandedObj] = useState({});
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInKR, setCheckInKR] = useState(null);
  const [checkInForm, setCheckInForm] = useState({ value: '', comment: '', confidence: 'On Track' });
  const [profile, setProfile] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const prof = await api.get('/ess/profile');
        setProfile(prof);
        if (prof?.employeeId) {
          const data = await api.get(`/talent/okr/employee/${prof.employeeId}`);
          setObjectives(data);
          // Auto-expand all
          const exp = {};
          data.forEach(o => { exp[o.id] = true; });
          setExpandedObj(exp);
        }
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    loadProfile();
  }, []);

  const summary = useMemo(() => {
    const total = objectives.length;
    const avgProgress = total > 0 ? objectives.reduce((s, o) => s + parseFloat(o.progress || 0), 0) / total : 0;
    const onTrack = objectives.filter(o => parseFloat(o.progress || 0) >= 0.4).length;
    const totalKRs = objectives.reduce((s, o) => s + (o.keyResults?.length || 0), 0);
    return { total, avgProgress, onTrack, atRisk: total - onTrack, totalKRs };
  }, [objectives]);

  const handleCheckIn = async () => {
    if (!checkInForm.value) {
      toast.error('Missing Value', 'Please enter the current value.');
      return;
    }
    try {
      await api.post(`/talent/okr/key-results/${checkInKR.id}/check-in`, {
        ...checkInForm,
        createdBy: profile?.employeeId,
      });
      setShowCheckIn(false);
      setCheckInForm({ value: '', comment: '', confidence: 'On Track' });
      // Refresh data
      const data = await api.get(`/talent/okr/employee/${profile.employeeId}`);
      setObjectives(data);
      toast.success('Check-in Saved', 'Your progress has been updated.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const refreshObjective = async (objId) => {
    try {
      const data = await api.get(`/talent/okr/employee/${profile.employeeId}`);
      setObjectives(data);
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your OKRs...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">My OKR</h1>
        <p className="page-subtitle">Track and update your Objectives & Key Results</p>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-icon primary"><Target size={24} /></div><div className="kpi-content"><div className="kpi-label">My Objectives</div><div className="kpi-value">{summary.total}</div></div></div>
        <div className="kpi-card"><div className="kpi-icon success"><TrendingUp size={24} /></div><div className="kpi-content"><div className="kpi-label">Avg. Progress</div><div className="kpi-value">{Math.round(summary.avgProgress * 100)}%</div></div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}><BarChart3 size={24} /></div><div className="kpi-content"><div className="kpi-label">Key Results</div><div className="kpi-value">{summary.totalKRs}</div></div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: summary.atRisk > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', color: summary.atRisk > 0 ? '#F59E0B' : '#10B981' }}><CheckCircle size={24} /></div><div className="kpi-content"><div className="kpi-label">On Track</div><div className="kpi-value">{summary.onTrack}/{summary.total}</div></div></div>
      </div>

      {objectives.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>No OKRs Assigned</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You don't have any objectives assigned for the current period. Contact your manager to set up your OKRs.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {objectives.map(obj => (
            <div key={obj.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Objective Header */}
              <div
                onClick={() => setExpandedObj(p => ({ ...p, [obj.id]: !p[obj.id] }))}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: expandedObj[obj.id] ? '1px solid var(--border-color-light)' : 'none' }}
              >
                {expandedObj[obj.id] ? <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{obj.title}</h3>
                    <span className={`badge ${obj.status === 'Active' ? 'success' : obj.status === 'Completed' ? 'primary' : 'neutral'}`} style={{ fontSize: '0.68rem' }}>
                      <span className="badge-dot" />{obj.status}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{obj.period}</span>
                  </div>
                  {obj.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{obj.description}</p>}

                  {/* Aligned parent */}
                  {obj.parentObjective && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>↗ Aligned to:</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontWeight: 500 }}>
                        [{obj.parentObjective.level}] {obj.parentObjective.title}
                      </span>
                    </div>
                  )}

                  <ProgressBar value={obj.progress} />
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: parseFloat(obj.progress || 0) >= 0.7 ? '#10B981' : parseFloat(obj.progress || 0) >= 0.4 ? '#6366F1' : '#F59E0B' }}>
                    {Math.round(parseFloat(obj.progress || 0) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Progress</div>
                </div>
              </div>

              {/* Expanded: Key Results */}
              {expandedObj[obj.id] && (
                <div style={{ padding: '16px 20px' }}>
                  {obj.keyResults?.length > 0 ? (
                    obj.keyResults.map(kr => {
                      const initial = parseFloat(kr.initialValue || 0);
                      const target = parseFloat(kr.targetValue || 1);
                      const current = parseFloat(kr.currentValue || 0);
                      const range = target - initial;
                      const pct = range > 0 ? Math.min(Math.max((current - initial) / range, 0), 1) : 0;
                      const conf = CONFIDENCE_CONFIG[kr.confidence] || CONFIDENCE_CONFIG['On Track'];

                      return (
                        <div key={kr.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{kr.metricName}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {current.toLocaleString()}{kr.unit ? ` ${kr.unit}` : ''} / {target.toLocaleString()}{kr.unit ? ` ${kr.unit}` : ''}
                                </span>
                                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '10px', background: conf.bg, color: conf.color, fontWeight: 600 }}>{kr.confidence}</span>
                              </div>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => { setCheckInKR(kr); setCheckInForm({ value: current.toString(), comment: '', confidence: kr.confidence || 'On Track' }); setShowCheckIn(true); }}>
                              <Send size={12} style={{ marginRight: '4px' }} /> Check-in
                            </button>
                          </div>
                          <ProgressBar value={pct} size="sm" confidence={kr.confidence} />
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No key results defined yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckIn && checkInKR && (
        <div className="modal-overlay" onClick={() => setShowCheckIn(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title"><Send size={16} style={{ marginRight: '8px' }} />Check-in</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{checkInKR.metricName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Current: {parseFloat(checkInKR.currentValue || 0).toLocaleString()}{checkInKR.unit ? ` ${checkInKR.unit}` : ''} → Target: {parseFloat(checkInKR.targetValue).toLocaleString()}{checkInKR.unit ? ` ${checkInKR.unit}` : ''}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowCheckIn(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">New Value *</label>
                <input className="form-input" type="number" value={checkInForm.value} onChange={e => setCheckInForm(p => ({ ...p, value: e.target.value }))} placeholder="Enter current progress value" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Confidence Level</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(CONFIDENCE_CONFIG).map(([label, cfg]) => (
                    <button key={label} className={`btn btn-sm ${checkInForm.confidence === label ? 'btn-primary' : 'btn-secondary'}`}
                      style={checkInForm.confidence === label ? { background: cfg.color, borderColor: cfg.color } : {}}
                      onClick={() => setCheckInForm(p => ({ ...p, confidence: label }))}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={checkInForm.comment} onChange={e => setCheckInForm(p => ({ ...p, comment: e.target.value }))} placeholder="What progress did you make? Any blockers?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckIn(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCheckIn} disabled={!checkInForm.value}><Send size={14} style={{ marginRight: '6px' }} />Submit Check-in</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
