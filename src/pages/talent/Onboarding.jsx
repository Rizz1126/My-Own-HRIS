import { useState, useEffect } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { getInitials, formatDate } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitles, setNewTaskTitles] = useState({});
  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/talent/onboarding');
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await api.patch(`/talent/onboarding/${taskId}`, { isCompleted: !currentStatus });
      fetchData();
      toast.success(!currentStatus ? 'Task Completed' : 'Task Reopened', !currentStatus ? 'Onboarding task marked as done.' : 'Task has been marked as pending.');
    } catch (err) {
      toast.error('Update Failed', err.message);
    }
  };

  const handleAddTask = async (employeeId) => {
    const title = newTaskTitles[employeeId];
    if (!title?.trim()) return;
    try {
      await api.post(`/talent/onboarding`, { employeeId, title });
      setNewTaskTitles({ ...newTaskTitles, [employeeId]: '' });
      fetchData();
      toast.success('Task Added', 'New onboarding task has been added.');
    } catch (err) {
      toast.error('Add Failed', err.message);
    }
  };

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    try {
      await api.delete(`/talent/onboarding/${taskId}`);
      fetchData();
      toast.success('Task Deleted', 'Onboarding task has been removed.');
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading onboarding...</div>;
  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Onboarding</h1>
        <p className="page-subtitle">Track new hire onboarding progress</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {employees.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No active onboarding found</div>
        ) : employees.map((emp) => {
          const completedCount = emp.tasks.filter((t) => t.completed).length;
          const progress = Math.round((completedCount / emp.tasks.length) * 100);

          return (
            <div key={emp.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="table-avatar-img" style={{ background: emp.avatar, width: 44, height: 44 }}>{getInitials(emp.employeeName)}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{emp.employeeName}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{emp.position} • Starts {formatDate(emp.startDate)}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{progress}%</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{completedCount}/{emp.tasks.length} tasks</div>
                </div>
              </div>

              <div className="progress-bar-container" style={{ marginBottom: '16px' }}>
                <div className={`progress-bar-fill ${progress === 100 ? 'success' : ''}`} style={{ width: `${progress}%` }} />
              </div>

              <div>
                {emp.tasks.map((task) => (
                  <div key={task.id} className="checklist-item" onClick={() => handleToggleTask(task.id, task.completed)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={`checklist-checkbox ${task.completed ? 'checked' : ''}`}>
                        {task.completed && <Check size={12} />}
                      </div>
                      <span className={`checklist-text ${task.completed ? 'completed' : ''}`}>{task.title}</span>
                    </div>
                    <button className="btn-icon" onClick={(e) => handleDeleteTask(e, task.id)} style={{ color: 'var(--color-danger)', opacity: 0.7, padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add new task..."
                    value={newTaskTitles[emp.id] || ''}
                    onChange={(e) => setNewTaskTitles({ ...newTaskTitles, [emp.id]: e.target.value })}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddTask(emp.id); }}
                  />
                  <button className="btn btn-secondary" onClick={() => handleAddTask(emp.id)}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
