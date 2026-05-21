import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('hris-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hris-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          collapsed={collapsed}
          theme={theme}
          onToggleTheme={toggleTheme}
          onMobileOpen={() => setMobileOpen(true)}
        />
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <footer style={{
            textAlign: 'center',
            padding: '24px 0 8px 0',
            marginTop: 'auto',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 500,
            opacity: 0.7
          }}>
            © 2026 Topan Rizaldi. All Rights Reserved — Version 1.1.0
          </footer>
        </main>
      </div>
    </div>
  );
}
