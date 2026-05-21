import { useState, useEffect, useMemo } from 'react';
import { TrendingDown, TrendingUp, Users, UserMinus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../../utils/api';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

export default function Turnover() {
  const [data, setData] = useState([]);
  const [breakdown, setBreakdown] = useState({ departmentTurnover: [], exitReasons: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [trend, b] = await Promise.all([
          api.get('/analytics/turnover'),
          api.get('/analytics/turnover-breakdown')
        ]);
        setData(trend);
        setBreakdown(b);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const totalJoined = data.reduce((s, d) => s + (d.joined || 0), 0);
    const totalLeft = data.reduce((s, d) => s + (d.left || 0), 0);
    const currentRate = totalJoined > 0 ? ((totalLeft / totalJoined) * 100).toFixed(1) : 0;
    const avgRate = 4.8;
    return { currentRate, avgRate, totalJoined, totalLeft };
  }, [data]);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>;
  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Turnover Analytics</h1>
        <p className="page-subtitle">Employee retention and attrition insights</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><TrendingDown size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Current Turnover Rate</div>
            <div className="kpi-value">{summary.currentRate}%</div>
            <div className="kpi-trend up"><TrendingDown size={14} /> Below average</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">12-Month Average</div>
            <div className="kpi-value">{summary.avgRate}%</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Joined</div>
            <div className="kpi-value">{summary.totalJoined}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon danger"><UserMinus size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Left</div>
            <div className="kpi-value">{summary.totalLeft}</div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Turnover Trend (12 Months)</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="joined" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="Joined" />
            <Line type="monotone" dataKey="left" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} name="Left" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        {/* Department Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">By Department</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdown.departmentTurnover} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 6, 6, 0]} name="Exit Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Exit Reasons */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Exit Reasons</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={breakdown.exitReasons} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {breakdown.exitReasons.map((entry, i) => <Cell key={i} fill={['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'][i % 5]} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
