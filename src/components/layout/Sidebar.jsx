import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccess, user } = useAuth();
  const toast = useToast();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) onMobileClose();
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (children) => children?.some((c) => location.pathname === c.path);

  // Filter nav items based on user role and granular submenu access
  const filteredItems = NAV_ITEMS.map((item) => {
    // 1. Check parent level access
    if (!hasAccess(item.id)) return null;

    // 2. Check strict functional overrides
    if (item.requiredRole && user?.role !== item.requiredRole && user?.role !== 'Super Admin') {
      return null;
    }

    // 3. Drill down into submenu checks
    let allowedChildren = item.children;
    if (item.children) {
      allowedChildren = item.children.filter(child => hasAccess(child.id));
      
      // If parent has NO path of its own, and ALL children are restricted, hide the parent entirely.
      if (allowedChildren.length === 0 && !item.path) {
        return null;
      }
    }

    return { ...item, children: allowedChildren };
  }).filter(Boolean);

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={onMobileClose} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">H</div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">Humanova</span>
            <span className="sidebar-brand-sub">Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item) => (
            <div className="nav-item" key={item.id}>
              <div
                className={`nav-link ${
                  item.path
                    ? isActive(item.path) ? 'active' : ''
                    : isParentActive(item.children) ? 'active' : ''
                }`}
                onClick={() => {
                  if (item.path) {
                    handleNavigate(item.path);
                  } else {
                    toggleMenu(item.id);
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-link-icon">
                  <item.icon size={20} />
                </span>
                <span className="nav-link-text">{item.label}</span>
                {item.children && (
                  <span className={`nav-link-chevron ${openMenus[item.id] || isParentActive(item.children) ? 'open' : ''}`}>
                    <ChevronRight size={16} />
                  </span>
                )}
              </div>

              {item.children && (
                <div className={`nav-submenu ${openMenus[item.id] || isParentActive(item.children) ? 'open' : ''}`}>
                  {item.children.map((child) => (
                    <div
                      key={child.id}
                      className={`nav-submenu-link ${isActive(child.path) ? 'active' : ''}`}
                      onClick={() => handleNavigate(child.path)}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
}
