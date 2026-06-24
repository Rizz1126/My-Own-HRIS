import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, X, ChevronRight, ChevronDown, TrendingUp, AlertTriangle, CheckCircle, Clock, Building2, Users, User, BarChart3, MessageSquare, Send, Trash2, Edit3, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { getInitials } from '../../utils/formatters';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

const LEVEL_CONFIG = {
  company: { label: 'Company', icon: Building2, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  department: { label: 'Department', icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  individual: { label: 'Individual', icon: User, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

const CONFIDENCE_CONFIG = {
  'On Track': { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  'At Risk': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle },
  'Off Track': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertTriangle },
};

const currentYear = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
const PERIODS = [`Q1 ${currentYear}`, `Q2 ${currentYear}`, `Q3 ${currentYear}`, `Q4 ${currentYear}`, `Q1 ${currentYear + 1}`];

function ProgressBar({ value, size = 'md', confidence = 'On Track' }) {
  const pct = Math.round((parseFloat(value || 0)) * 100);
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

function KRProgress({ kr }) {
  const initial = parseFloat(kr.initialValue || 0);
  const target = parseFloat(kr.targetValue || 1);
  const current = parseFloat(kr.currentValue || 0);
  const range = target - initial;
  const pct = range > 0 ? Math.min(Math.max((current - initial) / range, 0), 1) : 0;
  const conf = CONFIDENCE_CONFIG[kr.confidence] || CONFIDENCE_CONFIG['On Track'];
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{kr.metricName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {current.toLocaleString()}{kr.unit ? ` ${kr.unit}` : ''} / {target.toLocaleString()}{kr.unit ? ` ${kr.unit}` : ''}
          </span>
          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '10px', background: conf.bg, color: conf.color, fontWeight: 600 }}>{kr.confidence}</span>
        </div>
      </div>
      <ProgressBar value={pct} size="sm" confidence={kr.confidence} />
    </div>
  );
}

function ObjectiveCard({ obj, onSelect, isSelected, compact = false }) {
  const levelCfg = LEVEL_CONFIG[obj.level] || LEVEL_CONFIG.individual;
  const LevelIcon = levelCfg.icon;
  const krCount = obj.keyResults?.length || 0;

  return (
    <div
      onClick={() => onSelect(obj.id)}
      className="card"
      style={{
        padding: compact ? '12px 14px' : '16px 20px',
        cursor: 'pointer',
        border: isSelected ? `2px solid ${levelCfg.color}` : '1px solid var(--border-color)',
        background: isSelected ? levelCfg.bg : undefined,
        transition: 'all 0.2s ease',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: levelCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LevelIcon size={16} style={{ color: levelCfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: levelCfg.bg, color: levelCfg.color, fontWeight: 600, textTransform: 'capitalize' }}>{obj.level}</span>
            <span className={`badge ${obj.status === 'Active' ? 'success' : obj.status === 'Completed' ? 'primary' : 'neutral'}`} style={{ fontSize: '0.68rem' }}>
              <span className="badge-dot" />{obj.status}
            </span>
          </div>
          <h4 style={{ fontSize: compact ? '0.88rem' : '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>{obj.title}</h4>
          {obj.ownerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `hsl(${(obj.ownerName || '').charCodeAt(0) * 137.5 % 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 700 }}>{getInitials(obj.ownerName)}</div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{obj.ownerName}</span>
            </div>
          )}
          {obj.departmentName && !obj.ownerName && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>📂 {obj.departmentName}</span>
          )}
          <ProgressBar value={obj.progress} confidence={krCount > 0 ? undefined : 'On Track'} />
          {!compact && krCount > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>{krCount} Key Result{krCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OKRBoard() {
  const [period, setPeriod] = useState(`Q${currentQuarter} ${currentYear}`);
  const [treeData, setTreeData] = useState(null);
  const [allObjectives, setAllObjectives] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInKR, setCheckInKR] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' | 'list'
  const [filterLevel, setFilterLevel] = useState('all');
  const [expandedCompany, setExpandedCompany] = useState({});
  const [expandedDept, setExpandedDept] = useState({});
  const [showAddKRModal, setShowAddKRModal] = useState(false);
  const toast = useToast();

  const [createForm, setCreateForm] = useState({
    title: '', description: '', level: 'company', period: period,
    parentObjectiveId: '', ownerId: '', departmentId: '', status: 'Active',
    keyResults: [{ metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' }],
  });

  const [krForm, setKRForm] = useState({ metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' });
  const [checkInForm, setCheckInForm] = useState({ value: '', comment: '', confidence: 'On Track' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tree, objs, emps] = await Promise.all([
        api.get(`/talent/okr/tree?period=${encodeURIComponent(period)}`),
        api.get(`/talent/okr?period=${encodeURIComponent(period)}`),
        api.get('/employees'),
      ]);
      setTreeData(tree);
      setAllObjectives(objs);
      setEmployees(emps);
      // Extract departments from employees
      const deptMap = new Map();
      emps.forEach(e => { if (e.department?.id) deptMap.set(e.department.id, e.department); });
      setDepartments(Array.from(deptMap.values()));

      // Auto-expand first company objective
      if (tree.company?.length > 0) {
        const exp = {};
        tree.company.forEach(c => { exp[c.id] = true; });
        setExpandedCompany(exp);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchDetail = async (id) => {
    try {
      setIsDetailLoading(true);
      const data = await api.get(`/talent/okr/${id}`);
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setIsDetailLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period]);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId]);

  const summary = useMemo(() => {
    const total = allObjectives.length;
    const avgProgress = total > 0 ? allObjectives.reduce((s, o) => s + parseFloat(o.progress || 0), 0) / total : 0;
    const onTrack = allObjectives.filter(o => parseFloat(o.progress || 0) >= 0.4).length;
    const atRisk = total - onTrack;
    const completed = allObjectives.filter(o => o.status === 'Completed').length;
    return { total, avgProgress, onTrack, atRisk, completed };
  }, [allObjectives]);

  const filteredObjectives = useMemo(() => {
    if (filterLevel === 'all') return allObjectives;
    return allObjectives.filter(o => o.level === filterLevel);
  }, [allObjectives, filterLevel]);

  const parentOptions = useMemo(() => {
    if (createForm.level === 'company') return [];
    if (createForm.level === 'department') return allObjectives.filter(o => o.level === 'company');
    return allObjectives.filter(o => o.level === 'department' || o.level === 'company');
  }, [createForm.level, allObjectives]);

  const handleCreateObjective = async () => {
    if (!createForm.title || !createForm.level) {
      toast.error('Missing Info', 'Title and level are required.');
      return;
    }
    try {
      const objData = {
        title: createForm.title,
        description: createForm.description,
        level: createForm.level,
        period: createForm.period || period,
        status: createForm.status,
        parentObjectiveId: createForm.parentObjectiveId || null,
        ownerId: createForm.ownerId || null,
        departmentId: createForm.departmentId || null,
      };
      const newObj = await api.post('/talent/okr', objData);

      // Create Key Results
      for (const kr of createForm.keyResults) {
        if (kr.metricName && kr.targetValue) {
          await api.post(`/talent/okr/${newObj.id}/key-results`, {
            metricName: kr.metricName,
            unit: kr.unit,
            initialValue: kr.initialValue || '0',
            targetValue: kr.targetValue,
            weight: kr.weight || '1',
          });
        }
      }

      setShowCreateModal(false);
      setCreateForm({
        title: '', description: '', level: 'company', period: period,
        parentObjectiveId: '', ownerId: '', departmentId: '', status: 'Active',
        keyResults: [{ metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' }],
      });
      fetchData();
      toast.success('Objective Created', 'New OKR has been created successfully.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleAddKR = async () => {
    if (!krForm.metricName || !krForm.targetValue) {
      toast.error('Missing Info', 'Metric name and target value are required.');
      return;
    }
    try {
      await api.post(`/talent/okr/${selectedId}/key-results`, krForm);
      setShowAddKRModal(false);
      setKRForm({ metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' });
      fetchDetail(selectedId);
      fetchData();
      toast.success('Key Result Added', 'New KR added to objective.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleCheckIn = async () => {
    if (!checkInForm.value) {
      toast.error('Missing Value', 'Please enter the current value.');
      return;
    }
    try {
      await api.post(`/talent/okr/key-results/${checkInKR.id}/check-in`, checkInForm);
      setShowCheckInModal(false);
      setCheckInForm({ value: '', comment: '', confidence: 'On Track' });
      fetchDetail(selectedId);
      fetchData();
      toast.success('Check-in Saved', 'Progress has been updated.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleDeleteObjective = async (id) => {
    try {
      await api.delete(`/talent/okr/${id}`);
      if (selectedId === id) { setSelectedId(null); setDetail(null); }
      fetchData();
      toast.success('Deleted', 'Objective has been removed.');
    } catch (err) { toast.error('Error', err.message); }
  };

  const handleDeleteKR = async (krId) => {
    try {
      await api.delete(`/talent/okr/key-results/${krId}`);
      fetchDetail(selectedId);
      fetchData();
      toast.success('Deleted', 'Key Result removed.');
    } catch (err) { toast.error('Error', err.message); }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading OKR data...</div>;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">OKR Management</h1>
          <p className="page-subtitle">Objectives & Key Results — cascading dari organisasi ke individu</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="form-input" style={{ width: '140px', padding: '8px 12px' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setCreateForm(f => ({ ...f, period })); setShowCreateModal(true); }}>
            <Plus size={16} /> New Objective
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-icon primary"><Target size={24} /></div><div className="kpi-content"><div className="kpi-label">Total Objectives</div><div className="kpi-value">{summary.total}</div></div></div>
        <div className="kpi-card"><div className="kpi-icon success"><TrendingUp size={24} /></div><div className="kpi-content"><div className="kpi-label">Avg. Progress</div><div className="kpi-value">{Math.round(summary.avgProgress * 100)}%</div></div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}><CheckCircle size={24} /></div><div className="kpi-content"><div className="kpi-label">On Track</div><div className="kpi-value">{summary.onTrack}</div></div></div>
        <div className="kpi-card"><div className="kpi-icon warning"><AlertTriangle size={24} /></div><div className="kpi-content"><div className="kpi-label">Needs Attention</div><div className="kpi-value">{summary.atRisk}</div></div></div>
      </div>

      {/* View Controls */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={`btn ${viewMode === 'hierarchy' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('hierarchy')}>Hierarchy</button>
          <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('list')}>List View</button>
        </div>
        {viewMode === 'list' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            {['all', 'company', 'department', 'individual'].map(f => (
              <button key={f} className={`btn btn-sm ${filterLevel === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterLevel(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        )}
      </div>

      <div className="grid-dashboard">
        {/* Left: Objectives List/Tree */}
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          {viewMode === 'hierarchy' ? (
            // HIERARCHY VIEW
            treeData?.company?.length > 0 ? (
              treeData.company.map(compObj => (
                <div key={compObj.id} style={{ marginBottom: '16px' }}>
                  <div onClick={() => setExpandedCompany(prev => ({ ...prev, [compObj.id]: !prev[compObj.id] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '8px' }}>
                    {expandedCompany[compObj.id] ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <ObjectiveCard obj={compObj} onSelect={setSelectedId} isSelected={selectedId === compObj.id} />

                  {expandedCompany[compObj.id] && compObj.children?.length > 0 && (
                    <div style={{ marginLeft: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px' }}>
                      {compObj.children.map(deptObj => (
                        <div key={deptObj.id} style={{ marginBottom: '8px' }}>
                          <div onClick={() => setExpandedDept(prev => ({ ...prev, [deptObj.id]: !prev[deptObj.id] }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '4px' }}>
                            {expandedDept[deptObj.id] ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                          </div>
                          <ObjectiveCard obj={deptObj} onSelect={setSelectedId} isSelected={selectedId === deptObj.id} compact />

                          {expandedDept[deptObj.id] && deptObj.children?.length > 0 && (
                            <div style={{ marginLeft: '16px', borderLeft: '2px solid var(--border-color-light)', paddingLeft: '12px' }}>
                              {deptObj.children.map(indObj => (
                                <ObjectiveCard key={indObj.id} obj={indObj} onSelect={setSelectedId} isSelected={selectedId === indObj.id} compact />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Also show orphan department/individual objectives
              allObjectives.length > 0 ? (
                allObjectives.map(obj => <ObjectiveCard key={obj.id} obj={obj} onSelect={setSelectedId} isSelected={selectedId === obj.id} />)
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <Target size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No objectives for {period}</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "New Objective" to create your first OKR.</p>
                </div>
              )
            )
          ) : (
            // LIST VIEW
            filteredObjectives.length > 0 ? (
              filteredObjectives.map(obj => <ObjectiveCard key={obj.id} obj={obj} onSelect={setSelectedId} isSelected={selectedId === obj.id} />)
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>No objectives found.</p>
              </div>
            )
          )}
        </div>

        {/* Right: Detail Panel */}
        {detail ? (
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {isDetailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: LEVEL_CONFIG[detail.level]?.bg, color: LEVEL_CONFIG[detail.level]?.color, fontWeight: 600, textTransform: 'capitalize' }}>{detail.level}</span>
                      <span className={`badge ${detail.status === 'Active' ? 'success' : detail.status === 'Completed' ? 'primary' : 'neutral'}`} style={{ fontSize: '0.68rem' }}>
                        <span className="badge-dot" />{detail.status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{detail.period}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{detail.title}</h3>
                    {detail.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{detail.description}</p>}
                    {detail.ownerName && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>👤 {detail.ownerName} {detail.ownerPosition ? `• ${detail.ownerPosition}` : ''}</p>}
                    {detail.departmentName && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>📂 {detail.departmentName}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-icon" style={{ color: 'var(--color-danger)', padding: '4px' }} onClick={() => handleDeleteObjective(detail.id)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>

                {/* Overall Progress */}
                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Overall Progress</div>
                  <ProgressBar value={detail.progress} />
                </div>

                {/* Key Results */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Key Results</h4>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowAddKRModal(true)}><Plus size={13} /> Add KR</button>
                  </div>

                  {detail.keyResults?.length > 0 ? (
                    detail.keyResults.map(kr => (
                      <div key={kr.id} style={{ position: 'relative' }}>
                        <KRProgress kr={kr} />
                        <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '10px', right: '0' }}>
                          <button className="btn-icon" style={{ padding: '2px' }} title="Check-in" onClick={() => { setCheckInKR(kr); setCheckInForm({ value: kr.currentValue || '', comment: '', confidence: kr.confidence || 'On Track' }); setShowCheckInModal(true); }}>
                            <Send size={12} style={{ color: 'var(--color-primary)' }} />
                          </button>
                          <button className="btn-icon" style={{ padding: '2px' }} title="Delete KR" onClick={() => handleDeleteKR(kr.id)}>
                            <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        </div>

                        {/* Check-in History (mini) */}
                        {kr.checkIns?.length > 0 && (
                          <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                            <ResponsiveContainer width="100%" height={60}>
                              <LineChart data={[...kr.checkIns].reverse().map(c => ({ date: new Date(c.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), val: parseFloat(c.value) }))}>
                                <Line type="monotone" dataKey="val" stroke={LEVEL_CONFIG[detail.level]?.color || '#6366F1'} strokeWidth={2} dot={{ r: 2 }} />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No key results yet. Add one to start tracking progress.</p>
                  )}
                </div>

                {/* Child Objectives */}
                {detail.childObjectives?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Aligned Objectives ({detail.childObjectives.length})</h4>
                    {detail.childObjectives.map(child => (
                      <div key={child.id} onClick={() => setSelectedId(child.id)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color-light)', marginBottom: '6px', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '8px', background: LEVEL_CONFIG[child.level]?.bg, color: LEVEL_CONFIG[child.level]?.color, fontWeight: 600, textTransform: 'capitalize', marginRight: '6px' }}>{child.level}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{child.title}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{Math.round(parseFloat(child.progress || 0) * 100)}%</span>
                        </div>
                        {child.ownerName && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>👤 {child.ownerName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>Select an objective to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ CREATE OBJECTIVE MODAL ═══════ */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Plus size={18} style={{ marginRight: '8px' }} />New Objective</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Level *</label>
                  <select className="form-input" value={createForm.level} onChange={e => setCreateForm(p => ({ ...p, level: e.target.value, parentObjectiveId: '', ownerId: '', departmentId: '' }))}>
                    <option value="company">🏢 Company</option>
                    <option value="department">🏬 Department</option>
                    <option value="individual">👤 Individual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Period *</label>
                  <select className="form-input" value={createForm.period} onChange={e => setCreateForm(p => ({ ...p, period: e.target.value }))}>
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={createForm.status} onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objective Title *</label>
                <input className="form-input" value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Increase revenue by 30% through enterprise clients" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional context or details..." />
              </div>

              {createForm.level !== 'company' && (
                <div className="form-group">
                  <label className="form-label">Align to Parent Objective</label>
                  <select className="form-input" value={createForm.parentObjectiveId} onChange={e => setCreateForm(p => ({ ...p, parentObjectiveId: e.target.value }))}>
                    <option value="">— No alignment —</option>
                    {parentOptions.map(o => <option key={o.id} value={o.id}>[{o.level.toUpperCase()}] {o.title}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {(createForm.level === 'department' || createForm.level === 'company') && (
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-input" value={createForm.departmentId} onChange={e => setCreateForm(p => ({ ...p, departmentId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                {createForm.level === 'individual' && (
                  <div className="form-group">
                    <label className="form-label">Owner (Employee) *</label>
                    <select className="form-input" value={createForm.ownerId} onChange={e => setCreateForm(p => ({ ...p, ownerId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Key Results inline */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Key Results</label>
                {createForm.keyResults.map((kr, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input className="form-input" placeholder="Metric name" value={kr.metricName} onChange={e => { const krs = [...createForm.keyResults]; krs[i].metricName = e.target.value; setCreateForm(p => ({ ...p, keyResults: krs })); }} />
                    <input className="form-input" placeholder="Unit" value={kr.unit} onChange={e => { const krs = [...createForm.keyResults]; krs[i].unit = e.target.value; setCreateForm(p => ({ ...p, keyResults: krs })); }} />
                    <input className="form-input" placeholder="Start" type="number" value={kr.initialValue} onChange={e => { const krs = [...createForm.keyResults]; krs[i].initialValue = e.target.value; setCreateForm(p => ({ ...p, keyResults: krs })); }} />
                    <input className="form-input" placeholder="Target" type="number" value={kr.targetValue} onChange={e => { const krs = [...createForm.keyResults]; krs[i].targetValue = e.target.value; setCreateForm(p => ({ ...p, keyResults: krs })); }} />
                    <button className="btn-icon" onClick={() => { const krs = createForm.keyResults.filter((_, j) => j !== i); setCreateForm(p => ({ ...p, keyResults: krs.length ? krs : [{ metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' }] })); }}>
                      <X size={14} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                ))}
                <button className="btn btn-sm btn-secondary" onClick={() => setCreateForm(p => ({ ...p, keyResults: [...p.keyResults, { metricName: '', unit: '', initialValue: '0', targetValue: '', weight: '1' }] }))}>
                  <Plus size={13} /> Add Key Result
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateObjective} disabled={!createForm.title}>Create Objective</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD KEY RESULT MODAL ═══════ */}
      {showAddKRModal && (
        <div className="modal-overlay" onClick={() => setShowAddKRModal(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Key Result</h3>
              <button className="modal-close" onClick={() => setShowAddKRModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Metric Name *</label>
                <input className="form-input" value={krForm.metricName} onChange={e => setKRForm(p => ({ ...p, metricName: e.target.value }))} placeholder="e.g. New enterprise clients acquired" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-input" value={krForm.unit} onChange={e => setKRForm(p => ({ ...p, unit: e.target.value }))} placeholder="%, IDR, count" />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Value</label>
                  <input className="form-input" type="number" value={krForm.initialValue} onChange={e => setKRForm(p => ({ ...p, initialValue: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Value *</label>
                  <input className="form-input" type="number" value={krForm.targetValue} onChange={e => setKRForm(p => ({ ...p, targetValue: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddKRModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddKR} disabled={!krForm.metricName || !krForm.targetValue}>Add Key Result</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ CHECK-IN MODAL ═══════ */}
      {showCheckInModal && checkInKR && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title"><Send size={16} style={{ marginRight: '8px' }} />Check-in: {checkInKR.metricName}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Current: {parseFloat(checkInKR.currentValue || 0).toLocaleString()}{checkInKR.unit ? ` ${checkInKR.unit}` : ''} → Target: {parseFloat(checkInKR.targetValue).toLocaleString()}{checkInKR.unit ? ` ${checkInKR.unit}` : ''}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowCheckInModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">New Value *</label>
                <input className="form-input" type="number" value={checkInForm.value} onChange={e => setCheckInForm(p => ({ ...p, value: e.target.value }))} placeholder="Enter current progress value" />
              </div>
              <div className="form-group">
                <label className="form-label">Confidence</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.keys(CONFIDENCE_CONFIG).map(c => (
                    <button key={c} className={`btn btn-sm ${checkInForm.confidence === c ? 'btn-primary' : 'btn-secondary'}`}
                      style={checkInForm.confidence === c ? { background: CONFIDENCE_CONFIG[c].color, borderColor: CONFIDENCE_CONFIG[c].color } : {}}
                      onClick={() => setCheckInForm(p => ({ ...p, confidence: c }))}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea className="form-input" rows={2} value={checkInForm.comment} onChange={e => setCheckInForm(p => ({ ...p, comment: e.target.value }))} placeholder="What progress was made? Any blockers?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCheckIn} disabled={!checkInForm.value}><Send size={14} style={{ marginRight: '6px' }} />Submit Check-in</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
