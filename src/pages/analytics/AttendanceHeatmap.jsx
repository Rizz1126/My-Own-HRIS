import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export default function AttendanceHeatmap() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/analytics/attendance-heatmap');
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

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading heatmap...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Attendance Heatmap</h1>
        <p className="page-subtitle">Visual overview of attendance rates by day and hour</p>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Activity Level:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 25, 50, 75, 100].map((level) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 16, height: 16, backgroundColor: `rgba(99, 102, 241, ${level / 100})`, borderRadius: '2px' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{level}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Day</th>
              {HOURS.map((h) => <th key={h} style={{ textAlign: 'center', fontSize: '0.7rem' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((dayData, dayIdx) => (
              <tr key={dayIdx}>
                <td className="font-semibold">{DAYS[dayIdx]}</td>
                {dayData.map((val, hourIdx) => {
                  const intensity = Math.min(val * 20, 100);
                  return (
                    <td key={hourIdx} style={{ padding: '2px' }}>
                      <div
                        className="heatmap-cell"
                        style={{ width: 24, height: 24, backgroundColor: `rgba(99, 102, 241, ${intensity / 100})`, margin: '0 auto', borderRadius: '2px' }}
                        title={`${DAYS[dayIdx]}, ${HOURS[hourIdx]}: ${val} check-ins`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
