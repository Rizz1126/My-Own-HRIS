import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getInitials } from '../../utils/formatters';
import { api } from '../../utils/api';

const LEAVE_COLORS = {
  'Annual Leave': '#6366F1',
  'Sick Leave': '#EF4444',
  'Personal Leave': '#F59E0B',
  'Maternity Leave': '#EC4899',
  'Paternity Leave': '#3B82F6',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function LeaveCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/attendance/leaves');
      const formatted = data.map(l => ({
        ...l,
        employeeName: l.employee?.name || 'Unknown',
      }));
      setLeaves(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Map leave requests to calendar days
  const getLeaveForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.filter(lr => {
      const start = new Date(lr.startDate);
      const end = new Date(lr.endDate);
      const current = new Date(dateStr);
      return current >= start && current <= end && lr.status !== 'Rejected';
    });
  };

  const isToday = (day) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  // Generate calendar cells
  const cells = [];
  // Empty cells for days before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const selectedLeaves = selectedDay ? getLeaveForDay(selectedDay) : [];

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Leave Calendar</h1>
        <p className="page-subtitle">View all leave schedules at a glance</p>
      </div>

      {/* Calendar Card */}
      <div className="card">
        {/* Calendar Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <button className="btn btn-icon btn-secondary" onClick={prevMonth}><ChevronLeft size={20} /></button>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button className="btn btn-icon btn-secondary" onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>

        {/* Day Headers */}
        <div className="leave-calendar-grid">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="leave-calendar-header">
              {day}
            </div>
          ))}

          {/* Calendar Cells */}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="leave-calendar-cell empty" />;
            }
            const dayLeaves = getLeaveForDay(day);
            return (
              <div
                key={day}
                className={`leave-calendar-cell ${isToday(day) ? 'today' : ''} ${dayLeaves.length > 0 ? 'has-leave' : ''} ${selectedDay === day ? 'selected' : ''}`}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              >
                <span className="leave-calendar-day">{day}</span>
                {dayLeaves.length > 0 && (
                  <div className="leave-calendar-dots">
                    {dayLeaves.slice(0, 3).map((l, j) => (
                      <div
                        key={j}
                        className="leave-calendar-avatar"
                        style={{ background: LEAVE_COLORS[l.type] || '#6366F1' }}
                        title={`${l.employeeName} — ${l.type}`}
                      >
                        {getInitials(l.employeeName).charAt(0)}
                      </div>
                    ))}
                    {dayLeaves.length > 3 && (
                      <div className="leave-calendar-more">+{dayLeaves.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          {Object.entries(LEAVE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Popup */}
      {selectedDay !== null && selectedLeaves.length > 0 && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-container modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {MONTHS[currentMonth]} {selectedDay}, {currentYear}
              </h3>
              <button className="modal-close" onClick={() => setSelectedDay(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedLeaves.map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${LEAVE_COLORS[l.type] || '#6366F1'}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: `${LEAVE_COLORS[l.type] || '#6366F1'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', color: LEAVE_COLORS[l.type] || '#6366F1',
                    }}>
                      {getInitials(l.employeeName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.employeeName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.type}</div>
                    </div>
                    <span className={`badge ${l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}`} style={{ fontSize: '0.72rem' }}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
