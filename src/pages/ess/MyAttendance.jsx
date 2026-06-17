import { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, Download, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

export default function MyAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.employeeId) return;
      try {
        setIsLoading(true);
        const data = await api.get(`/attendance/employee/${user.employeeId}`);
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [user]);

  // Calculations for summary
  const presentCount = records.filter(r => r.status === 'Present').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;

  const exportCSV = () => {
    const rows = [
      ['Date', 'Check In', 'Check Out', 'Status'],
      ...records.map(r => [
        r.date, 
        r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '-', 
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '-', 
        r.status
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `my-attendance.csv`;
    a.click();
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance history...</div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Attendance History</h1>
          <p className="page-subtitle">View your daily check-in and check-out logs</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-icon success"><CheckCircle size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">On Time / Present</div>
            <div className="kpi-value">{presentCount} Days</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><Clock size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Late</div>
            <div className="kpi-value">{lateCount} Days</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon danger"><XCircle size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Absent</div>
            <div className="kpi-value">{absentCount} Days</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map(record => {
                const checkIn = record.checkInTime ? new Date(record.checkInTime) : null;
                const checkOut = record.checkOutTime ? new Date(record.checkOutTime) : null;
                let duration = '—';
                if (checkIn && checkOut) {
                  const diffMs = checkOut.getTime() - checkIn.getTime();
                  const hours = Math.floor(diffMs / 3600000);
                  const mins = Math.floor((diffMs % 3600000) / 60000);
                  duration = `${hours}h ${mins}m`;
                }

                return (
                  <tr key={record.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {formatDate(record.date)}
                      </div>
                    </td>
                    <td>
                      {checkIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowRight size={14} style={{ color: 'var(--color-success)' }} />
                          {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {checkOut ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowRight size={14} style={{ color: 'var(--color-danger)', transform: 'rotate(180deg)' }} />
                          {checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{duration}</td>
                    <td>
                      <span className={`badge ${record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'danger'}`}>
                        <span className="badge-dot" />{record.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
