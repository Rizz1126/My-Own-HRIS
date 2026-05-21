import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const EmployeeContext = createContext(null);

export function EmployeeProvider({ children }) {
  const { user, updateUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const refreshEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const data = await api.get('/employees');
      setEmployees(data);
      return data;
    } catch (err) {
      console.error('Failed to load employees:', err);
      return [];
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    refreshEmployees();
  }, []);

  const updateEmployee = async (employeeId, updates) => {
    const updatedEmployee = await api.patch(`/employees/${employeeId}`, updates);
    setEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, ...updatedEmployee } : emp));

    const currentEmployeeId = user?.employeeId ? String(user.employeeId) : null;
    const updatedId = updatedEmployee?.id ? String(updatedEmployee.id) : null;
    const updatedIdNumber = updatedEmployee?.idNumber ? String(updatedEmployee.idNumber) : null;

    if (currentEmployeeId && (currentEmployeeId === updatedId || currentEmployeeId === updatedIdNumber || currentEmployeeId === String(employeeId))) {
      updateUser({ name: updatedEmployee.name });
    }

    return updatedEmployee;
  };

  return (
    <EmployeeContext.Provider value={{
      employees,
      setEmployees,
      isLoadingEmployees,
      refreshEmployees,
      updateEmployee,
    }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (!context) throw new Error('useEmployees must be used within EmployeeProvider');
  return context;
}
