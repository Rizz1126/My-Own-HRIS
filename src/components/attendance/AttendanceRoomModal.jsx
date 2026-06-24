import { useState, useMemo, useEffect } from 'react';
import { X, LogIn, Eye, ChevronRight, ArrowLeft, Plus, Check, CheckCircle2, Minus, Play, Square, RefreshCw, Clock, ChevronLeft, Shuffle } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceRoomModal({ onClose, onStatusChange }) {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────
  const [step, setStep] = useState('select'); // 'select' | 'room'
  const [showOtherRooms, setShowOtherRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [myStatus, setMyStatus] = useState('standby');
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  // Session control
  const [workState, setWorkState] = useState('idle'); // 'idle' | 'active' | 'stopped'
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  // Member detail panel
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberPopup, setShowMemberPopup] = useState(false);
  const [allDepartments, setAllDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const ROOM_STATUSES = [
    { id: 'working',  label: 'Working',  emoji: '💻', color: '#6366F1' },
    { id: 'meeting',  label: 'Meeting',  emoji: '🤝', color: '#F59E0B' },
    { id: 'focus',    label: 'Focus',    emoji: '🎯', color: '#8B5CF6' },
    { id: 'learning', label: 'Learning', emoji: '📚', color: '#3B82F6' },
    { id: 'break',    label: 'Break',    emoji: '☕', color: '#10B981' },
    { id: 'afk',      label: 'AFK',      emoji: '🚶', color: '#94A3B8' },
    { id: 'away',     label: 'Away',     emoji: '📵', color: '#EF4444' },
  ];

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (onStatusChange) {
      const s = ROOM_STATUSES.find(x => x.id === myStatus);
      onStatusChange(workState === 'stopped' ? null : s);
    }
  }, [myStatus, workState, onStatusChange]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/master-data/departments');
        setAllDepartments(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, []);

  const fetchMembers = async (deptId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/employees/department/${deptId}`);
      setMembers(res.map(m => ({
        ...m,
        isInRoom: true, // Mocked status for now
        statusEmoji: '💻',
        statusLabel: 'Working',
        statusColor: '#6366F1'
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Directorates ───────────────────────────────────────
  const delegatedRooms = useMemo(() => {
    if (user?.departmentId) {
      return allDepartments.filter(d => d.id === user.departmentId);
    }
    return allDepartments.slice(0, 1);
  }, [allDepartments, user]);

  const otherRooms = useMemo(() => {
    const delegatedIds = delegatedRooms.map(d => d.id);
    return allDepartments.filter(d => !delegatedIds.includes(d.id));
  }, [allDepartments, delegatedRooms]);

  const roomStats = useMemo(() => {
    const total = members.length;
    const inRoom = members.filter(m => m.isInRoom).length;
    return { total, inRoom, absent: 0, other: 0 };
  }, [members]);

  // ── Task helpers ───────────────────────────────────────
  const totalProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setTasks(prev => [...prev, { id: Date.now(), title: newTaskTitle.trim(), progress: 0, startedAt: now, completedAt: null }]);
    setNewTaskTitle('');
    setShowTaskInput(false);
  };

  const updateProgress = (id, val) => setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: Math.min(100, Math.max(0, val)) } : t));
  const completeTask = (id) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: 100, completedAt: now } : t));
  };
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleMemberClick = (m) => {
    setSelectedMember(m);
    setShowMemberPopup(true);
  };

  const enterRoom = (room, spectator = false) => {
    setSelectedRoom(room);
    setIsSpectator(spectator);
    setStep('room');
    setSelectedMember(null);
    fetchMembers(room.id);
    // Restore persisted session if exists
    const saved = sessionStorage.getItem('hris-attendance-session');
    if (saved && !spectator) {
      try {
        const s = JSON.parse(saved);
        setWorkState(s.workState || 'idle');
        setStartTime(s.startTime || null);
        setStopTime(s.stopTime || null);
        setLastUpdate(s.lastUpdate || null);
        setMyStatus(s.myStatus || 'standby');
        if (s.tasks) setTasks(s.tasks);
      } catch { /* ignore */ }
    } else {
      setWorkState('idle');
      setStartTime(null);
      setStopTime(null);
    }
  };

  // Persist session to sessionStorage whenever key state changes
  useEffect(() => {
    if (workState !== 'idle') {
      sessionStorage.setItem('hris-attendance-session', JSON.stringify({ workState, startTime, stopTime, lastUpdate, myStatus, tasks }));
    }
  }, [workState, startTime, stopTime, lastUpdate, myStatus, tasks]);

  const handleStart = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setStartTime(now);
    setWorkState('active');
    setMyStatus('working');
  };

  const handleUpdate = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setLastUpdate(now);
  };

  const handleStop = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setStopTime(now);
    setWorkState('stopped');
    setMyStatus('standby');
    sessionStorage.removeItem('hris-attendance-session');
  };

  const getMemberTasks = (member) => [
    { id: 1, title: 'Developing features', progress: 100, startedAt: '08:15', completedAt: '11:30' },
    { id: 2, title: 'Bug fixing', progress: 45, startedAt: '13:00', completedAt: null },
  ];

  const RoomCard = ({ room, spectator = false }) => {
    return (
      <div
        onClick={() => enterRoom(room, spectator)}
        style={{
          padding: '16px 18px', borderRadius: '14px',
          background: 'var(--bg-secondary)', border: `1px solid var(--border-color)`,
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = spectator ? '#8B5CF6' : 'var(--color-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: '3px', fontSize: '0.95rem' }}>{room.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room ID: {room.id.slice(0, 8)}</div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {spectator ? <Eye size={16} color="#8B5CF6" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </div>
    );
  };

  return (<>
    <div className="modal-overlay" onClick={step === 'select' ? onClose : undefined}>
      <div
        className="modal-container"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: step === 'room' ? '820px' : '500px', width: '95vw', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 'room' && (
              <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', borderRadius: '8px' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h3 className="modal-title" style={{ margin: 0 }}>
                {step === 'select' ? '🚪 Enter Room' : `🏢 ${selectedRoom?.name}`}
              </h3>
              {step === 'room' && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isSpectator ? '👁 Spectator Mode — read only' : `✅ Checked in • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                </p>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

          {/* ══ STEP: SELECT ROOM ══════════════════════════════ */}
          {step === 'select' && (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.88rem' }}>
                Select a room based on your delegation. Or enable spectator mode to view other rooms.
              </p>

              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                🎯 Your Rooms
              </div>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                {delegatedRooms.map(room => <RoomCard key={room.id} room={room} spectator={false} />)}
              </div>

              {/* Spectator toggle */}
              <div
                onClick={() => setShowOtherRooms(p => !p)}
                style={{
                  padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-secondary)',
                  border: `1px solid ${showOtherRooms ? '#8B5CF6' : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  transition: 'border-color 0.2s', marginBottom: showOtherRooms ? '16px' : 0,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '6px', flexShrink: 0, transition: 'all 0.2s',
                  background: showOtherRooms ? '#8B5CF6' : 'transparent',
                  border: `2px solid ${showOtherRooms ? '#8B5CF6' : 'var(--border-color)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {showOtherRooms && <Check size={12} color="white" />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} /> Show other rooms as spectator
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>View other rooms' status without checking in</div>
                </div>
              </div>

              {showOtherRooms && otherRooms.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    👁 Other Rooms (Spectator)
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {otherRooms.map(room => <RoomCard key={room.id} room={room} spectator={true} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP: ROOM VIEW ════════════════════════════════ */}
          {step === 'room' && (
            <div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Total', value: roomStats.total, color: 'var(--text-primary)', bg: 'var(--bg-secondary)' },
                  { label: 'Available', value: roomStats.inRoom, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                  { label: 'Absent', value: roomStats.absent, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
                  { label: 'Other Room', value: roomStats.other, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px', borderRadius: '14px', background: s.bg, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* LEFT: Status + Members */}
                <div>
                  {/* Status switcher — single dropdown button */}
                  {!isSpectator && (
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                      <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.85rem' }}>🔄 Work Status</div>
                      <button
                        onClick={() => setShowStatusDropdown(p => !p)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: '12px', border: `2px solid ${ROOM_STATUSES.find(s => s.id === myStatus)?.color || 'var(--border-color)'}`,
                          background: `${ROOM_STATUSES.find(s => s.id === myStatus)?.color || '#6366F1'}15`,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{ROOM_STATUSES.find(s => s.id === myStatus)?.emoji || '💻'}</span>
                          <span style={{ fontWeight: 700, color: ROOM_STATUSES.find(s => s.id === myStatus)?.color || '#6366F1', fontSize: '0.9rem' }}>
                            {ROOM_STATUSES.find(s => s.id === myStatus)?.label || 'Working'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▾ Change</span>
                      </button>
                      {showStatusDropdown && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                          background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                          borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                          overflow: 'hidden', padding: '6px',
                        }}>
                          {ROOM_STATUSES.map(s => (
                            <button key={s.id} onClick={() => { setMyStatus(s.id); setShowStatusDropdown(false); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                background: myStatus === s.id ? `${s.color}18` : 'transparent',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = `${s.color}12`}
                              onMouseLeave={e => e.currentTarget.style.background = myStatus === s.id ? `${s.color}18` : 'transparent'}
                            >
                              <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
                              <span style={{ fontWeight: myStatus === s.id ? 700 : 500, color: myStatus === s.id ? s.color : 'var(--text-primary)', fontSize: '0.88rem' }}>{s.label}</span>
                              {myStatus === s.id && <span style={{ marginLeft: 'auto', color: s.color, fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.85rem' }}>👥 Team ({roomStats.total}) <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>— click to view tasks</span></div>
                    <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                      {isLoading ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading members...</div> : members.map(m => (
                        <div
                          key={m.id}
                          onClick={() => handleMemberClick(m)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            border: '1px solid transparent',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-bg)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.avatarColor || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                            {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.position}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.9rem' }}>{m.statusEmoji}</span>
                            <span style={{ fontSize: '0.7rem', color: m.statusColor, fontWeight: 600 }}>{m.statusLabel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Task Plan */}
                <div>
                  {isSpectator ? (
                    <div style={{ padding: '24px', borderRadius: '14px', background: 'var(--bg-secondary)', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Eye size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.9rem' }}>Spectator mode — task management is not available.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Task header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>📋 Task Plan</div>
                          {tasks.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Overall: <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{totalProgress}%</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowTaskInput(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          <Plus size={13} /> Add Task
                        </button>
                      </div>

                      {/* Overall progress bar */}
                      {tasks.length > 0 && (
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-color)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${totalProgress}%`, background: totalProgress === 100 ? '#10B981' : 'var(--color-primary)', borderRadius: '4px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}

                      {/* Add task input */}
                      {showTaskInput && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setShowTaskInput(false); setNewTaskTitle(''); } }}
                            placeholder="Enter task plan..."
                            className="form-input"
                            style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
                          />
                          <button onClick={addTask} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#10B981', color: 'white', cursor: 'pointer' }}><Check size={15} /></button>
                          <button onClick={() => { setShowTaskInput(false); setNewTaskTitle(''); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}><X size={15} /></button>
                        </div>
                      )}

                      {/* Task list */}
                      {tasks.length === 0 && !showTaskInput ? (
                        <div style={{ textAlign: 'center', padding: '30px 16px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          <CheckCircle2 size={28} style={{ marginBottom: '8px', opacity: 0.35 }} />
                          <p style={{ fontSize: '0.85rem' }}>Add your daily task plan above.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
                          {tasks.map(task => (
                            <div key={task.id} style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-secondary)', border: `1px solid ${task.progress === 100 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}` }}>
                              {/* Task title + remove */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                  {task.progress === 100 && <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />}
                                  <span style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: task.progress === 100 ? 'line-through' : 'none', opacity: task.progress === 100 ? 0.6 : 1 }}>{task.title}</span>
                                </div>
                                <button onClick={() => removeTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex', marginLeft: '6px', flexShrink: 0 }}>
                                  <Minus size={13} />
                                </button>
                              </div>
                              {/* Time details */}
                              <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: task.progress === 100 ? '20px' : '0' }}>
                                {task.startedAt && <span><Clock size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />Started: <strong>{task.startedAt}</strong></span>}
                                {task.completedAt ? <span style={{ color: '#10B981' }}>Completed: <strong>{task.completedAt}</strong></span> : task.startedAt && <span style={{ color: '#F59E0B', fontStyle: 'italic' }}>⏳ In progress</span>}
                              </div>

                              {/* Progress + Done */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="range" min={0} max={100} value={task.progress}
                                  onChange={e => updateProgress(task.id, Number(e.target.value))}
                                  style={{ flex: 1, accentColor: task.progress === 100 ? '#10B981' : 'var(--color-primary)', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: task.progress === 100 ? '#10B981' : 'var(--color-primary)', minWidth: '32px', textAlign: 'right' }}>{task.progress}%</span>
                                {task.progress < 100 && (
                                  <button
                                    onClick={() => completeTask(task.id)}
                                    title="Mark as done"
                                    style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}
                                  >
                                    Done
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'room' && !isSpectator && (
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
            {/* Session info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                {startTime && <span><Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Started: <strong>{startTime}</strong></span>}
                {lastUpdate && <span>Update: <strong>{lastUpdate}</strong></span>}
                {stopTime && <span style={{ color: '#EF4444' }}>Finished: <strong>{stopTime}</strong></span>}
              </div>
              {tasks.length > 0 && <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{totalProgress}% completed</span>}
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {workState === 'idle' && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handleStart}
                >
                  <Play size={15} /> Start Work
                </button>
              )}
              {workState === 'active' && (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => setShowTaskInput(true)}
                  >
                    <Shuffle size={14} /> Switch Task
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={handleStop}
                  >
                    <Square size={14} /> End Session
                  </button>
                </>
              )}
              {workState === 'stopped' && (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => { setWorkState('active'); setStopTime(null); setMyStatus('working'); }}
                  >
                    <Play size={14} /> Resume
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => { sessionStorage.removeItem('hris-attendance-session'); onClose(); }}
                  >
                    <Check size={14} /> Check Out & Leave
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Member Activity Popup ── */}
    {showMemberPopup && selectedMember && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
        onClick={() => setShowMemberPopup(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '380px', maxWidth: '90vw',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
            overflow: 'hidden',
            animation: 'scaleIn 0.2s ease',
          }}
        >
          {/* Popup Header */}
          <div style={{
            padding: '20px 20px 16px',
            background: `linear-gradient(135deg, ${selectedMember.avatarColor || '#6366F1'}18, ${selectedMember.avatarColor || '#8B5CF6'}08)`,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '14px',
                  background: selectedMember.avatarColor || '#6366F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: 'white',
                  boxShadow: `0 4px 12px ${selectedMember.avatarColor || '#6366F1'}44`,
                }}>
                  {selectedMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedMember.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedMember.position || 'Team Member'}</div>
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>{selectedMember.statusEmoji}</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                      background: `${selectedMember.statusColor}18`, color: selectedMember.statusColor,
                    }}>
                      {selectedMember.statusLabel}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMemberPopup(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Popup Body — Task List */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              📋 Today's Task Plan
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {getMemberTasks(selectedMember).map(t => (
                <div key={t.id} style={{
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${t.progress === 100 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: 600,
                      opacity: t.progress === 100 ? 0.5 : 1,
                      textDecoration: t.progress === 100 ? 'line-through' : 'none',
                    }}>{t.title}</span>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 800, minWidth: '36px', textAlign: 'right',
                      color: t.progress === 100 ? '#10B981' : 'var(--color-primary)',
                    }}>{t.progress}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {t.startedAt && <span><Clock size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />Started: <strong>{t.startedAt}</strong></span>}
                    {t.completedAt ? <span style={{ color: '#10B981' }}>Completed: <strong>{t.completedAt}</strong></span> : t.startedAt && <span style={{ color: '#F59E0B', fontStyle: 'italic' }}>⏳ In progress</span>}
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', transition: 'width 0.3s',
                      width: `${t.progress}%`,
                      background: t.progress === 100
                        ? '#10B981'
                        : `linear-gradient(90deg, var(--color-primary), #8B5CF6)`,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall progress */}
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Progress</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                {Math.round(getMemberTasks(selectedMember).reduce((s, t) => s + t.progress, 0) / (getMemberTasks(selectedMember).length || 1))}%
              </span>
            </div>
          </div>
        </div>
      </div>
    )}

    <style>{`
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  </>);
}
