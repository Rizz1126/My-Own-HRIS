import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingDown, TrendingUp, Wallet, CheckCircle2,
  ChevronDown, ChevronUp, Download, RefreshCw, Calendar, Users,
  Shield, Receipt, ArrowUpRight
} from 'lucide-react';
import { calculatePayrollForEmployee } from '../../utils/payrollCalculations';
import { formatCurrency, getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useEmployees } from '../../context/EmployeeContext';
import { useToast } from '../../context/ToastContext';

const PERIODS = [
  { month: 1, label: 'January' }, { month: 2, label: 'February' }, { month: 3, label: 'March' },
  { month: 4, label: 'April' }, { month: 5, label: 'May' }, { month: 6, label: 'June' },
  { month: 7, label: 'July' }, { month: 8, label: 'August' }, { month: 9, label: 'September' },
  { month: 10, label: 'October' }, { month: 11, label: 'November' }, { month: 12, label: 'December' },
];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function Calculation() {
  const { employees, isLoadingEmployees } = useEmployees();
  const toast = useToast();
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'detail'
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      const otReqs = await api.get('/overtime/requests');
      setOvertimeRequests(otReqs.filter((r) =>
        r.status === 'Completed' || r.status === 'Processed' || r.status === 'Approved'
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPayrollData(); }, []);

  const activeEmployees = useMemo(() => employees.filter((emp) => emp.status !== 'Inactive' && emp.status !== 'Resigned'), [employees]);

  const payrollData = useMemo(() => {
    return activeEmployees.map((emp, index) => {
      const otRecord = overtimeRequests.find((o) =>
        o.employee?.id === emp.id || o.employeeId === emp.id
      );
      return calculatePayrollForEmployee(emp, otRecord, index);
    });
  }, [activeEmployees, overtimeRequests]);

  const payrollSummary = useMemo(() => ({
    totalGross: payrollData.reduce((s, p) => s + p.grossSalary, 0),
    totalDeductions: payrollData.reduce((s, p) => s + p.totalDeductions, 0),
    totalNet: payrollData.reduce((s, p) => s + p.netSalary, 0),
    totalBPJS: payrollData.reduce((s, p) => s + p.bpjsKesEmployee + p.bpjsJHTEmployee + p.bpjsJPEmployee, 0),
    totalPPh21: payrollData.reduce((s, p) => s + p.pph21Monthly, 0),
    count: payrollData.length,
  }), [payrollData]);

  const handleProcessPayroll = async () => {
    if (payrollData.length === 0) return;
    try {
      setIsProcessing(true);
      await Promise.all(payrollData.map(data =>
        api.post('/payroll/payslips', {
          employeeId: data.employeeId,
          periodMonth: selectedMonth,
          periodYear: selectedYear,
          baseSalary: data.baseSalary,
          allowancesTotal: data.transportAllowance + data.mealAllowance + data.positionAllowance + data.overtime,
          deductionsTotal: data.totalDeductions,
          netPay: data.netSalary,
          status: 'Processed'
        })
      ));
      toast.success('Payroll Processed', `Payslips for ${payrollData.length} employees have been generated successfully.`);
    } catch (err) {
      toast.error('Process Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPeriodLabel = `${PERIODS.find(p => p.month === selectedMonth)?.label || ''} ${selectedYear}`;

  if (isLoading || isLoadingEmployees) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p>Loading payroll data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-in">
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Salary Calculation</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Payroll period: {selectedPeriodLabel} • {payrollSummary.count} employees
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period Selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
          >
            {PERIODS.map(p => <option key={p.month} value={p.month}>{p.label}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={fetchPayrollData} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button
            className="btn btn-secondary"
            title="Export CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              const rows = [
                ['Employee', 'Department', 'Base Salary', 'Transport', 'Meal', 'Position', 'Overtime', 'Gross', 'PPh 21', 'BPJS Kes', 'BPJS JHT', 'BPJS JP', 'Total Deductions', 'Net Pay'],
                ...payrollData.map(p => [p.employeeName, p.department, p.baseSalary, p.transportAllowance, p.mealAllowance, p.positionAllowance, p.overtime, p.grossSalary, p.pph21Monthly, p.bpjsKesEmployee, p.bpjsJHTEmployee, p.bpjsJPEmployee, p.totalDeductions, p.netSalary])
              ];
              const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `payroll-${selectedPeriodLabel}.csv`; a.click();
            }}
          >
            <Download size={16} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={handleProcessPayroll}
            disabled={isProcessing || payrollData.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isProcessing ? <><RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing...</> : <><CheckCircle2 size={16} /> Process Payroll</>}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Gross', value: payrollSummary.totalGross, icon: Wallet, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Total BPJS (Employee)', value: payrollSummary.totalBPJS, icon: Shield, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Total PPh 21', value: payrollSummary.totalPPh21, icon: Receipt, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Total Deductions', value: payrollSummary.totalDeductions, icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Total Net Pay', value: payrollSummary.totalNet, icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
              <kpi.icon size={22} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value" style={{ fontSize: '1.1rem', color: kpi.color }}>{formatCurrency(kpi.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'summary', label: '📊 Summary View' },
          { key: 'detail', label: '🔍 Full Breakdown' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Summary Table ── */}
      {activeTab === 'summary' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Salary</th>
                <th>Allowances</th>
                <th>Overtime</th>
                <th style={{ color: '#F59E0B' }}>PPh 21</th>
                <th style={{ color: '#3B82F6' }}>BPJS</th>
                <th style={{ color: '#EF4444' }}>Total Deduction</th>
                <th style={{ color: '#10B981' }}>Net Pay</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((p) => (
                <>
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}>
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
                    <td style={{ color: '#10B981' }}>+{formatCurrency(p.transportAllowance + p.mealAllowance + p.positionAllowance)}</td>
                    <td style={{ color: p.overtime > 0 ? '#8B5CF6' : 'var(--text-muted)' }}>
                      {p.overtime > 0 ? `+${formatCurrency(p.overtime)}` : '—'}
                    </td>
                    <td style={{ color: '#F59E0B' }}>{formatCurrency(p.pph21Monthly)}</td>
                    <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsKesEmployee + p.bpjsJHTEmployee + p.bpjsJPEmployee)}</td>
                    <td style={{ color: '#EF4444', fontWeight: 600 }}>-{formatCurrency(p.totalDeductions)}</td>
                    <td><span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.95rem' }}>{formatCurrency(p.netSalary)}</span></td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        {expandedRow === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={9} style={{ padding: 0 }}>
                        <div style={{
                          padding: '16px 24px', background: 'var(--bg-secondary)',
                          borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)',
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {/* Earnings */}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10B981', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ✅ Earnings
                              </div>
                              {[
                                { label: 'Base Salary', value: p.baseSalary },
                                { label: 'Transport Allowance', value: p.transportAllowance },
                                { label: 'Meal Allowance', value: p.mealAllowance },
                                { label: 'Position Allowance', value: p.positionAllowance },
                                { label: 'Overtime', value: p.overtime },
                              ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color-light, var(--border-color))' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(item.value)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
                                <span>Gross Total</span>
                                <span>{formatCurrency(p.grossSalary)}</span>
                              </div>
                            </div>

                            {/* PPh 21 */}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#F59E0B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🧾 PPh 21 (Income Tax)
                              </div>
                              {[
                                { label: 'Annual Gross', value: p.grossSalary * 12 },
                                { label: 'PTKP', value: -p.ptkp },
                                { label: 'PKP (Taxable)', value: p.pkp },
                                { label: 'Annual Tax', value: p.pph21Annual },
                                { label: 'Monthly PPh 21', value: p.pph21Monthly, highlight: true },
                              ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color-light, var(--border-color))' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                  <span style={{ fontWeight: item.highlight ? 700 : 500, color: item.highlight ? '#F59E0B' : 'inherit' }}>
                                    {item.value < 0 ? `(${formatCurrency(-item.value)})` : formatCurrency(item.value)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* BPJS */}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#3B82F6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                🛡️ BPJS Deductions
                              </div>
                              {[
                                { label: 'BPJS Kesehatan (1%)', value: p.bpjsKesEmployee },
                                { label: 'BPJS JHT (2%)', value: p.bpjsJHTEmployee },
                                { label: 'BPJS JP (1%)', value: p.bpjsJPEmployee },
                              ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color-light, var(--border-color))' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                  <span style={{ fontWeight: 500 }}>{formatCurrency(item.value)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#3B82F6' }}>
                                <span>Total BPJS Employee</span>
                                <span>{formatCurrency(p.bpjsKesEmployee + p.bpjsJHTEmployee + p.bpjsJPEmployee)}</span>
                              </div>
                              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800 }}>
                                  <span style={{ color: 'var(--text-primary)' }}>Total Deductions</span>
                                  <span style={{ color: '#EF4444' }}>{formatCurrency(p.totalDeductions)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                                  <span style={{ color: '#10B981' }}>Net Pay</span>
                                  <span style={{ color: '#10B981' }}>{formatCurrency(p.netSalary)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td colSpan={3}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={15} /> {payrollSummary.count} Employees Total</span></td>
                <td></td>
                <td style={{ color: '#F59E0B' }}>{formatCurrency(payrollSummary.totalPPh21)}</td>
                <td style={{ color: '#3B82F6' }}>{formatCurrency(payrollSummary.totalBPJS)}</td>
                <td style={{ color: '#EF4444' }}>-{formatCurrency(payrollSummary.totalDeductions)}</td>
                <td style={{ color: '#10B981', fontSize: '1rem' }}>{formatCurrency(payrollSummary.totalNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Detail Table ── */}
      {activeTab === 'detail' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base</th>
                <th>Transport</th>
                <th>Meal</th>
                <th>Position</th>
                <th>OT</th>
                <th style={{ color: '#10B981' }}>Gross</th>
                <th style={{ color: '#F59E0B' }}>PPh 21</th>
                <th style={{ color: '#3B82F6' }}>BPJS Kes.</th>
                <th style={{ color: '#3B82F6' }}>BPJS JHT</th>
                <th style={{ color: '#3B82F6' }}>BPJS JP</th>
                <th style={{ color: '#10B981' }}>Net Pay</th>
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
                        <div className="table-sub">{p.bank} •••{p.bankAccount?.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(p.baseSalary)}</td>
                  <td>{formatCurrency(p.transportAllowance)}</td>
                  <td>{formatCurrency(p.mealAllowance)}</td>
                  <td>{formatCurrency(p.positionAllowance)}</td>
                  <td style={{ color: p.overtime > 0 ? '#8B5CF6' : 'var(--text-muted)' }}>
                    {p.overtime > 0 ? formatCurrency(p.overtime) : '—'}
                  </td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>{formatCurrency(p.grossSalary)}</td>
                  <td style={{ color: '#F59E0B' }}>{formatCurrency(p.pph21Monthly)}</td>
                  <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsKesEmployee)}</td>
                  <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsJHTEmployee)}</td>
                  <td style={{ color: '#3B82F6' }}>{formatCurrency(p.bpjsJPEmployee)}</td>
                  <td><span style={{ fontWeight: 800, color: '#10B981' }}>{formatCurrency(p.netSalary)}</span></td>
                  <td><span className="badge info">Draft</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
