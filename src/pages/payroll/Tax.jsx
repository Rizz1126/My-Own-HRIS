import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculatePayrollForEmployee } from '../../utils/payrollCalculations';
import { formatCurrency, getInitials } from '../../utils/formatters';
import { useEmployees } from '../../context/EmployeeContext';

const chartTooltipStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' };

export default function Tax() {
  const { employees, isLoadingEmployees } = useEmployees();

  const activeEmployees = useMemo(() => employees.filter((emp) => emp.status !== 'Inactive' && emp.status !== 'Resigned'), [employees]);

  const payrollData = useMemo(() => {
    return activeEmployees.map((emp, index) => calculatePayrollForEmployee(emp, null, index));
  }, [activeEmployees]);

  const payrollSummary = useMemo(() => ({
    totalTax: payrollData.reduce((s, p) => s + p.pph21Monthly, 0),
  }), [payrollData]);

  const taxBrackets = useMemo(() => [
    { range: '0 - 60M', rate: '5%', amount: payrollData.filter(p => p.pkp <= 60000000 && p.pkp > 0).length },
    { range: '60M - 250M', rate: '15%', amount: payrollData.filter(p => p.pkp > 60000000 && p.pkp <= 250000000).length },
    { range: '250M - 500M', rate: '25%', amount: payrollData.filter(p => p.pkp > 250000000 && p.pkp <= 500000000).length },
    { range: '> 500M', rate: '30%', amount: payrollData.filter(p => p.pkp > 500000000).length },
  ], [payrollData]);

  if (isLoadingEmployees) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tax data...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">PPh 21 (Income Tax)</h1>
        <p className="page-subtitle">Monthly income tax calculation per employee</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon warning"><Receipt size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total PPh 21 This Month</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(payrollSummary.totalTax)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Tax Bracket Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taxBrackets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Tax Brackets (PPh 21)</h3>
          {[{ range: '≤ Rp60M', rate: '5%', color: '#10B981' }, { range: 'Rp60M - Rp250M', rate: '15%', color: '#3B82F6' }, { range: 'Rp250M - Rp500M', rate: '25%', color: '#F59E0B' }, { range: '> Rp500M', rate: '30%', color: '#EF4444' }].map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border-color-light)' : 'none' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{b.range}</span>
              <span style={{ fontWeight: 700, color: b.color }}>{b.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Employee</th><th>Gross (Annual)</th><th>PTKP</th><th>PKP</th><th>PPh 21 (Annual)</th><th>PPh 21 (Monthly)</th></tr>
          </thead>
          <tbody>
            {payrollData.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="table-avatar">
                    <div className="table-avatar-img" style={{ background: p.avatarColor }}>{getInitials(p.employeeName)}</div>
                    <div className="table-name">{p.employeeName}</div>
                  </div>
                </td>
                <td>{formatCurrency(p.grossSalary * 12)}</td>
                <td>{formatCurrency(p.ptkp)}</td>
                <td>{formatCurrency(p.pkp)}</td>
                <td>{formatCurrency(p.pph21Annual)}</td>
                <td className="font-bold" style={{ color: 'var(--color-warning)' }}>{formatCurrency(p.pph21Monthly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
