import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, Clock, Target, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { KANBAN_STAGES as kanbanStages } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { api } from '../../utils/api';

const STAGE_COLORS = { Applied: '#94A3B8', Screening: '#3B82F6', Interview: '#F59E0B', Offered: '#8B5CF6', Hired: '#10B981', Rejected: '#EF4444' };
const chartStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '13px' };

export default function RecruitmentAnalytics() {
  const [candidates, setCandidates] = useState([]);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, candidatesRes] = await Promise.all([
        api.get('/talent/jobs'),
        api.get('/talent/candidates')
      ]);
      setJobOpenings(jobsRes);
      setCandidates(candidatesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Funnel data ─────────────────────────────────
  const funnelData = useMemo(() => kanbanStages.map(stage => ({
    name: stage,
    value: candidates.filter(c => c.stage === stage).length,
    fill: STAGE_COLORS[stage],
  })), [candidates]);

  // ── Candidates per position ──────────────────────
  const perPositionData = useMemo(() => {
    return jobOpenings.map(job => ({
      name: job.title.length > 20 ? job.title.slice(0, 18) + '…' : job.title,
      candidates: candidates.filter(c => c.jobId === job.id).length,
      hired: candidates.filter(c => c.jobId === job.id && c.stage === 'Hired').length,
    }));
  }, [jobOpenings, candidates]);

  // ── Stage distribution (pie) ─────────────────────
  const stageDistribution = useMemo(() => kanbanStages.map(stage => ({
    name: stage,
    value: candidates.filter(c => c.stage === stage).length,
    fill: STAGE_COLORS[stage],
  })).filter(s => s.value > 0), [candidates]);

  // ── KPIs ──────────────────────────────────────────
  const totalCandidates = candidates.length;
  const totalHired = candidates.filter(c => c.stage === 'Hired').length;
  const conversionRate = totalCandidates > 0 ? ((totalHired / totalCandidates) * 100).toFixed(1) : 0;

  // ── Time to hire (mock days between applied → hired) ─
  const hiredCandidates = candidates.filter(c => c.stage === 'Hired');
  const avgDaysToHire = hiredCandidates.length > 0
    ? Math.round(hiredCandidates.reduce((s, c) => {
        const applied = new Date(c.appliedDate);
        const today = new Date();
        return s + Math.abs(today - applied) / (1000 * 60 * 60 * 24);
      }, 0) / hiredCandidates.length)
    : 0;

  if (isLoading) {
    return (
      <div className="animate-in" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Recruitment Analytics</h1>
        <p className="page-subtitle">Real-time infographic seluruh proses rekrutmen yang sedang berjalan.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '28px' }}>
        {[
          { icon: Users, label: 'Total Candidates', value: totalCandidates, color: 'primary', trend: `${jobOpenings.length} open positions` },
          { icon: Award, label: 'Total Hired', value: totalHired, color: 'success', trend: 'Across all positions' },
          { icon: Target, label: 'Conversion Rate', value: `${conversionRate}%`, color: 'warning', trend: 'Applied → Hired' },
          { icon: Clock, label: 'Avg. Time to Hire', value: `${avgDaysToHire}d`, color: 'info', trend: 'Days from apply' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={`kpi-icon ${k.color}`}><k.icon size={24} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-trend up"><TrendingUp size={14} /> {k.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Funnel + Stage Pie */}
      <div className="grid-dashboard" style={{ marginBottom: '24px' }}>
        {/* Recruitment Funnel */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Recruitment Funnel</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applied → Hired</span>
          </div>
          <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
            {funnelData.map((stage, i) => {
              const maxVal = funnelData[0]?.value || 1;
              const pct = Math.round((stage.value / maxVal) * 100);
              const conversion = i > 0 && funnelData[i - 1].value > 0
                ? `${Math.round((stage.value / funnelData[i - 1].value) * 100)}% conv.`
                : '';
              return (
                <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{stage.name}</div>
                  <div style={{ flex: 1, height: '32px', borderRadius: '8px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: stage.fill, borderRadius: '8px', transition: 'width 0.4s', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>{stage.value}</span>
                    </div>
                    {conversion && (
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{conversion}</span>
                    )}
                  </div>
                  <div style={{ width: '36px', fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Distribution Pie */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Stage Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stageDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                {stageDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={chartStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Candidates per Position */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <h3 className="chart-title">Candidates vs Hired per Position</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>All open positions</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={perPositionData} barGap={4}>
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={chartStyle} />
            <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
            <Bar dataKey="candidates" name="Total Candidates" fill="#6366F1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="hired" name="Hired" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Top Candidates Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Award size={18} style={{ marginRight: '8px' }} />Top Rated Candidates</h3>
        </div>
        <div className="card-body">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Candidate', 'Position', 'Stage', 'Rating', 'Applied'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...candidates].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8).map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {jobOpenings.find(j => j.id === c.jobId)?.title || 'Unknown Position'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '8px', background: `${STAGE_COLORS[c.stage]}18`, color: STAGE_COLORS[c.stage], fontWeight: 600, fontSize: '0.78rem' }}>{c.stage}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {c.rating > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700 }}>
                          ★ {c.rating}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(c.appliedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
