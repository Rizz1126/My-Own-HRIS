import { useState, useMemo } from 'react';
import { Shield, CheckCircle, AlertCircle, Building2, User, Info, Download } from 'lucide-react';
import { calculatePayrollForEmployee } from '../../utils/payrollCalculations';
import { formatCurrency, getInitials } from '../../utils/formatters';
import { useEmployees } from '../../context/EmployeeContext';

const BPJS_RATES = {
  kesehatan: {
    company: { rate: 0.04, label: '4%', desc: 'Paid by Company' },
    employee: { rate: 0.01, label: '1%', desc: 'Deducted from Employee', max: 12000000 },
    note: 'Max. wage = 12× PTKP (Rp 12,000,000)',
  },
  jht: {
    company: { rate: 0.037, label: '3.7%', desc: 'Old Age Security - Company' },
    employee: { rate: 0.02, label: '2%', desc: 'Old Age Security - Employee' },
  },
  jkk: { company: { rate: 0.0024, label: '0.24%', desc: 'Work Accident Insurance' } },
  jkm: { company: { rate: 0.003, label: '0.3%', desc: 'Death Insurance' } },
  jp: {
    company: { rate: 0.02, label: '2%', desc: 'Pension Insurance - Company', max: 9559600 },
    employee: { rate: 0.01, label: '1%', desc: 'Pension Insurance - Employee', max: 9559600 },
  },
};

export default function BPJS() {
  const [tab, setTab] = useState('kesehatan');
  const { employees, isLoadingEmployees } = useEmployees();

  const activeEmployees = useMemo(() => employees.filter((emp) => emp.status !== 'Inactive' && emp.status !== 'Resigned'), [employees]);

  const payrollData = useMemo(() => {
    return activeEmployees.map((emp, index) => calculatePayrollForEmployee(emp, null, index));
  }, [activeEmployees]);

  const summary = useMemo(() => ({
    totalBPJSKes: payrollData.reduce((s, p) => s + p.bpjsKesCompany + p.bpjsKesEmployee, 0),
    totalBPJSTK: payrollData.reduce((s, p) =>
      s + p.bpjsJHTCompany + p.bpjsJHTEmployee + p.bpjsJKKCompany + p.bpjsJKMCompany + p.bpjsJPCompany + p.bpjsJPEmployee, 0),
    totalEmployee: payrollData.reduce((s, p) => s + p.bpjsKesEmployee + p.bpjsJHTEmployee + p.bpjsJPEmployee, 0),
    totalCompany: payrollData.reduce((s, p) =>
      s + p.bpjsKesCompany + p.bpjsJHTCompany + p.bpjsJKKCompany + p.bpjsJKMCompany + p.bpjsJPCompany, 0),
    count: payrollData.length,
  }), [payrollData]);

  if (isLoadingEmployees) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p>Loading BPJS data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-in">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">BPJS Management</h1>
          <p className="page-subtitle">Social security & health insurance contributions • {summary.count} active employees</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => {
          const rows = [
            ['Employee', 'Department', 'Base Salary', 'Kes Co. (4%)', 'Kes Emp. (1%)', 'JHT Co. (3.7%)', 'JHT Emp. (2%)', 'JKK (0.24%)', 'JKM (0.3%)', 'JP Co. (2%)', 'JP Emp. (1%)'],
            ...payrollData.map(p => [p.employeeName, p.department, p.baseSalary, p.bpjsKesCompany, p.bpjsKesEmployee, p.bpjsJHTCompany, p.bpjsJHTEmployee, p.bpjsJKKCompany, p.bpjsJKMCompany, p.bpjsJPCompany, p.bpjsJPEmployee])
          ];
          const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'bpjs-report.csv'; a.click();
        }}>
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: 'BPJS Kesehatan', value: summary.totalBPJSKes,
            icon: Shield, color: '#10B981', bg: 'rgba(16,185,129,0.1)',
            sub: 'Kes. 4% + 1%',
          },
          {
            label: 'BPJS Ketenagakerjaan', value: summary.totalBPJSTK,
            icon: Shield, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
            sub: 'JHT + JKK + JKM + JP',
          },
          {
            label: 'Company Contribution', value: summary.totalCompany,
            icon: Building2, color: '#6366F1', bg: 'rgba(99,102,241,0.1)',
            sub: 'Company burden',
          },
          {
            label: 'Employee Deduction', value: summary.totalEmployee,
            icon: User, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
            sub: 'Deducted from salary',
          },
          {
            label: 'Compliance Rate', value: '100%',
            icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)',
            isText: true, sub: 'All employees enrolled',
          },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
              <kpi.icon size={22} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value" style={{ fontSize: '1.05rem', color: kpi.color }}>
                {kpi.isText ? kpi.value : formatCurrency(kpi.value)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Rate Reference Card ── */}
      <div style={{
        padding: '16px 20px', borderRadius: '14px', marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))',
        border: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <Info size={16} color="#3B82F6" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3B82F6' }}>Rate Reference</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', flex: 1 }}>
          {[
            { label: 'Health Co.', val: '4%', color: '#10B981' },
            { label: 'Health Emp.', val: '1%', color: '#10B981' },
            { label: 'JHT Company', val: '3.7%', color: '#3B82F6' },
            { label: 'JHT Employee', val: '2%', color: '#3B82F6' },
            { label: 'JKK', val: '0.24%', color: '#6366F1' },
            { label: 'JKM', val: '0.3%', color: '#6366F1' },
            { label: 'JP Company', val: '2%', color: '#8B5CF6' },
            { label: 'JP Employee', val: '1%', color: '#8B5CF6' },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: r.color, fontSize: '1rem' }}>{r.val}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginBottom: '16px' }}>
        <button className={`tab ${tab === 'kesehatan' ? 'active' : ''}`} onClick={() => setTab('kesehatan')}>
          🏥 BPJS Kesehatan
        </button>
        <button className={`tab ${tab === 'ketenagakerjaan' ? 'active' : ''}`} onClick={() => setTab('ketenagakerjaan')}>
          🛡️ BPJS Ketenagakerjaan
        </button>
      </div>

      {/* ── BPJS Kesehatan Table ── */}
      {tab === 'kesehatan' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Salary</th>
                <th style={{ color: '#6366F1' }}>Company (4%)</th>
                <th style={{ color: '#F59E0B' }}>Employee (1%)</th>
                <th style={{ color: '#10B981' }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-avatar">
                      <div className="table-avatar-img" style={{ background: p.avatarColor }}>{getInitials(p.employeeName)}</div>
                      <div>
                        <div className="table-name">{p.employeeName}</div>
                        <div className="table-sub">{p.department}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(p.baseSalary)}</td>
                  <td style={{ color: '#6366F1' }}>{formatCurrency(p.bpjsKesCompany)}</td>
                  <td style={{ color: '#F59E0B' }}>{formatCurrency(p.bpjsKesEmployee)}</td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(p.bpjsKesCompany + p.bpjsKesEmployee)}</td>
                  <td><span className="badge success"><CheckCircle size={11} /> Compliant</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td colSpan={2}>Total</td>
                <td style={{ color: '#6366F1' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsKesCompany, 0))}</td>
                <td style={{ color: '#F59E0B' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsKesEmployee, 0))}</td>
                <td style={{ color: '#10B981' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsKesCompany + p.bpjsKesEmployee, 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── BPJS Ketenagakerjaan Table ── */}
      {tab === 'ketenagakerjaan' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ color: '#3B82F6' }}>JHT Co. (3.7%)</th>
                <th style={{ color: '#F59E0B' }}>JHT Emp. (2%)</th>
                <th style={{ color: '#6366F1' }}>JKK (0.24%)</th>
                <th style={{ color: '#8B5CF6' }}>JKM (0.3%)</th>
                <th style={{ color: '#3B82F6' }}>JP Co. (2%)</th>
                <th style={{ color: '#F59E0B' }}>JP Emp. (1%)</th>
                <th style={{ color: '#10B981' }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((p) => {
                const total = p.bpjsJHTCompany + p.bpjsJHTEmployee + p.bpjsJKKCompany + p.bpjsJKMCompany + p.bpjsJPCompany + p.bpjsJPEmployee;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-avatar">
                        <div className="table-avatar-img" style={{ background: p.avatarColor }}>{getInitials(p.employeeName)}</div>
                        <div className="table-name">{p.employeeName}</div>
                      </div>
                    </td>
                    <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsJHTCompany)}</td>
                    <td style={{ color: '#F59E0B' }}>{formatCurrency(p.bpjsJHTEmployee)}</td>
                    <td style={{ color: '#6366F1' }}>{formatCurrency(p.bpjsJKKCompany)}</td>
                    <td style={{ color: '#8B5CF6' }}>{formatCurrency(p.bpjsJKMCompany)}</td>
                    <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsJPCompany)}</td>
                    <td style={{ color: '#F59E0B' }}>{formatCurrency(p.bpjsJPEmployee)}</td>
                    <td style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(total)}</td>
                    <td><span className="badge success"><CheckCircle size={11} /> Compliant</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td>Total</td>
                <td style={{ color: '#3B82F6' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJHTCompany, 0))}</td>
                <td style={{ color: '#F59E0B' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJHTEmployee, 0))}</td>
                <td style={{ color: '#6366F1' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJKKCompany, 0))}</td>
                <td style={{ color: '#8B5CF6' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJKMCompany, 0))}</td>
                <td style={{ color: '#3B82F6' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJPCompany, 0))}</td>
                <td style={{ color: '#F59E0B' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJPEmployee, 0))}</td>
                <td style={{ color: '#10B981' }}>{formatCurrency(payrollData.reduce((s, p) => s + p.bpjsJHTCompany + p.bpjsJHTEmployee + p.bpjsJKKCompany + p.bpjsJKMCompany + p.bpjsJPCompany + p.bpjsJPEmployee, 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
