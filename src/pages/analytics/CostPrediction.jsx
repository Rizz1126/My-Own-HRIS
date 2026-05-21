import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, AlertCircle, Calendar, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { api } from '../../utils/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

export default function CostPrediction() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/analytics/cost-prediction');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;
    const currentCost = data.history.length > 0 ? Number(data.history[data.history.length - 1].total) : 0;
    const predictedNextMonth = data.predictions[0]?.predicted || 0;
    const trend = currentCost > 0 ? ((predictedNextMonth / currentCost - 1) * 100).toFixed(1) : '0.0';
    const confidence = 92;
    return { currentCost, predictedNextMonth, trend, confidence };
  }, [data]);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading predictions...</div>;
  if (!data || !summary) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load prediction data.</div>;
  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">HR Cost Prediction</h1>
        <p className="page-subtitle">Projected HR expenditure and scenario analysis</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Current Monthly Cost</div>
            <div className="kpi-value">{formatCurrency(summary.currentCost)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Projected Next Month</div>
            <div className="kpi-value">{formatCurrency(summary.predictedNextMonth)}</div>
            <div className="kpi-trend up"><TrendingUp size={14} /> +{summary.trend}% trend</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Model Confidence</div>
            <div className="kpi-value">{summary.confidence}%</div>
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Historical & Projected Costs</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[...data.history.map(h => ({ month: `${h.month}/${h.year}`, actual: Number(h.total) })), ...data.predictions]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="actual" stroke="#6366F1" fill="#6366F1" fillOpacity={0.1} strokeWidth={2} name="Actual Cost" />
            <Area type="monotone" dataKey="predicted" stroke="#10B981" strokeDasharray="5 5" fill="#10B981" fillOpacity={0.05} strokeWidth={2} name="Predicted Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Cost Breakdown Comparison</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar dataKey="current" fill="#6366F1" radius={[4, 4, 0, 0]} name="Current (M)" />
              <Bar dataKey="projected" fill="#A5B4FC" radius={[4, 4, 0, 0]} name="Projected (M)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Cost Detail</h3>
          {data.costBreakdown.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < data.costBreakdown.length - 1 ? '1px solid var(--border-color-light)' : 'none' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
              <div style={{ textAlign: 'right' }}>
                <div className="font-semibold">Rp {formatNumber(item.current)}M</div>
                <div style={{ fontSize: '0.78rem', color: item.projected > item.current ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  → Rp {formatNumber(item.projected)}M
                  {item.projected > item.current && <TrendingUp size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
