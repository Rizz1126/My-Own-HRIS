import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import NotificationPanel from './NotificationPanel';

const STORAGE_KEY = 'hris-notifications-read';
function getReadIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export default function TopBar({ collapsed, theme, onToggleTheme, onMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Compute unread badge count - poll every 30s for near-realtime
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const readIds = getReadIds();
        let count = 0;
        const announcements = await api.get('/ess/announcements');
        count += announcements.filter(a => !readIds.includes(`ann-${a.id}`)).length;

        if (isAdmin()) {
          try {
            const leaves = await api.get('/attendance/leaves');
            count += leaves.filter(l => l.status === 'Pending' && !readIds.includes(`leave-${l.id}`)).length;
          } catch {}
          try {
            const otReqs = await api.get('/overtime/requests');
            count += otReqs.filter(o => (o.status === 'Pending HR' || o.status === 'Pending') && !readIds.includes(`ot-${o.id}`)).length;
          } catch {}
        }
        setNotifCount(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [showNotifications]); // Re-count when panel closes

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Lounge' }];
    const segments = path.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: seg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      isLast: i === segments.length - 1,
    }));
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate('/login');
  };

  const breadcrumb = getBreadcrumb();
  const displayName = user?.name || 'User';
  const roleColor = user?.role === 'Super Admin' ? '#8B5CF6' : user?.role === 'Admin' ? '#6366F1' : '#10B981';
  const initials = getInitials(displayName);

  return (
    <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button className="topbar-icon-btn" onClick={onMobileOpen} style={{ display: 'none' }} id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <style>{`@media (max-width: 1024px) { #mobile-menu-btn { display: flex !important; } }`}</style>

        <div className="topbar-breadcrumb">
          {breadcrumb.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <span className="topbar-breadcrumb-separator">/</span>}
              <span className={item.isLast || breadcrumb.length === 1 ? 'topbar-breadcrumb-current' : ''}>
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar-search">
        <Search size={16} className="topbar-search-icon" />
        <input type="text" className="topbar-search-input" placeholder="Search employees, reports..." id="global-search" />
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={onToggleTheme} title="Toggle theme" id="theme-toggle">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            id="notifications-btn"
            onClick={() => setShowNotifications(v => !v)}
            style={{ position: 'relative' }}
            title="Notifications"
          >
            <Bell size={20} />
            {notifCount > 0 && (
              <span
                className="topbar-badge"
                style={{
                  background: '#EF4444',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="topbar-divider" />

        {/* User Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="topbar-user"
            id="user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ gap: '10px', cursor: 'pointer' }}
          >
            {/* Avatar */}
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.8rem',
                boxShadow: `0 0 0 2px ${roleColor}33`,
              }}>
                {initials}
              </div>
            )}

            <div className="topbar-user-info" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '0.72rem', color: roleColor, fontWeight: 600 }}>
                {user?.role || 'Employee'}
              </span>
            </div>
          </div>

          {showDropdown && (
            <div className="user-dropdown">
              {/* Header with avatar + info */}
              <div className="user-dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1rem',
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || user?.employeeId || ''}</div>
                  <div style={{ marginTop: '3px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: `${roleColor}18`, color: roleColor, fontWeight: 600 }}>
                      {user?.role || 'Employee'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/ess/my-profile'); }}>
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button className="user-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/ess/my-profile'); }}>
                <Settings size={16} />
                <span>Edit Profile</span>
              </button>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
