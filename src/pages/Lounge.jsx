import { useMemo, useState, useEffect } from 'react';
import { Megaphone, Bell, Plus, Edit3, Trash2, X, LogIn, Clock, Shield, ChevronRight, Sparkles, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AttendanceRoomModal from '../components/attendance/AttendanceRoomModal';

const PRIORITY_STYLES = {
  High: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', dot: '#EF4444' },
  Normal: { bg: 'rgba(99,102,241,0.12)', color: '#6366F1', dot: '#6366F1' },
  Low: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', dot: '#10B981' },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function Lounge() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'Normal' });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [workSession, setWorkSession] = useState(null);

  useEffect(() => {
    if (!showRoomModal) {
      const saved = sessionStorage.getItem('hris-attendance-session');
      if (saved) {
        try {
          setWorkSession(JSON.parse(saved));
        } catch (err) {}
      }
    }
  }, [showRoomModal]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/ess/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const summaryCounts = useMemo(() => ({
    total: announcements.length,
    high: announcements.filter(a => a.priority === 'High').length,
    normal: announcements.filter(a => a.priority === 'Normal').length,
    low: announcements.filter(a => a.priority === 'Low').length,
  }), [announcements]);

  const chartData = useMemo(() => [
    { name: 'High', count: summaryCounts.high, fill: '#EF4444' },
    { name: 'Normal', count: summaryCounts.normal, fill: '#6366F1' },
    { name: 'Low', count: summaryCounts.low, fill: '#10B981' },
  ], [summaryCounts]);

  const openForm = (announcement = null) => {
    setEditingAnnouncement(announcement);
    setFormData({ title: announcement?.title || '', content: announcement?.content || '', priority: announcement?.priority || 'Normal' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingAnnouncement(null); };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    try {
      if (editingAnnouncement) {
        await api.patch(`/ess/announcements/${editingAnnouncement.id}`, formData);
      } else {
        await api.post('/ess/announcements', { ...formData, createdBy: user?.employeeId });
      }
      fetchAnnouncements();
      closeForm();
      toast.success(
        editingAnnouncement ? 'Announcement Updated' : 'Announcement Published',
        editingAnnouncement ? 'Changes have been saved successfully.' : 'New announcement is now live.'
      );
    } catch (err) {
      toast.error('Save Failed', 'Failed to save announcement.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ess/announcements/${id}`);
      fetchAnnouncements();
      setDeleteConfirm(null);
      toast.success('Announcement Deleted', 'The announcement has been removed.');
    } catch (err) {
      toast.error('Delete Failed', 'Failed to delete announcement.');
    }
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Selamat pagi' : today.getHours() < 17 ? 'Selamat siang' : 'Selamat sore';

  return (
    <div className="animate-in">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div style={{
        borderRadius: '24px', marginBottom: '28px', padding: '32px',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
              <Sparkles size={14} />
              <span>{greeting}!</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {user?.name || 'Colleague'} 👋
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
              {user?.position || user?.role || 'Employee'} • {user?.department || 'HR Department'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px 16px' }}>
              <Clock size={16} />
              <LiveClock />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '8px 14px', fontSize: '0.82rem' }}>
              <Calendar size={14} />
              {today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Work Status Widget */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div
            onClick={() => setShowRoomModal(true)}
            style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              borderRadius: '14px', padding: '14px 20px', minWidth: '200px',
              cursor: 'pointer', transition: 'all 0.2s', flex: 1,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: workSession?.workState === 'active' ? '#34D399' : 'rgba(255,255,255,0.5)', display: 'inline-block', flexShrink: 0 }} />
              Status Kerja
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {workSession?.startTime ? (
                <>
                  <span style={{ fontSize: '0.95rem' }}>
                    {workSession.startTime} - {workSession.workState === 'active' ? 'Sedang berjalan' : workSession.stopTime || 'Selesai'}
                    {workSession.stopTime && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '6px' }}>
                        ({(() => {
                          try {
                            const [sH, sM] = workSession.startTime.split(':');
                            const [eH, eM] = workSession.stopTime.split(':');
                            const startMins = parseInt(sH) * 60 + parseInt(sM);
                            const endMins = parseInt(eH) * 60 + parseInt(eM);
                            let diff = endMins - startMins;
                            if (diff < 0) diff += 24 * 60;
                            const hrs = Math.floor(diff / 60);
                            const mins = diff % 60;
                            return `${hrs > 0 ? hrs + 'hr ' : ''}${mins > 0 ? mins + 'm' : ''}`.trim() || '0m';
                          } catch { return ''; }
                        })()})
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span style={{ opacity: 0.75 }}>Belum Check-in</span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>Klik untuk masuk Attendance Room</div>
          </div>


        </div>
      </div>

      {/* ── Enter Room CTA ─────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <button
          id="enter-room-btn"
          onClick={() => setShowRoomModal(true)}
          style={{
            width: '100%', padding: '24px 32px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.28)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)'; }}
        >
          {/* Decorative glow */}
          <div style={{ position: 'absolute', left: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 80, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <LogIn size={26} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' }}>Enter Attendance Room</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '2px' }}>
                Check in • Set status kerja • Manage tasks harian
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', color: '#34D399' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite' }} />
              Rooms Open
            </div>
            <ChevronRight size={20} style={{ opacity: 0.5 }} />
          </div>
        </button>
      </div>

      {/* ── Announcements + Insights ───────────────────────── */}
      <div className="grid-dashboard" style={{ gridTemplateColumns: '1.7fr 1fr', gap: '24px' }}>

        {/* Announcements Card */}
        <div className="card" style={{ borderRadius: '20px' }}>
          <div className="card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={18} color="white" />
              </div>
              <div>
                <div className="card-title" style={{ margin: 0 }}>Announcements</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summaryCounts.total} active</div>
              </div>
            </div>
            {isAdmin() && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openForm()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> New
              </button>
            )}
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
            {announcements.slice(0, 5).map(a => (
              <div
                key={a.id}
                style={{
                  padding: '16px', borderRadius: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = PRIORITY_STYLES[a.priority].dot}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_STYLES[a.priority].dot, flexShrink: 0 }} />
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</h4>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: PRIORITY_STYLES[a.priority].bg, color: PRIORITY_STYLES[a.priority].color, fontWeight: 600, flexShrink: 0 }}>
                        {a.priority}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.content}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {a.creatorName || 'HR'} • {formatDate(a.createdAt)}
                    </div>
                  </div>
                  {isAdmin() && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button className="btn btn-icon btn-sm btn-secondary" onClick={() => openForm(a)} title="Edit">
                        <Edit3 size={13} />
                      </button>
                      <button className="btn btn-icon btn-sm btn-danger" onClick={() => setDeleteConfirm(a.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p>No announcements available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights + Role Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Access Badge */}
          <div style={{ borderRadius: '20px', padding: '20px', background: isAdmin() ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' : 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Shield size={18} style={{ color: isAdmin() ? '#6366F1' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Your Access Level</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: isAdmin() ? '#6366F1' : 'var(--text-primary)' }}>{user?.role || 'Employee'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isAdmin() ? '✅ Can manage announcements & rooms' : '👁 Read-only announcements access'}
            </div>
          </div>

          {/* Insights Chart */}
          <div className="card" style={{ borderRadius: '20px', flex: 1 }}>
            <div className="card-header" style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={16} />
                <span className="card-title">Announcement Insights</span>
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
              {[
                { label: 'High Priority', value: summaryCounts.high, color: '#EF4444' },
                { label: 'Normal', value: summaryCounts.normal, color: '#6366F1' },
                { label: 'Low Priority', value: summaryCounts.low, color: '#10B981' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ height: '140px', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                  <Tooltip wrapperStyle={{ borderRadius: '10px', border: '1px solid var(--border-color)' }} contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '10px', fontSize: '0.82rem' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcement Form Modal ─────────────────────────── */}
      {showForm && isAdmin() && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button className="modal-close" onClick={closeForm}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input form-textarea" value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} rows={5} placeholder="Write details..." />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()}>
                {editingAnnouncement ? 'Save Changes' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────── */}
      {deleteConfirm && isAdmin() && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Announcement</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={26} />
              </div>
              <p style={{ fontWeight: 600 }}>Confirm deletion?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>This announcement will be permanently removed.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Room Modal ───────────────────────────── */}
      {showRoomModal && <AttendanceRoomModal onClose={() => setShowRoomModal(false)} onStatusChange={setWorkSession} />}
    </div>
  );
}
