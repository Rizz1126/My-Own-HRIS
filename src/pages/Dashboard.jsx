import { useState, useEffect } from 'react';
import { Building2, CalendarCheck, Shield, Users, TrendingUp, TrendingDown, ClipboardList, X, ChevronRight } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { api } from '../utils/api';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters';
import { useEmployees } from '../context/EmployeeContext';

const chartTooltipStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px',
};

const CostRevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={chartTooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: '6px', padding: '8px 12px 0' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, padding: '2px 12px', fontSize: '0.85rem' }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
      {payload.length === 2 && (
        <p style={{ padding: '4px 12px 8px', fontSize: '0.82rem', color: payload[1].value > payload[0].value ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
          Margin: {formatCurrency(payload[1].value - payload[0].value)}
        </p>
      )}
    </div>
  );
};

function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon && <Icon size={18} />} {title}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popup, setPopup] = useState(null); // 'contract' | 'portfolio'
  const [selectedContractCategory, setSelectedContractCategory] = useState('expiring30');
  const [empStatusFilter, setEmpStatusFilter] = useState('Active'); // 'Active' | 'Inactive' | 'All'
  const { employees } = useEmployees();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/analytics/dashboard-stats');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const {
    activeEmployees,
    presentCount,
    expiringSoonCount,
    activeProjectCount,
    activeClientCount,
    headcountTrend,
    departmentStats,
    costRevenueData,
    contractSummary,
    allocationData,
    contracts,
    projects
  } = data;

  const nonPermanentContracts = (contracts || []).filter(c => c.endDate);
  
  const contractStats = { expiring30: 0, expiring60: 0, expiringMore: 0, expired: 0 };
  const now = Date.now();
  
  nonPermanentContracts.forEach(c => {
    const end = new Date(c.endDate).getTime();
    const diffDays = (end - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      contractStats.expired++;
    } else if (diffDays <= 30) {
      contractStats.expiring30++;
    } else if (diffDays <= 60) {
      contractStats.expiring60++;
    } else {
      contractStats.expiringMore++;
    }
  });

  const activeContractsCount = contractStats.expiring30 + contractStats.expiring60 + contractStats.expiringMore;

  const contractCategories = [
    { key: 'expiring30', label: '<30 Days', count: contractStats.expiring30, color: 'var(--color-danger)' },
    { key: 'expiring60', label: '31-60 Days', count: contractStats.expiring60, color: 'var(--color-warning)' },
    { key: 'expiringMore', label: '>60 Days', count: contractStats.expiringMore, color: 'var(--color-success)' },
    { key: 'expired', label: 'Expired', count: contractStats.expired, color: 'var(--text-muted)' },
  ];

  const selectedContracts = nonPermanentContracts.filter(contract => {
    const end = new Date(contract.endDate).getTime();
    const diffDays = (end - now) / (1000 * 60 * 60 * 24);
    if (selectedContractCategory === 'expiring30') return diffDays >= 0 && diffDays <= 30;
    if (selectedContractCategory === 'expiring60') return diffDays > 30 && diffDays <= 60;
    if (selectedContractCategory === 'expiringMore') return diffDays > 60;
    if (selectedContractCategory === 'expired') return diffDays < 0;
    return false;
  });

  // Calculate dynamic department stats based on employee context and filter
  const dynamicDeptStats = (() => {
    const map = {};
    (employees || []).forEach(e => {
      if (empStatusFilter === 'Active' && e.status === 'Inactive') return;
      if (empStatusFilter === 'Inactive' && e.status !== 'Inactive') return;
      
      const deptName = typeof e.department === 'string' ? e.department : e.department?.name || 'Unknown';
      if (!map[deptName]) map[deptName] = 0;
      map[deptName]++;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count);
  })();

  const topProjects = [...(projects || [])].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 6);

  const compactCardStyle = {
    cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
  };


  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Admin analytics and contract monitoring for workforce and project health.</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Employees</div>
            <div className="kpi-value">{formatNumber(activeEmployees)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Stable workforce</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><Shield size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Contracts</div>
            <div className="kpi-value">{formatNumber(activeContractsCount)}</div>
            <div className="kpi-trend"><span style={{ color: 'var(--color-danger)' }}>{contractStats.expiring30}</span> expiring soon</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon info"><Building2 size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Projects</div>
            <div className="kpi-value">{formatNumber(activeProjectCount)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> {formatNumber(activeClientCount)} clients</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Headcount Trend</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={headcountTrend}>
              <defs>
                <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fill="url(#headcountGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Employees by Department</h3>
            <select 
              value={empStatusFilter} 
              onChange={e => setEmpStatusFilter(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="All">All Employees</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dynamicDeptStats} layout="vertical" margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={100} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" name="Employees" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Cost vs Revenue & Pie Chart */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
        {/* Cost vs Revenue */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Employee Cost vs Revenue</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly trend</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={costRevenueData}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `${v / 1000000000}B`} />
              <Tooltip content={<CostRevenueTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem' }} />
              <Area type="monotone" dataKey="cost" fill="url(#costGrad)" stroke="none" />
              <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="none" />
              <Line type="monotone" dataKey="cost" name="Cost" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3, fill: '#F43F5E' }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Department Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={departmentStats} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="count" nameKey="name">
                {departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem', paddingTop: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 3 Compact Cards */}
      <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(3, minmax(280px, 1fr))', gap: '20px' }}>

        {/* Contract — Compact + Popup */}
        <div
          className="card"
          style={compactCardStyle}
          onClick={() => setPopup('contract')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="card-header">
            <h3 className="card-title"><Shield size={18} style={{ marginRight: '8px' }} /> Contract Monitoring</h3>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '4px' }}>
              {contractCategories.map(cat => (
                <div key={cat.key} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cat.color }}>{formatNumber(cat.count)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{cat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Click to view contract details</span>
            </div>
          </div>
        </div>

        {/* Portfolio — Compact + Popup */}
        <div
          className="card"
          style={compactCardStyle}
          onClick={() => setPopup('portfolio')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="card-header">
            <h3 className="card-title"><Building2 size={18} style={{ marginRight: '8px' }} /> Portfolio Snapshot</h3>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatNumber(activeClientCount)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Active Clients</div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px 8px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatNumber(activeProjectCount)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Active Projects</div>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to view top performing projects</div>
          </div>
        </div>

        {/* Time Allocation — Horizontal Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ClipboardList size={18} style={{ marginRight: '8px' }} /> Time Allocation</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active project & department allocation (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allocationData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <YAxis type="category" dataKey="project" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={v => [`${v}%`, 'Allocation']}
                />
                <Bar dataKey="allocation" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contract Popup Modal */}
      {popup === 'contract' && (
        <Modal title="Contract Monitoring" icon={Shield} onClose={() => setPopup(null)}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {contractCategories.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedContractCategory(cat.key)}
                style={{
                  borderRadius: '999px', border: selectedContractCategory === cat.key ? `1px solid ${cat.color}` : '1px solid var(--border-color)',
                  background: selectedContractCategory === cat.key ? 'var(--bg-secondary)' : 'transparent',
                  color: selectedContractCategory === cat.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '10px 18px', cursor: 'pointer', minWidth: '120px', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{cat.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: cat.color }}>{formatNumber(cat.count)}</div>
              </button>
            ))}
          </div>
          {selectedContracts.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {selectedContracts.map(contract => (
                <div key={contract.id} className="announcement-item" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <h4 className="announcement-title" style={{ marginBottom: '4px' }}>{contract.name}</h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {contract.employeeId || contract.name} • {contract.endDate ? formatDate(contract.endDate) : 'Permanent'}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: selectedContractCategory === 'expired' ? 'var(--color-danger-bg)' : selectedContractCategory.includes('expiring') ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                      color: selectedContractCategory === 'expired' ? 'var(--color-danger)' : selectedContractCategory.includes('expiring') ? 'var(--color-warning)' : 'var(--color-success)',
                    }}>
                      {selectedContractCategory === 'expired' ? 'Expired' : 'Expiring'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No contracts in this category.</div>
          )}
        </Modal>
      )}

      {/* Portfolio Popup Modal */}
      {popup === 'portfolio' && (
        <Modal title="Portfolio Snapshot" icon={Building2} onClose={() => setPopup(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatNumber(activeClientCount)}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Active Clients</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '14px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatNumber(activeProjectCount)}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Active Projects</div>
            </div>
          </div>
          <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Top Performing Projects</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {topProjects.map(project => (
              <div key={project.projectCode} className="announcement-item" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 className="announcement-title" style={{ marginBottom: '4px' }}>{project.projectName}</h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{project.client}</div>
                    <div style={{ marginTop: '8px', height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${project.progress}%`, background: project.progress >= 80 ? 'var(--color-success)' : project.progress >= 50 ? 'var(--color-primary)' : 'var(--color-warning)', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <span className="badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', flexShrink: 0 }}>{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
