import { useState, useEffect } from 'react';
import { getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [shiftSchedule, setShiftSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedShifts, fetchedSchedules] = await Promise.all([
        api.get('/attendance/shifts'),
        api.get('/attendance/schedules'),
      ]);
      setShifts(fetchedShifts);

      // Group schedules by employee
      const employeeMap = {};
      fetchedSchedules.forEach(sched => {
        const empId = sched.employee?.id;
        if (!empId) return;
        if (!employeeMap[empId]) {
          employeeMap[empId] = {
            employeeId: empId,
            employeeName: sched.employee?.name || 'Unknown',
            department: sched.employee?.department || 'N/A',
            schedule: DAYS.map(d => ({ day: d, shift: null }))
          };
        }
        
        // Find which day of the week this date is
        const dateObj = new Date(sched.date);
        const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
        // Map to DAYS array: Mon=0, Tue=1 ... Sun=6
        const daysMap = [6, 0, 1, 2, 3, 4, 5]; // Shift JS getDay() to our DAYS array
        const dIdx = daysMap[dayIndex];
        
        if (dIdx >= 0 && dIdx < 7) {
          employeeMap[empId].schedule[dIdx].shift = sched.shift;
        }
      });

      setShiftSchedule(Object.values(employeeMap));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading shifts...</div>;
  }
  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Shift Schedule</h1>
        <p className="page-subtitle">Weekly shift assignments for all employees</p>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {shifts.length > 0 ? shifts.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: s.color || 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({s.startTime} - {s.endTime})</span>
              </div>
            )) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No shifts defined</div>
            )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Day Off</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              {DAYS.map(d => <th key={d} style={{ textAlign: 'center' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {shiftSchedule.map((emp) => (
              <tr key={emp.employeeId}>
                <td>
                  <div className="table-avatar">
                    <div className="table-avatar-img">{getInitials(emp.employeeName)}</div>
                    <div>
                      <div className="table-name">{emp.employeeName}</div>
                      <div className="table-sub">{emp.department}</div>
                    </div>
                  </div>
                </td>
                {emp.schedule.map((s, i) => (
                  <td key={i} style={{ textAlign: 'center' }}>
                    {s.shift ? (
                      <div style={{
                        background: `${s.shift.color}20`,
                        color: s.shift.color,
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}>
                        {s.shift.name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Off</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
