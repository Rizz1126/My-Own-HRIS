import { useState, useEffect } from 'react';
import { Clock, DollarSign, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calculateOvertimeRate, formatCurrency, formatNumber, getInitials, formatHoursToHHMM } from '../../utils/formatters';
import { api } from '../../utils/api';

const overtimeMonthlyTrend = [
  { month: 'Jan', hours: 420, cost: 72000000 },
  { month: 'Feb', hours: 385, cost: 66000000 },
  { month: 'Mar', hours: 510, cost: 87500000 },
  { month: 'Apr', hours: 465, cost: 79800000 },
];


const chartTooltipStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px',
};

export default function OvertimeStats() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/overtime/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const overtimeHistory = requests.filter(r => r.achievement === 'Completed' || r.status === 'Completed' || r.status === 'Processed');

  const overtimeStatsByDept = (() => {
    const map = {};
    overtimeHistory.forEach(o => {
      const deptName = o.employee?.department?.name || 'Unknown';
      if (!map[deptName]) map[deptName] = { department: deptName, hours: 0, cost: 0 };
      map[deptName].hours += Number(o.hours) || Number(o.actualHours) || 0;
      map[deptName].cost += Math.round(calculateOvertimeRate(o.employee?.baseSalary || 8000000, Number(o.hours) || Number(o.actualHours) || 0, o.isWeekend));
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  })();

  const totalHours = overtimeStatsByDept.reduce((a, b) => a + b.hours, 0);
  const totalCost = overtimeStatsByDept.reduce((a, b) => a + b.cost, 0);
  const avgPerEmployee = overtimeHistory.length > 0 ? Math.round(totalHours / overtimeHistory.length * 10) / 10 : 0;
  const utilization = overtimeHistory.length > 0 ? Math.round((overtimeHistory.filter(h => Number(h.actualHours) >= Number(h.plannedHours)).length / overtimeHistory.length) * 100) : 0;

  // Top 10 by hours
  const topEmps = [...overtimeHistory]
    .sort((a, b) => (Number(b.hours) || Number(b.actualHours) || 0) - (Number(a.hours) || Number(a.actualHours) || 0))
    .slice(0, 10);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading stats...</div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Overtime Statistics</h1>
        <p className="page-subtitle">Overview of all overtime data across the organization</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-icon primary"><Clock size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total OT Hours (Month)</div>
            <div className="kpi-value">{formatNumber(totalHours)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> This month</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total OT Cost</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(totalCost)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Based on UU TK rates</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Avg OT/Employee</div>
            <div className="kpi-value">{formatHoursToHHMM(avgPerEmployee)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Per headcount</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon info"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">OT Utilization</div>
            <div className="kpi-value">{utilization}%</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> Plan vs actual</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
        {/* OT by Department */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">OT Hours by Department</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overtimeStatsByDept} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
              <YAxis type="category" dataKey="department" stroke="var(--text-muted)" fontSize={11} width={90} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => n === 'cost' ? formatCurrency(v) : formatHoursToHHMM(v)} />
              <Bar dataKey="hours" name="Hours" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Monthly OT Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overtimeMonthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="hours" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="cost" orientation="right" stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v, n) => n === 'cost' ? formatCurrency(v) : formatHoursToHHMM(v)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem' }} />
              <Line yAxisId="hours" type="monotone" dataKey="hours" name="Hours" stroke="#6366F1" strokeWidth={2.5} dot={false} />
              <Line yAxisId="cost" type="monotone" dataKey="cost" name="Cost" stroke="#F43F5E" strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Employees */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top 10 Employees by OT Hours</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Employee</th><th>Department</th><th>Planned</th><th>Actual</th><th>Status</th><th>Est. Cost</th></tr>
            </thead>
            <tbody>
              {topEmps.map((emp, i) => (
                <tr key={emp.id}>
                  <td><span className="font-semibold" style={{ color: i < 3 ? 'var(--color-primary)' : 'var(--text-muted)' }}>#{i + 1}</span></td>
                  <td>
                    <div className="table-avatar">
                      <div className="table-avatar-img">{getInitials(emp.employee?.name || 'Unknown')}</div>
                      <span className="table-name">{emp.employee?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{emp.employee?.department?.name || 'N/A'}</td>
                  <td>{formatHoursToHHMM(emp.plannedHours || emp.hours)}</td>
                  <td className="font-semibold">{formatHoursToHHMM(emp.hours || emp.actualHours)}</td>
                  <td>
                    <span className={`badge ${Number(emp.hours || emp.actualHours) > Number(emp.plannedHours || emp.hours) ? 'warning' : 'success'}`}>
                      <span className="badge-dot" />{Number(emp.hours || emp.actualHours) > Number(emp.plannedHours || emp.hours) ? 'Extended' : 'On Time'}
                    </span>
                  </td>
                  <td className="font-semibold">{formatCurrency(calculateOvertimeRate(emp.employee?.baseSalary || 8000000, Number(emp.hours || emp.actualHours) || 0, emp.isWeekend))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
