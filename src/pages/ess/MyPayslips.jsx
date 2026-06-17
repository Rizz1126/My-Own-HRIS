import { useState, useEffect, useMemo } from 'react';
import { Download, Eye, X, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency, getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { calculatePayrollForEmployee } from '../../utils/payrollCalculations';

export default function MyPayslips() {
  const { user } = useAuth();
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [period, setPeriod] = useState('All Periods');
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayslips = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/payroll/payslips/employee/${user?.employeeId}`);
      
      const formatted = data.map((ps, index) => {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const periodStr = `${monthNames[ps.periodMonth]} ${ps.periodYear}`;
        const grossSalary = (ps.baseSalary || 0) + (ps.allowancesTotal || 0);
        const empName = ps.employee?.name || user?.name || 'Unknown';
        const empDept = ps.employee?.department || user?.department || 'N/A';
        const empPos = ps.employee?.position || user?.position || 'N/A';
        const empId = ps.employee?.id || user?.employeeId || '';
        return {
          id: ps.id,
          employeeId: empId,
          employeeName: empName,
          department: empDept,
          position: empPos,
          period: periodStr,
          baseSalary: ps.baseSalary || 0,
          grossSalary,
          totalDeductions: ps.deductionsTotal || 0,
          netSalary: ps.netPay || 0,
          status: ps.status,
          paidDate: ps.status === 'Paid' ? `${ps.periodYear}-0${ps.periodMonth}-28` : null,
          avatarColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
          bank: ps.employee?.bankName || user?.bankName || 'BCA',
          bankAccount: ps.employee?.bankAccountNumber || user?.bankAccountNumber || '—',
        };
      });
      setPayslips(formatted);
    } catch (err) {
      console.error(err);
      toast.error('Failed', 'Could not fetch your payslips.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const availablePeriods = useMemo(() => {
    const periods = [...new Set(payslips.map(p => p.period))].sort().reverse();
    return ['All Periods', ...periods];
  }, [payslips]);

  const filtered = useMemo(() => {
    return payslips.filter(ps => period === 'All Periods' || ps.period === period);
  }, [payslips, period]);

  const summary = useMemo(() => ({
    totalGross: filtered.reduce((s, p) => s + p.grossSalary, 0),
    totalNet: filtered.reduce((s, p) => s + p.netSalary, 0),
    totalDeductions: filtered.reduce((s, p) => s + p.totalDeductions, 0),
  }), [filtered]);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your payslips...</div>;

  const exportAllCSV = () => {
    const rows = [
      ['ID', 'Period', 'Base Salary', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Bank', 'Account'],
      ...filtered.map(ps => [ps.id, ps.period, ps.baseSalary, ps.grossSalary, ps.totalDeductions, ps.netSalary, ps.status, ps.bank, ps.bankAccount])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `my-payslips-${period}.csv`; a.click();
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Payslips</h1>
          <p className="page-subtitle">View and download your digital payslips</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={exportAllCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        {[
          { icon: Wallet, label: 'Total Gross (Filtered)', value: formatCurrency(summary.totalGross), color: 'primary' },
          { icon: TrendingDown, label: 'Total Deductions', value: formatCurrency(summary.totalDeductions), color: 'danger' },
          { icon: TrendingUp, label: 'Total Net Pay', value: formatCurrency(summary.totalNet), color: 'success' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={`kpi-icon ${k.color}`}><k.icon size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <select className="filter-select" value={period} onChange={e => { setPeriod(e.target.value); setSelected(null); }}>
              {availablePeriods.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(ps => (
                  <tr key={ps.id} style={{ background: selected?.id === ps.id ? 'var(--color-primary-bg)' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{ps.period}</td>
                    <td className="font-bold">{formatCurrency(ps.netSalary)}</td>
                    <td>
                      <span className={`badge ${ps.status === 'Paid' ? 'success' : 'warning'}`}>
                        <span className="badge-dot" />{ps.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => setSelected(ps)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={13} /> View
                        </button>
                        <button className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            const rows = [['Field','Value'],['Employee',ps.employeeName],['Period',ps.period],['Department',ps.department],['Net Pay',ps.netSalary],['Status',ps.status]];
                            const csv = rows.map(r => r.join(',')).join('\n');
                            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`payslip-${ps.period}.csv`; a.click();
                          }}>
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No payslips available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div style={{ flex: '0 0 400px' }}>
            <div className="payslip-card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 24px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} /> {selected.period}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="payslip-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Humanova</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pay Slip — {selected.period}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: selected.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                  {getInitials(selected.employeeName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selected.employeeName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.position} • {selected.department}</div>
                  {selected.bank && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selected.bank} • {selected.bankAccount}</div>}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-success)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings</div>
                {(() => {
                  const calc = calculatePayrollForEmployee({ baseSalary: selected.baseSalary, position: selected.position }, null, 0);
                  return [
                    ['Base Salary', selected.baseSalary],
                    ['Transport Allowance', calc.transportAllowance],
                    ['Meal Allowance', calc.mealAllowance],
                    ...(calc.positionAllowance > 0 ? [['Position Allowance', calc.positionAllowance]] : []),
                    ['Gross Salary', selected.grossSalary],
                  ].map(([label, val], i, arr) => (
                    <div key={label} className="payslip-row" style={i === arr.length - 1 ? { fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' } : {}}>
                      <span>{label}</span><span>{formatCurrency(val)}</span>
                    </div>
                  ));
                })()}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-danger)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</div>
                {(() => {
                  const calc = calculatePayrollForEmployee({ baseSalary: selected.baseSalary, position: selected.position }, null, 0);
                  const totalDed = calc.pph21Monthly + calc.bpjsKesEmployee + calc.bpjsJHTEmployee + calc.bpjsJPEmployee;
                  return [
                    ['PPh 21', calc.pph21Monthly],
                    ['BPJS Kesehatan (1%)', calc.bpjsKesEmployee],
                    ['BPJS JHT (2%)', calc.bpjsJHTEmployee],
                    ['BPJS JP (1%)', calc.bpjsJPEmployee],
                    ['Total Deductions', totalDed],
                  ].map(([label, val], i, arr) => (
                    <div key={label} className="payslip-row" style={i === arr.length - 1 ? { fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' } : {}}>
                      <span>{label}</span>
                      <span style={i === arr.length - 1 ? { color: 'var(--color-danger)' } : {}}>-{formatCurrency(val)}</span>
                    </div>
                  ));
                })()}
              </div>

              <div className="payslip-total" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', marginBottom: '8px' }}>
                <span>NET PAY</span>
                <span>{formatCurrency(selected.netSalary)}</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span className={`badge ${selected.status === 'Paid' ? 'success' : 'warning'}`}>
                  <span className="badge-dot" />
                  {selected.status === 'Paid' ? `Paid on ${selected.paidDate || '—'}` : 'Pending payment'}
                </span>
              </div>

              <button className="btn btn-primary w-full" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const lines = [
                    `PAY SLIP — ${selected.period}`,
                    `Employee: ${selected.employeeName}`,
                    `Position: ${selected.position} | Dept: ${selected.department}`,
                    `Bank: ${selected.bank} | Acc: ${selected.bankAccount}`,
                    '---',
                    `Base Salary: ${formatCurrency(selected.baseSalary)}`,
                    `Gross Salary: ${formatCurrency(selected.grossSalary)}`,
                    `Total Deductions: ${formatCurrency(selected.totalDeductions)}`,
                    `NET PAY: ${formatCurrency(selected.netSalary)}`,
                    `Status: ${selected.status}`,
                  ];
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
                  a.download = `payslip-${selected.period}.txt`;
                  a.click();
                }}>
                <Download size={16} /> Download Payslip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
