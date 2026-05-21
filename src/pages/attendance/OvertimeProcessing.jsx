import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle2, Download, Upload, CreditCard, AlertCircle } from 'lucide-react';
import { calculateOvertimeRate } from '../../utils/formatters';
import { formatDate, formatCurrency, getInitials, formatHoursToHHMM, formatTimeRange } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function OvertimeProcessing() {
  const [processedPayments, setProcessedPayments] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingEmployee, setProcessingEmployee] = useState(null);
  const [selectedDays, setSelectedDays] = useState({});
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentRef: '',
    autoRequestNumber: '',
    description: '',
    sessionPayment: '',
    workStatus: 'On Time',
    remark: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [batchesRes, requestsRes] = await Promise.all([
        api.get('/overtime/batches'),
        api.get('/overtime/requests')
      ]);
      setProcessedPayments(batchesRes);
      setOvertimeRequests(requestsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unpaidRecords = overtimeRequests.filter(r => r.status === 'Completed');
  const unpaidByEmployee = {};
  unpaidRecords.forEach(r => {
    const empId = r.employee?.id || r.employeeId;
    if (!unpaidByEmployee[empId]) {
      unpaidByEmployee[empId] = { employeeId: empId, employeeName: r.employee?.name || 'Unknown', baseSalary: 8000000, department: 'N/A', records: [] };
    }
    unpaidByEmployee[empId].records.push(r);
  });
  const employeeList = Object.values(unpaidByEmployee);

  const openProcessEmployee = (emp) => {
    const days = {};
    emp.records.forEach(r => { days[r.id] = true; });
    setSelectedDays(days);
    setProcessingEmployee(emp);
    setInvoiceFile(null);
    setPaymentForm({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentRef: `OT-${emp.employeeId}-${Date.now().toString().slice(-4)}`,
      autoRequestNumber: emp.records[0]?.requestNumber || emp.records[0]?.id || '',
      description: '',
      sessionPayment: '',
      workStatus: 'On Time',
      remark: '',
    });
    setShowBatchModal(false);
  };

  const toggleDay = (id) => {
    setSelectedDays(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSelectedTotal = () => {
    if (!processingEmployee) return 0;
    return processingEmployee.records
      .filter(r => selectedDays[r.id])
      .reduce((sum, r) => sum + calculateOvertimeRate(r.baseSalary, r.actualHours || r.plannedHours, r.isWeekend), 0);
  };

  const downloadInvoice = () => {
    if (!processingEmployee) return;
    const lines = [
      `Invoice for ${processingEmployee.employeeName}`,
      `Request number: ${paymentForm.autoRequestNumber}`,
      `Description: ${paymentForm.description}`,
      `Session Payment: ${paymentForm.sessionPayment}`,
      `Work Status: ${paymentForm.workStatus}`,
      `Total amount: ${formatCurrency(getSelectedTotal())}`,
      '',
      'Records:',
    ];
    processingEmployee.records.filter(r => selectedDays[r.id]).forEach(r => {
      lines.push(`- ${r.id}: ${r.date}, ${formatTimeRange(r.plannedStartTime, r.plannedEndTime, r.plannedHours)}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${processingEmployee.employeeName.replace(/\s+/g, '_')}_invoice.txt`;
    link.click();
  };

  const handleProcessPayment = async () => {
    const selectedCount = Object.values(selectedDays).filter(v => v).length;
    if (selectedCount === 0) {
      toast.warning('Selection Required', 'Please select at least one overtime record to process.');
      return;
    }

    try {
      const newPayment = await api.post('/overtime/batches', {
        period: paymentForm.sessionPayment || 'Custom Period',
        totalAmount: getSelectedTotal(),
        status: 'Processed',
        paymentDate: paymentForm.paymentDate,
        paymentRef: paymentForm.paymentRef || '—',
      });

      // Update selected records to 'Paid' or 'Processed' status
      const recordsToUpdate = processingEmployee.records.filter(r => selectedDays[r.id]);
      await Promise.all(recordsToUpdate.map(r => 
        api.patch(`/overtime/requests/${r.id}/status`, { status: 'Processed' })
      ));

      toast.success('Payment Processed', `${formatCurrency(newPayment.totalAmount)} for ${processingEmployee.employeeName} has been processed successfully.`);
      setProcessingEmployee(null);
      setInvoiceFile(null);
      setPaymentForm({ paymentDate: new Date().toISOString().split('T')[0], paymentRef: '', autoRequestNumber: '', description: '', sessionPayment: '', workStatus: 'On Time', remark: '' });
      fetchData();
    } catch (err) {
      toast.error('Processing Failed', err.message);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Overtime Processing</h1>
          <p className="page-subtitle">Processed payments history and batch creation for unpaid overtime.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBatchModal(true)}>
          <Plus size={18} /> Create New Batch Payment
        </button>
      </div>

      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Processed Payments History
        </h3>
        <div className="table-container" style={{ marginBottom: '24px' }}>
          <table className="data-table">
            <thead>
              <tr><th>Payment ID</th><th>Date Processed</th><th>Employee(s)</th><th>Total Amount</th><th>Status</th><th>Payment Ref</th></tr>
            </thead>
            <tbody>
              {processedPayments.map(b => (
                <tr key={b.id}>
                  <td className="font-semibold">{b.id}</td>
                  <td>{formatDate(b.createdDate)}</td>
                  <td><span className="badge neutral">{b.employeeName || `${b.employeeCount} employees`}</span></td>
                  <td className="font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(b.totalAmount)}</td>
                  <td>
                    <span className={`badge ${b.status === 'Processed' ? 'success' : 'warning'}`}>
                      <span className="badge-dot" />{b.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{b.paymentRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Batch Payment</h3>
              <button className="modal-close" onClick={() => setShowBatchModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Select employees with unprocessed overtime records, then proceed to payment details.</p>
              {employeeList.length === 0 ? (
                <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-success)' }}>
                  <CheckCircle2 size={24} /> All overtime entries have been processed.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Employee</th><th>Dept</th><th>Unpaid Records</th><th>Hours</th><th>Estimate</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {employeeList.map(emp => {
                        const unpaidRecs = emp.records.filter(r => !r.isPaid);
                        const totalH = unpaidRecs.reduce((sum, r) => sum + (r.actualHours || r.plannedHours || 0), 0);
                        const totalAmt = unpaidRecs.reduce((sum, r) => sum + calculateOvertimeRate(r.baseSalary, r.actualHours || r.plannedHours, r.isWeekend), 0);
                        return (
                          <tr key={emp.employeeId}>
                            <td>
                              <div className="table-avatar">
                                <div className="table-avatar-img">{getInitials(emp.employeeName)}</div>
                                <span className="table-name">{emp.employeeName}</span>
                              </div>
                            </td>
                            <td>{emp.department}</td>
                            <td><span className="badge warning">{unpaidRecs.length}</span></td>
                            <td>{formatHoursToHHMM(totalH)}</td>
                            <td className="font-semibold">{formatCurrency(totalAmt)}</td>
                            <td>
                              <button className="btn btn-sm btn-primary" onClick={() => openProcessEmployee({ ...emp, records: unpaidRecs })}>
                                <CreditCard size={14} /> Process Payment
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {processingEmployee && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '920px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: 'var(--color-primary)' }} />
                Process Payment: {processingEmployee.employeeName}
              </h3>
              <button className="modal-close" onClick={() => setProcessingEmployee(null)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Overtime Records</h4>
              <div className="table-container" style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '12px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input type="checkbox" checked={Object.values(selectedDays).every(v => v)} onChange={() => {
                          const allChecked = Object.values(selectedDays).every(v => v);
                          const newDays = {};
                          processingEmployee.records.forEach(r => { newDays[r.id] = !allChecked; });
                          setSelectedDays(newDays);
                        }} style={{ cursor: 'pointer' }} />
                      </th>
                      <th>Date</th>
                      <th>Request</th>
                      <th>Plan Time</th>
                      <th>Actual Time</th>
                      <th>Applied Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processingEmployee.records.map(r => {
                      const actualValue = r.actualHours || r.plannedHours;
                      const amt = calculateOvertimeRate(r.baseSalary, actualValue, r.isWeekend);
                      const planTime = r.plannedStartTime ? `${r.plannedStartTime} - ${r.plannedEndTime}` : '—';
                      const actualTime = r.actualStartTime && r.actualEndTime ? `${r.actualStartTime} - ${r.actualEndTime}` : '—';
                      return (
                        <tr key={r.id} style={{ opacity: selectedDays[r.id] ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                          <td><input type="checkbox" checked={!!selectedDays[r.id]} onChange={() => toggleDay(r.id)} style={{ cursor: 'pointer' }} /></td>
                          <td>{formatDate(r.date)}</td>
                          <td className="font-semibold">{r.id}</td>
                          <td>{planTime} ({formatHoursToHHMM(r.plannedHours)})</td>
                          <td>{actualTime === '—' ? '—' : `${actualTime} (${formatHoursToHHMM(actualValue)})`}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--color-info)' }}>{r.isWeekend ? 'Weekend / Holiday' : 'Weekday'}</td>
                          <td className="font-semibold">{formatCurrency(amt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={14} /> Base salary for rate calculation: {formatCurrency(processingEmployee.baseSalary)} / month.
              </div>

              <div style={{ background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>Payment Details</h4>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Payment Amount</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(getSelectedTotal())}</div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Auto Request Number</label>
                    <input type="text" className="form-input" style={{ background: 'var(--bg-secondary)' }} value={paymentForm.autoRequestNumber} readOnly />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Payment Date</label>
                    <input type="date" className="form-input" style={{ background: 'var(--bg-secondary)' }} value={paymentForm.paymentDate} onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))} />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Session Payment</label>
                    <input type="text" className="form-input" style={{ background: 'var(--bg-secondary)' }} placeholder="e.g. April Batch" value={paymentForm.sessionPayment} onChange={e => setPaymentForm(p => ({ ...p, sessionPayment: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Work Status</label>
                    <select className="form-input" value={paymentForm.workStatus} onChange={e => setPaymentForm(p => ({ ...p, workStatus: e.target.value }))}>
                      {['On Time', 'Extended', 'Overtime'].map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" rows={3} style={{ background: 'var(--bg-secondary)' }} placeholder="Add additional payment notes..." value={paymentForm.description} onChange={e => setPaymentForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="grid-2" style={{ gap: '16px', alignItems: 'start' }}>
                  <div className="form-group">
                    <label className="form-label">Upload Proof / Invoice</label>
                    <div style={{ position: 'relative', border: '2px dashed var(--color-primary-light)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                      <Upload size={24} style={{ color: 'var(--color-primary)', marginBottom: '8px' }} />
                      <input type="file" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{invoiceFile ? invoiceFile.name : 'Click to upload payment evidence'}</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-input form-textarea" rows={3} style={{ background: 'var(--bg-secondary)', height: '100px' }} placeholder="Add payment notes..." value={paymentForm.remark} onChange={e => setPaymentForm(p => ({ ...p, remark: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <button className="btn btn-secondary" type="button" onClick={downloadInvoice}>
                    <Download size={16} /> Download Invoice
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{invoiceFile ? `Selected: ${invoiceFile.name}` : 'No file uploaded yet'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
              <button className="btn btn-secondary" onClick={() => setProcessingEmployee(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessPayment} disabled={!paymentForm.paymentDate || getSelectedTotal() <= 0}>
                <CheckCircle2 size={16} /> Process Batch Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
