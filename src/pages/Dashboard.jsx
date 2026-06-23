import { useState, useEffect, useMemo } from 'react';
import { Building2, CalendarCheck, Shield, Users, TrendingUp, TrendingDown, ClipboardList, X, ChevronRight, Target, CheckCircle, AlertTriangle, Activity, Eye } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { api } from '../utils/api';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters';
import { useEmployees } from '../context/EmployeeContext';
import { getInitials } from '../utils/formatters';

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

const OKR_LEVEL_CONFIG = {
  company: { label: 'Company', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  department: { label: 'Department', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  individual: { label: 'Individual', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

const OKR_CONFIDENCE_COLORS = {
  'On Track': '#10B981',
  'At Risk': '#F59E0B',
  'Off Track': '#EF4444',
};

const currentYear = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
const currentPeriod = `Q${currentQuarter} ${currentYear}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [popup, setPopup] = useState(null); // 'contract' | 'portfolio' | 'okr-top'
  const [selectedContractCategory, setSelectedContractCategory] = useState('expiring30');
  const [empStatusFilter, setEmpStatusFilter] = useState('Active'); // 'Active' | 'Inactive' | 'All'
  const { employees } = useEmployees();

  // OKR state
  const [okrObjectives, setOkrObjectives] = useState([]);
  const [okrTree, setOkrTree] = useState(null);
  const [okrLoading, setOkrLoading] = useState(true);

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

  // Fetch OKR data
  useEffect(() => {
    const fetchOKR = async () => {
      try {
        setOkrLoading(true);
        const [objs, tree] = await Promise.all([
          api.get(`/talent/okr?period=${encodeURIComponent(currentPeriod)}`),
          api.get(`/talent/okr/tree?period=${encodeURIComponent(currentPeriod)}`),
        ]);
        setOkrObjectives(objs || []);
        setOkrTree(tree || null);
      } catch (err) {
        console.error('OKR fetch error:', err);
      } finally {
        setOkrLoading(false);
      }
    };
    fetchOKR();
  }, []);

  // OKR computed stats
  const okrSummary = useMemo(() => {
    const total = okrObjectives.length;
    const avgProgress = total > 0 ? okrObjectives.reduce((s, o) => s + parseFloat(o.progress || 0), 0) / total : 0;
    const onTrack = okrObjectives.filter(o => parseFloat(o.progress || 0) >= 0.4).length;
    const atRisk = total - onTrack;
    const completed = okrObjectives.filter(o => o.status === 'Completed').length;

    // By level
    const byLevel = Object.entries(OKR_LEVEL_CONFIG).map(([key, cfg]) => {
      const levelObjs = okrObjectives.filter(o => o.level === key);
      const count = levelObjs.length;
      const avg = count > 0 ? levelObjs.reduce((s, o) => s + parseFloat(o.progress || 0), 0) / count : 0;
      return { name: cfg.label, progress: Math.round(avg * 100), count, color: cfg.color };
    });

    // Top objectives (sorted by progress desc)
    const topObjectives = [...okrObjectives].sort((a, b) => parseFloat(b.progress || 0) - parseFloat(a.progress || 0)).slice(0, 6);

    return { total, avgProgress, onTrack, atRisk, completed, byLevel, topObjectives };
  }, [okrObjectives]);

  // Confidence distribution from tree data (all KRs)
  const confidenceData = useMemo(() => {
    const counts = { 'On Track': 0, 'At Risk': 0, 'Off Track': 0 };
    const collectKRs = (objs) => {
      (objs || []).forEach(obj => {
        (obj.keyResults || []).forEach(kr => {
          const conf = kr.confidence || 'On Track';
          if (counts[conf] !== undefined) counts[conf]++;
        });
        if (obj.children) collectKRs(obj.children);
      });
    };
    if (okrTree) {
      collectKRs(okrTree.company || []);
      // Also catch department/individual not in tree
      collectKRs(okrTree.department || []);
      collectKRs(okrTree.individual || []);
    }
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: OKR_CONFIDENCE_COLORS[name],
    })).filter(d => d.value > 0);
  }, [okrTree]);

  // Recent check-ins from tree KRs
  const recentCheckIns = useMemo(() => {
    const allCheckIns = [];
    const collectCheckIns = (objs) => {
      (objs || []).forEach(obj => {
        (obj.keyResults || []).forEach(kr => {
          (kr.checkIns || []).forEach(ci => {
            allCheckIns.push({
              ...ci,
              metricName: kr.metricName,
              unit: kr.unit,
              objectiveTitle: obj.title,
              ownerName: obj.ownerName,
            });
          });
        });
        if (obj.children) collectCheckIns(obj.children);
      });
    };
    if (okrTree) {
      collectCheckIns(okrTree.company || []);
      collectCheckIns(okrTree.department || []);
      collectCheckIns(okrTree.individual || []);
    }
    // Sort by date desc and take top 8
    return allCheckIns
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }, [okrTree]);

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
      if (empStatusFilter === 'Active' && e.active === false) return;
      if (empStatusFilter === 'Inactive' && e.active !== false) return;
      
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ═══════ SECTION 1: STATUS KARYAWAN ═══════════════ */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Status Karyawan</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Headcount, department distribution & employee cost analysis</p>
          </div>
        </div>
      </div>

      {/* Employee KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-icon primary"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Employees</div>
            <div className="kpi-value">{formatNumber(activeEmployees)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Stable workforce</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon info"><CalendarCheck size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Present Today</div>
            <div className="kpi-value">{formatNumber(presentCount || 0)}</div>
            <div className="kpi-trend">{activeEmployees > 0 ? Math.round(((presentCount || 0) / activeEmployees) * 100) : 0}% attendance rate</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}><Building2 size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Departments</div>
            <div className="kpi-value">{dynamicDeptStats.length}</div>
            <div className="kpi-trend">Active departments</div>
          </div>
        </div>
      </div>

      {/* Employee Charts Row 1 */}
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
          <ResponsiveContainer width="100%" height={280}>
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

      {/* Employee Charts Row 2: Cost vs Revenue & Pie Chart */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ═══════ SECTION 2: STATUS KONTRAK ════════════════ */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div style={{ marginTop: '40px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Status Kontrak</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Contract monitoring, expiry alerts & distribution overview</p>
          </div>
        </div>
      </div>

      {/* Contract KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))' }}>
        {contractCategories.map(cat => (
          <div className="kpi-card" key={cat.key}>
            <div className="kpi-icon" style={{ background: `${cat.color}18`, color: cat.color }}><Shield size={24} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{cat.label}</div>
              <div className="kpi-value">{formatNumber(cat.count)}</div>
              <div className="kpi-trend" style={{ color: cat.color }}>{cat.key === 'expired' ? 'Needs renewal' : cat.key === 'expiring30' ? 'Urgent attention' : cat.key === 'expiring60' ? 'Review soon' : 'Healthy'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Charts */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
        {/* Contract Distribution Donut */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Contract Distribution</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatNumber(nonPermanentContracts.length)} total contracts</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={contractCategories.filter(c => c.count > 0).map(c => ({ name: c.label, value: c.count, color: c.color }))}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {contractCategories.filter(c => c.count > 0).map((cat, index) => (
                  <Cell key={`contract-cell-${index}`} fill={cat.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} contracts`, 'Count']} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Contract Monitoring Card */}
        <div
          className="card"
          style={{ ...compactCardStyle, display: 'flex', flexDirection: 'column' }}
          onClick={() => setPopup('contract')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="card-header">
            <h3 className="card-title"><Shield size={18} style={{ marginRight: '8px' }} /> Contract Monitoring</h3>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '4px' }}>
              {contractCategories.map(cat => (
                <div key={cat.key} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: '14px', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: cat.color }}>{formatNumber(cat.count)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{cat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={13} /> Click to view contract details
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ═══════ SECTION 3: ALOKASI WAKTU ═════════════════ */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div style={{ marginTop: '40px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Alokasi Waktu</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Resource allocation across active projects & departments</p>
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Project & Department Allocation</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active allocation percentage</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={allocationData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
            <YAxis type="category" dataKey="project" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={120} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={v => [`${v}%`, 'Allocation']}
            />
            <Bar dataKey="allocation" radius={[0, 6, 6, 0]} barSize={24}>
              {(allocationData || []).map((entry, index) => (
                <Cell key={`alloc-${index}`} fill={`hsl(${175 + index * 18}, 70%, ${48 + index * 3}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ═══════ SECTION 4: PROJECT & PORTFOLIO ═══════════ */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div style={{ marginTop: '40px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Project & Portfolio</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Active projects, client overview & top performing portfolio</p>
          </div>
        </div>
      </div>

      {/* Project KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}><Building2 size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Projects</div>
            <div className="kpi-value">{formatNumber(activeProjectCount)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Running smoothly</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon info"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Clients</div>
            <div className="kpi-value">{formatNumber(activeClientCount)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Client portfolio</div>
          </div>
        </div>
      </div>

      {/* Portfolio Snapshot Card */}
      <div style={{ marginBottom: '24px' }}>
        <div
          className="card"
          style={compactCardStyle}
          onClick={() => setPopup('portfolio')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="card-header">
            <h3 className="card-title"><Building2 size={18} style={{ marginRight: '8px' }} /> Top Performing Projects</h3>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            {topProjects.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '4px' }}>
                {topProjects.slice(0, 6).map(project => (
                  <div key={project.projectCode} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: project.progress >= 80 ? 'rgba(16,185,129,0.12)' : project.progress >= 50 ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={16} style={{ color: project.progress >= 80 ? '#10B981' : project.progress >= 50 ? '#6366F1' : '#F59E0B' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.projectName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{project.client}</div>
                      <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border-color)', overflow: 'hidden', marginTop: '6px' }}>
                        <div style={{ height: '100%', width: `${project.progress}%`, background: project.progress >= 80 ? '#10B981' : project.progress >= 50 ? '#6366F1' : '#F59E0B', borderRadius: '2px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: project.progress >= 80 ? '#10B981' : project.progress >= 50 ? '#6366F1' : '#F59E0B', flexShrink: 0 }}>{project.progress}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No project data available</div>
            )}
            <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={13} /> Click to view full portfolio details
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══════ SECTION 5: OKR OVERVIEW ══════════════════ */}
      {/* ═══════════════════════════════════════════════════ */}

      <div style={{ marginTop: '40px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>OKR Overview</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Objectives & Key Results performance — {currentPeriod}</p>
          </div>
        </div>
      </div>

      {okrLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading OKR data...</div>
      ) : (
        <>
          {/* OKR KPI Row */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}><Target size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">Total Objectives</div>
                <div className="kpi-value">{okrSummary.total}</div>
                <div className="kpi-trend">{okrSummary.completed} completed</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon success"><TrendingUp size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">Avg. Progress</div>
                <div className="kpi-value">{Math.round(okrSummary.avgProgress * 100)}%</div>
                <div className="kpi-trend up"><TrendingUp size={14} /> {currentPeriod}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}><CheckCircle size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">On Track</div>
                <div className="kpi-value">{okrSummary.onTrack}</div>
                <div className="kpi-trend up"><CheckCircle size={14} /> ≥40% progress</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon warning"><AlertTriangle size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">Needs Attention</div>
                <div className="kpi-value">{okrSummary.atRisk}</div>
                <div className="kpi-trend" style={{ color: okrSummary.atRisk > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {okrSummary.atRisk > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                  {okrSummary.atRisk > 0 ? ' Requires review' : ' All good!'}
                </div>
              </div>
            </div>
          </div>

          {/* OKR Charts Row */}
          <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
            {/* Progress by Level */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Progress by Level</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average progress per OKR level</span>
              </div>
              {okrSummary.byLevel.some(l => l.count > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={okrSummary.byLevel} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={90} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v, name, props) => [`${v}% (${props.payload.count} objectives)`, 'Avg. Progress']}
                    />
                    <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={28}>
                      {okrSummary.byLevel.map((entry, index) => (
                        <Cell key={`cell-level-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Target size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p>No objectives data for {currentPeriod}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Confidence Distribution</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Key Results confidence levels</span>
              </div>
              {confidenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name">
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-conf-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} Key Results`, 'Count']} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Target size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p>No key results data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OKR Bottom Cards */}
          <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Top Objectives */}
            <div
              className="card"
              style={compactCardStyle}
              onClick={() => setPopup('okr-top')}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-header">
                <h3 className="card-title"><Target size={18} style={{ marginRight: '8px' }} /> Top Objectives</h3>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="card-body">
                {okrSummary.topObjectives.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {okrSummary.topObjectives.slice(0, 4).map((obj, i) => {
                      const pct = Math.round(parseFloat(obj.progress || 0) * 100);
                      const levelCfg = OKR_LEVEL_CONFIG[obj.level] || OKR_LEVEL_CONFIG.individual;
                      return (
                        <div key={obj.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', background: levelCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Target size={14} style={{ color: levelCfg.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obj.title}</div>
                            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border-color)', overflow: 'hidden', marginTop: '4px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#10B981' : pct >= 40 ? '#6366F1' : '#F59E0B', borderRadius: '2px', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct >= 70 ? '#10B981' : pct >= 40 ? '#6366F1' : '#F59E0B', flexShrink: 0 }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No objectives for {currentPeriod}</div>
                )}
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={13} /> Click to view all objectives
                </div>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><Activity size={18} style={{ marginRight: '8px' }} /> Recent Check-ins</h3>
              </div>
              <div className="card-body">
                {recentCheckIns.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentCheckIns.slice(0, 6).map((ci, i) => {
                      const confColor = OKR_CONFIDENCE_COLORS[ci.confidence] || '#6366F1';
                      return (
                        <div key={ci.id || i} style={{ display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                          {ci.ownerName ? (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${(ci.ownerName || '').charCodeAt(0) * 137.5 % 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                              {getInitials(ci.ownerName)}
                            </div>
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Activity size={12} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ci.metricName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                → {parseFloat(ci.value || 0).toLocaleString()}{ci.unit ? ` ${ci.unit}` : ''}
                              </span>
                              <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '8px', background: `${confColor}18`, color: confColor, fontWeight: 600 }}>{ci.confidence}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {ci.createdAt ? new Date(ci.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Activity size={28} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p>No check-in activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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

      {/* ═══════ OKR TOP OBJECTIVES MODAL ═══════ */}
      {popup === 'okr-top' && (
        <Modal title="OKR — All Objectives" icon={Target} onClose={() => setPopup(null)}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {Object.entries(OKR_LEVEL_CONFIG).map(([key, cfg]) => {
              const count = okrObjectives.filter(o => o.level === key).length;
              return (
                <div key={key} style={{ padding: '10px 18px', borderRadius: '12px', background: cfg.bg, textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{cfg.label}</div>
                </div>
              );
            })}
            <div style={{ padding: '10px 18px', borderRadius: '12px', background: 'var(--bg-secondary)', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(okrSummary.avgProgress * 100)}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Avg. Progress</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {[...okrObjectives].sort((a, b) => parseFloat(b.progress || 0) - parseFloat(a.progress || 0)).map(obj => {
              const pct = Math.round(parseFloat(obj.progress || 0) * 100);
              const levelCfg = OKR_LEVEL_CONFIG[obj.level] || OKR_LEVEL_CONFIG.individual;
              const barColor = pct >= 70 ? '#10B981' : pct >= 40 ? '#6366F1' : '#F59E0B';
              return (
                <div key={obj.id} className="announcement-item" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: levelCfg.bg, color: levelCfg.color, fontWeight: 600, textTransform: 'capitalize' }}>{obj.level}</span>
                        <span className={`badge ${obj.status === 'Active' ? 'success' : obj.status === 'Completed' ? 'primary' : 'neutral'}`} style={{ fontSize: '0.65rem' }}>
                          <span className="badge-dot" />{obj.status}
                        </span>
                      </div>
                      <h4 className="announcement-title" style={{ marginBottom: '4px' }}>{obj.title}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {obj.ownerName && <span>👤 {obj.ownerName}</span>}
                        {obj.departmentName && <span>{obj.ownerName ? ' • ' : ''}📂 {obj.departmentName}</span>}
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: barColor, minWidth: '38px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {okrObjectives.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No objectives for {currentPeriod}</div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
