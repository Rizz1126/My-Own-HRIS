import { useState, useEffect, useRef } from 'react';
import { DoorOpen, DoorClosed, Users, UserCheck, UserX, ChevronRight, Play, Square, Plus, X,
  Clock, ArrowLeftRight, Eye, Check, Trash2, AlertCircle } from 'lucide-react';
import { ROOM_STATUSES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { useModalLock } from '../../utils/useModalLock';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const STATUS_BADGE_STYLE = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '4px 10px', borderRadius: 'var(--radius-full)',
  fontSize: '0.78rem', fontWeight: 600,
  background: `${color}18`, color,
});

export default function Presence() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentRoom, setCurrentRoom] = useState(null); // directorate id
  const [myStatus, setMyStatus] = useState('standby');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [showMemberView, setShowMemberView] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [showOtherRooms, setShowOtherRooms] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const timerRef = useRef(null);
  const workTimerRef = useRef(null);

  const [departments, setDepartments] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useModalLock(!!showMemberView || showSummary);

  const currentEmpId = user?.employeeId || 'EMP-0001';

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const depts = await api.get('/master-data/departments');
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomData = async (deptId) => {
    try {
      const members = await api.get(`/attendance/room/${deptId}`);
      // format members to match UI expectation
      const formatted = members.map((m, i) => {
        const isSelf = m.id === currentEmpId;
        return {
          employeeId: m.id,
          name: m.name,
          position: m.position,
          avatarColor: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
          isInRoom: m.isInRoom,
          isOtherRoom: false, // For now
          status: m.status,
          statusLabel: m.status,
          statusEmoji: m.status === 'Present' ? '💻' : '❌',
          statusColor: m.status === 'Present' ? '#10B981' : '#94A3B8',
          currentTask: null,
          checkIn: m.checkIn ? new Date(m.checkIn).toTimeString().slice(0, 5) : null,
          totalWorkTime: 0,
          activityLog: [],
        };
      });
      setRoomMembers(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      fetchRoomData(currentRoom);
      const interval = setInterval(() => fetchRoomData(currentRoom), 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const currentDir = departments.find(d => d.id === currentRoom);

  const inRoomCount = roomMembers.filter(m => m.isInRoom).length;
  const otherRoomCount = 0;
  const absentCount = roomMembers.filter(m => !m.isInRoom).length;
  const totalMembers = roomMembers.length;

  const isWorkStatus = ROOM_STATUSES.find(s => s.id === myStatus)?.countAsWork || false;

  // Timer: total time
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  // Timer: work time only
  useEffect(() => {
    if (isTimerRunning && isWorkStatus) {
      workTimerRef.current = setInterval(() => setWorkElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(workTimerRef.current);
  }, [isTimerRunning, isWorkStatus]);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const now = () => new Date().toTimeString().slice(0, 5);

  const handleEnterRoom = async (dirId) => {
    setCurrentRoom(dirId);
    setMyStatus('standby');
    setElapsed(0);
    setWorkElapsed(0);
    setTasks([]);
    setActivityLog([{ time: now(), status: 'standby', label: 'Entered Room', emoji: '🚪' }]);
    setIsTimerRunning(false);
    setShowSummary(false);
    setSessionSummary(null);
  };

  const handleStatusChange = (statusId) => {
    const prev = myStatus;
    setMyStatus(statusId);
    const statusInfo = ROOM_STATUSES.find(s => s.id === statusId);
    setActivityLog(log => [...log, {
      time: now(),
      status: statusId,
      label: `Changed to ${statusInfo?.label}`,
      emoji: statusInfo?.emoji,
    }]);

    // Removed auto start: timer only starts with explicit Start button
  };

  const handleStart = async () => {
    try {
      await api.post('/attendance/check-in', { employeeId: currentEmpId });
      if (myStatus === 'standby') {
        setMyStatus('working');
      }
      setIsTimerRunning(true);
      const statusInfo = ROOM_STATUSES.find(s => s.id === (myStatus === 'standby' ? 'working' : myStatus));
      setActivityLog(log => [...log, {
        time: now(),
        status: myStatus === 'standby' ? 'working' : myStatus,
        label: `Started ${statusInfo?.label || 'Working'}`,
        emoji: statusInfo?.emoji || '💻',
      }]);
      fetchRoomData(currentRoom);
      toast.success('Session Started', 'Check-in recorded. Work timer is running!');
    } catch (err) {
      toast.error('Check-in Failed', err.message);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await api.post('/attendance/check-out', { employeeId: currentEmpId });
      setIsTimerRunning(false);
      clearInterval(timerRef.current);
      clearInterval(workTimerRef.current);
      setActivityLog(log => [...log, { time: now(), status: 'leave', label: 'Left Room', emoji: '🚪' }]);

      const completedTasks = tasks.filter(t => t.done).length;
      setSessionSummary({
        totalTime: elapsed,
        workTime: workElapsed,
        nonWorkTime: elapsed - workElapsed,
        tasksTotal: tasks.length,
        tasksCompleted: completedTasks,
        room: currentDir?.name,
      });
      setShowSummary(true);
      fetchRoomData(currentRoom);
      toast.success('Session Ended', 'Check-out recorded. Great work today!');
    } catch (err) {
      toast.error('Check-out Failed', err.message);
    }
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), title: newTask.trim(), done: false }]);
    setNewTask('');
  };

  const toggleTaskDone = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleCloseSession = () => {
    setShowSummary(false);
    setCurrentRoom(null);
    setMyStatus('standby');
    setElapsed(0);
    setWorkElapsed(0);
    setTasks([]);
    setActivityLog([]);
    setSessionSummary(null);
  };

  // ==================== RENDER ====================

  // Phase 1: Room Selection
  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading rooms...</div>;

  if (!currentRoom) {
    return (
      <div className="animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance Room</h1>
            <p className="page-subtitle">Choose your department room to enter</p>
          </div>
        </div>

        <div className="room-selection-grid">
          {departments.map((dir) => {
            const canEnter = true; // For now
            return (
              <div
                key={dir.id}
                className="room-card"
                onClick={() => handleEnterRoom(dir.id)}
              >
                <div className="room-card-icon">
                  <DoorOpen size={28} />
                </div>
                <div className="room-card-body">
                  <h3 className="room-card-title">{dir.name}</h3>
                  <div className="room-card-stats">
                    <span className="room-stat">
                      <Users size={14} /> Department Room
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Phase 2: Inside Room
  const currentStatusInfo = ROOM_STATUSES.find(s => s.id === myStatus);

  return (
    <div className="animate-in">
      {/* Room Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{currentDir?.name}</h1>
          <p className="page-subtitle">You are in the room — {isTimerRunning ? 'Timer running' : 'Timer paused'}</p>
        </div>
        <button className="btn btn-danger" onClick={handleLeaveRoom}>
          <DoorClosed size={16} /> Leave Room
        </button>
      </div>

      {/* Room Stats */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-icon success"><UserCheck size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">In Room</div>
            <div className="kpi-value">{inRoomCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon info"><ArrowLeftRight size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Other Room</div>
            <div className="kpi-value">{otherRoomCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon danger"><UserX size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Absent</div>
            <div className="kpi-value">{absentCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon primary"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total</div>
            <div className="kpi-value">{totalMembers}</div>
          </div>
        </div>
      </div>

      {/* My Control Panel */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Left: Status + Timer */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            {/* Status Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                What will you do now?
              </label>
              <div className="room-status-grid">
                {ROOM_STATUSES.map((s) => (
                  <button
                    key={s.id}
                    className={`room-status-btn ${myStatus === s.id ? 'active' : ''}`}
                    style={{
                      '--status-color': s.color,
                      borderColor: myStatus === s.id ? s.color : 'var(--border-color)',
                      background: myStatus === s.id ? `${s.color}15` : 'var(--bg-tertiary)',
                    }}
                    onClick={() => handleStatusChange(s.id)}
                  >
                    <span className="room-status-emoji">{s.emoji}</span>
                    <span className="room-status-label">{s.label}</span>
                    {s.countAsWork && <span className="room-status-work-badge">Work</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Display */}
            <div className={`room-timer-panel ${isTimerRunning ? 'running' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Time</div>
                  <div className="timer-display" style={{ fontSize: '1.6rem' }}>{formatTimer(elapsed)}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Work Time</div>
                  <div className="timer-display" style={{ fontSize: '1.6rem', color: 'var(--color-success)' }}>{formatTimer(workElapsed)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {!isTimerRunning ? (
                  <button className="btn btn-primary" onClick={handleStart} disabled={tasks.length === 0}>
                    <Play size={16} /> Start Working
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...STATUS_BADGE_STYLE(currentStatusInfo?.color || '#10B981') }}>
                      {currentStatusInfo?.emoji} {currentStatusInfo?.label}
                      {currentStatusInfo?.countAsWork && <span style={{ opacity: 0.7 }}> • Counting</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Tasks */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Today's Tasks
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add a task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              />
              <button className="btn btn-primary" onClick={handleAddTask} disabled={!newTask.trim()}>
                <Plus size={16} />
              </button>
            </div>
            <div className="room-task-list">
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <AlertCircle size={20} style={{ marginBottom: '6px', opacity: 0.5 }} />
                  <p>Add tasks before starting work</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`room-task-item ${task.done ? 'done' : ''}`}>
                    <button className="room-task-check" onClick={() => toggleTaskDone(task.id)}>
                      {task.done ? <Check size={14} /> : null}
                    </button>
                    <span className="room-task-title">{task.title}</span>
                    <button className="btn btn-icon btn-sm" style={{ color: 'var(--text-muted)' }} onClick={() => removeTask(task.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Grid */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Room Members</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search members..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              style={{ width: '200px', fontSize: '0.85rem' }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberView({ isSelf: true, name: user?.name || 'You', activityLog })}>
              <Eye size={14} /> My Log
            </button>
          </div>
        </div>
        <div className="room-member-grid">
          {/* Self Card */}
          <div className="room-member-card self">
            <div className="room-member-avatar" style={{ background: '#6366F1' }}>
              {getInitials(user?.name || 'You')}
            </div>
            <div className="room-member-name">{user?.name || 'You'} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(You)</span></div>
            <div style={STATUS_BADGE_STYLE(currentStatusInfo?.color || '#F59E0B')}>
              {currentStatusInfo?.emoji} {currentStatusInfo?.label}
            </div>
            {tasks.filter(t => !t.done).length > 0 && (
              <div className="room-member-task">{tasks.find(t => !t.done)?.title}</div>
            )}
          </div>

          {/* Other Members */}
          {roomMembers
            .filter(member => member.name.toLowerCase().includes(memberSearch.toLowerCase()))
            .map((member) => (
            <div
              key={member.employeeId}
              className={`room-member-card ${!member.isInRoom && !member.isOtherRoom ? 'absent' : ''}`}
              onClick={() => setShowMemberView(member)}
              style={{ cursor: 'pointer' }}
            >
              <div className="room-member-avatar" style={{ background: member.avatarColor }}>
                {getInitials(member.name)}
              </div>
              <div className="room-member-name">{member.name}</div>
              <div style={STATUS_BADGE_STYLE(member.statusColor)}>
                {member.statusEmoji} {member.statusLabel}
              </div>
              {member.currentTask && (
                <div className="room-member-task">{member.currentTask}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Member Detail Modal */}
      {showMemberView && (
        <div className="modal-overlay" onClick={() => setShowMemberView(null)}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span style={{ marginRight: '8px' }}>{showMemberView.isSelf ? currentStatusInfo?.emoji : showMemberView.statusEmoji}</span>
                {showMemberView.name}
              </h3>
              <button className="modal-close" onClick={() => setShowMemberView(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {showMemberView.isSelf ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Status', value: currentStatusInfo?.label },
                      { label: 'Total Time', value: formatTimer(elapsed) },
                      { label: 'Work Time', value: formatTimer(workElapsed) },
                      { label: 'Tasks Completed', value: tasks.filter(t => t.done).length },
                      { label: 'Current Task', value: tasks.find(t => !t.done)?.title || '—' },
                      { label: 'Room', value: currentDir?.name },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {activityLog.length > 0 && (
                    <>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Today's Activity Log</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activityLog.map((log, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                          }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.time}</span>
                            <span>{log.emoji || '📌'}</span>
                            <span style={{ fontSize: '0.88rem' }}>{log.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Status', value: showMemberView.statusLabel },
                      { label: 'Position', value: showMemberView.position },
                      { label: 'Check In', value: showMemberView.checkIn || '—' },
                      { label: 'Work Time', value: showMemberView.totalWorkTime ? `${showMemberView.totalWorkTime}h` : '—' },
                      { label: 'Current Task', value: showMemberView.currentTask || '—' },
                      { label: 'Room', value: showMemberView.isOtherRoom ? showMemberView.otherRoomName : (showMemberView.isInRoom ? currentDir?.name : 'Not in room') },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {showMemberView.activityLog.length > 0 && (
                    <>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Activity Log</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {showMemberView.activityLog.map((log, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                          }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.time}</span>
                            <span>{log.emoji || '📌'}</span>
                            <span style={{ fontSize: '0.88rem' }}>{log.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMemberView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSummary && sessionSummary && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Session Summary</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '4px' }}>🏁</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Work Session Completed</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>{sessionSummary.room}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Time</div>
                  <div className="timer-display" style={{ fontSize: '1.2rem' }}>{formatTimer(sessionSummary.totalTime)}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Work Time</div>
                  <div className="timer-display" style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>{formatTimer(sessionSummary.workTime)}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Non-work Time</div>
                  <div className="timer-display" style={{ fontSize: '1.2rem', color: 'var(--color-warning)' }}>{formatTimer(sessionSummary.nonWorkTime)}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tasks</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{sessionSummary.tasksCompleted}/{sessionSummary.tasksTotal}</div>
                </div>
              </div>

              {/* Activity log */}
              {activityLog.length > 0 && (
                <div style={{ textAlign: 'left', maxHeight: '150px', overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>Activity Timeline</h4>
                  {activityLog.map((log, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 0', fontSize: '0.82rem',
                      borderBottom: i < activityLog.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '40px' }}>{log.time}</span>
                      <span>{log.emoji}</span>
                      <span>{log.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleCloseSession} style={{ width: '100%' }}>
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
