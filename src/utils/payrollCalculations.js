export function calculatePayrollForEmployee(emp, otRecord = null, index = 0) {
  const baseSalary = emp.baseSalary || 8000000;
  const transportAllowance = 500000;
  const mealAllowance = 750000;
  const positionAllowance = emp.position?.includes('Senior') || emp.position?.includes('Manager') || emp.position?.includes('Director')
    ? 1500000 : emp.position?.includes('Lead') ? 1000000 : 0;
  
  let overtime = 0;
  if (otRecord) {
    const hourlyRate = baseSalary / 173;
    let otTotal = 0;
    const hours = Number(otRecord.hours || otRecord.actualHours) || 0;
    if (otRecord.isWeekend) {
      for (let h = 1; h <= hours; h++) {
        if (h <= 8) otTotal += 2 * hourlyRate;
        else if (h === 9) otTotal += 3 * hourlyRate;
        else otTotal += 4 * hourlyRate;
      }
    } else {
      for (let h = 1; h <= hours; h++) {
        if (h === 1) otTotal += 1.5 * hourlyRate;
        else otTotal += 2 * hourlyRate;
      }
    }
    overtime = Math.round(otTotal);
  }
  
  const grossSalary = baseSalary + transportAllowance + mealAllowance + positionAllowance + overtime;

  // PPh 21 simplified
  const annualGross = grossSalary * 12;
  const positionDeduction = Math.min(annualGross * 0.05, 6000000);
  const bpjsJHTEmployee = baseSalary * 0.02;
  const bpjsJPEmployee = baseSalary * 0.01;
  const bpjsKesEmployee = baseSalary * 0.01;
  const annualNetto = annualGross - positionDeduction - (bpjsJHTEmployee + bpjsJPEmployee) * 12;
  
  // PTKP based on marital status
  let ptkp = 54000000; // Default TK/0
  if (emp.maritalStatus === 'K/0') ptkp = 58500000;
  else if (emp.maritalStatus === 'K/1') ptkp = 63000000;
  else if (emp.maritalStatus === 'K/2') ptkp = 67500000;
  else if (emp.maritalStatus === 'K/3') ptkp = 72000000;

  const pkp = Math.max(0, annualNetto - ptkp);

  let pph21Annual = 0;
  if (pkp > 0) {
    if (pkp <= 60000000) pph21Annual = pkp * 0.05;
    else if (pkp <= 250000000) pph21Annual = 3000000 + (pkp - 60000000) * 0.15;
    else if (pkp <= 500000000) pph21Annual = 3000000 + 28500000 + (pkp - 250000000) * 0.25;
    else pph21Annual = 3000000 + 28500000 + 62500000 + (pkp - 500000000) * 0.30;
  }
  const pph21Monthly = Math.round(pph21Annual / 12);

  // BPJS company portion
  const bpjsKesCompany = baseSalary * 0.04;
  const bpjsJHTCompany = baseSalary * 0.037;
  const bpjsJKKCompany = baseSalary * 0.0024;
  const bpjsJKMCompany = baseSalary * 0.003;
  const bpjsJPCompany = baseSalary * 0.02;

  const totalDeductions = pph21Monthly + bpjsJHTEmployee + bpjsJPEmployee + bpjsKesEmployee;
  const netSalary = grossSalary - totalDeductions;

  return {
    id: `PAY-${emp.id}`,
    employeeId: emp.id,
    employeeName: emp.name,
    department: emp.department?.name || 'N/A',
    position: emp.position,
    baseSalary,
    transportAllowance,
    mealAllowance,
    positionAllowance,
    overtime,
    grossSalary,
    pph21Monthly,
    bpjsKesEmployee,
    bpjsJHTEmployee,
    bpjsJPEmployee,
    bpjsKesCompany,
    bpjsJHTCompany,
    bpjsJKKCompany,
    bpjsJKMCompany,
    bpjsJPCompany,
    totalDeductions,
    netSalary,
    ptkp,
    pkp,
    pph21Annual,
    avatarColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    status: 'Draft',
    bankAccount: emp.bankAccountNumber || `${String(1200000000 + index * 7777).slice(0, 10)}`,
    bank: emp.bankName || ['BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB'][index % 5],
  };
}
