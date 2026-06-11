import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Megaphone, CheckSquare, Clock, X, Check, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

const STORAGE_KEY = 'hris-notifications-read';

function getReadIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function markRead(ids) {
  const existing = getReadIds();
  const merged = [...new Set([...existing, ...ids])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => getReadIds());
  const [activeTab, setActiveTab] = useState('all');

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const notifs = [];

      try {
        // 1. Announcements
        const announcements = await api.get('/ess/announcements');
        announcements.forEach(a => {
          notifs.push({
            id: `ann-${a.id}`,
            type: 'announcement',
            category: 'Announcement',
            icon: Megaphone,
            color: a.priority === 'High' ? '#EF4444' : a.priority === 'Low' ? '#10B981' : '#F59E0B',
            title: a.title,
            body: a.content?.slice(0, 80) + (a.content?.length > 80 ? '…' : ''),
            time: a.createdAt,
            badge: a.priority,
            badgeColor: a.priority === 'High' ? '#EF4444' : a.priority === 'Low' ? '#10B981' : '#6366F1',
            action: () => navigate(`/?announcement=${a.id}`),
          });
        });
      } catch {}

      try {
        // 2. Pending leave approvals (for admin)
        if (isAdmin()) {
          const leaves = await api.get('/attendance/leaves');
          const pending = leaves.filter(l => l.status === 'Pending');
          pending.forEach(l => {
            notifs.push({
              id: `leave-${l.id}`,
              type: 'approval',
              category: 'Leave Approval',
              icon: CheckSquare,
              color: '#8B5CF6',
              title: `Leave Request — ${l.employeeName || l.employee?.name || 'Employee'}`,
              body: `${l.leaveType} • ${formatDate(l.startDate)} – ${formatDate(l.endDate)}`,
              time: l.createdAt,
              badge: 'Pending',
              badgeColor: '#F59E0B',
              action: () => navigate('/attendance/leave-approval'),
            });
          });
        }
      } catch {}

      try {
        // 3. Pending overtime requests (for admin)
        if (isAdmin()) {
          const otReqs = await api.get('/overtime/requests');
          const pendingOT = otReqs.filter(o => o.status === 'Pending HR' || o.status === 'Pending');
          pendingOT.slice(0, 5).forEach(o => {
            notifs.push({
              id: `ot-${o.id}`,
              type: 'approval',
              category: 'Overtime Approval',
              icon: Clock,
              color: '#6366F1',
              title: `Overtime Request — ${o.employee?.name || 'Employee'}`,
              body: `${o.purpose || 'Overtime request'} • ${o.plannedHours || '–'} hrs`,
              time: o.createdAt,
              badge: 'Pending HR',
              badgeColor: '#F59E0B',
              action: () => navigate('/attendance/overtime'),
            });
          });
        }
      } catch {}

      try {
        // 4. System Notifications (e.g. Profile updates)
        if (isAdmin()) {
          const sysNotifs = await api.get('/ess/notifications');
          sysNotifs.forEach(n => {
            notifs.push({
              id: `sys-${n.id}`,
              type: 'system',
              category: 'System Alert',
              icon: Info,
              color: '#3B82F6',
              title: n.title,
              body: n.message,
              time: n.createdAt,
              badge: 'System',
              badgeColor: '#3B82F6',
              action: () => navigate('/master-data/employees'),
            });
          });
        }
      } catch {}

      // Sort: newest first
      notifs.sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return tb - ta;
      });

      setNotifications(notifs);
      setIsLoading(false);
    };
    fetchAll();
    // Poll every 30 seconds for near-realtime updates
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const filtered = activeTab === 'all'
    ? notifications
    : activeTab === 'announcements'
      ? notifications.filter(n => n.type === 'announcement')
      : activeTab === 'system' 
        ? notifications.filter(n => n.type === 'system')
        : notifications.filter(n => n.type === 'approval');

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    markRead(allIds);
    setReadIds(allIds);
  };

  const handleNotifClick = (notif) => {
    markRead([notif.id]);
    setReadIds(prev => [...new Set([...prev, notif.id])]);
    notif.action?.();
    onClose();
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '12px',
        width: '400px',
        maxWidth: '95vw',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideDown 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</div>
              {unreadCount > 0 && (
                <div style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 600 }}>
                  {unreadCount} unread
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '5px 10px',
                  borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <Check size={11} /> Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px', borderRadius: '8px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'announcements', label: 'Announcements', count: notifications.filter(n => n.type === 'announcement').length },
            { key: 'approvals', label: 'Approvals', count: notifications.filter(n => n.type === 'approval').length },
            ...(isAdmin() ? [{ key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
                background: activeTab === tab.key ? '#6366F1' : 'var(--bg-secondary)',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: '1px 6px', borderRadius: '10px',
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                  fontSize: '0.68rem',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.85rem' }}>Loading notifications...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>No notifications</div>
            <div style={{ fontSize: '0.8rem' }}>You're all caught up!</div>
          </div>
        ) : (
          <div>
            {filtered.map((notif, i) => {
              const isUnread = !readIds.includes(notif.id);
              const IconComp = notif.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color-light, var(--border-color))' : 'none',
                    cursor: 'pointer',
                    background: isUnread ? `${notif.color}08` : 'transparent',
                    transition: 'background 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${notif.color}12`}
                  onMouseLeave={e => e.currentTarget.style.background = isUnread ? `${notif.color}08` : 'transparent'}
                >
                  {/* Unread indicator */}
                  {isUnread && (
                    <div style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 6, height: 6, borderRadius: '50%', background: notif.color,
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                    background: `${notif.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconComp size={16} color={notif.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.title}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
                        background: `${notif.badgeColor}18`, color: notif.badgeColor, fontWeight: 600,
                      }}>
                        {notif.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.body}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {notif.category} • {notif.time ? formatDate(notif.time) : 'Just now'}
                      </span>
                      <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
        }}>
          <button
            onClick={() => { navigate('/'); onClose(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6366F1', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            View all announcements →
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
