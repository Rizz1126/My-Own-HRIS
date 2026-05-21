/**
 * Indonesian Tax & BPJS Calculator
 * Uses TER (Tarif Efektif Rata-rata) method for PPh 21
 * BPJS with salary ceiling capped at Rp 12,000,000
 */

// TER PPh 21 — Category A: TK/0, TK/1 (single with 0-1 dependents)
const TER_CATEGORY_A = [
  { max: 5400000, rate: 0 },
  { max: 5650000, rate: 0.0025 },
  { max: 5950000, rate: 0.005 },
  { max: 6300000, rate: 0.0075 },
  { max: 6750000, rate: 0.01 },
  { max: 7500000, rate: 0.0125 },
  { max: 8550000, rate: 0.015 },
  { max: 9650000, rate: 0.0175 },
  { max: 10050000, rate: 0.02 },
  { max: 10350000, rate: 0.0225 },
  { max: 10700000, rate: 0.025 },
  { max: 11050000, rate: 0.03 },
  { max: 11600000, rate: 0.035 },
  { max: 12500000, rate: 0.04 },
  { max: 13750000, rate: 0.05 },
  { max: 15100000, rate: 0.06 },
  { max: 16950000, rate: 0.07 },
  { max: 19750000, rate: 0.08 },
  { max: 24150000, rate: 0.09 },
  { max: 26450000, rate: 0.10 },
  { max: 28000000, rate: 0.11 },
  { max: 30050000, rate: 0.12 },
  { max: 32400000, rate: 0.13 },
  { max: 35400000, rate: 0.14 },
  { max: 39100000, rate: 0.15 },
  { max: 43850000, rate: 0.16 },
  { max: 47800000, rate: 0.17 },
  { max: 51400000, rate: 0.18 },
  { max: 56300000, rate: 0.19 },
  { max: 62200000, rate: 0.20 },
  { max: 68600000, rate: 0.21 },
  { max: 77500000, rate: 0.22 },
  { max: 89000000, rate: 0.23 },
  { max: 103000000, rate: 0.24 },
  { max: 125000000, rate: 0.25 },
  { max: 157000000, rate: 0.26 },
  { max: 206000000, rate: 0.27 },
  { max: 337000000, rate: 0.28 },
  { max: 454000000, rate: 0.29 },
  { max: 550000000, rate: 0.30 },
  { max: 695000000, rate: 0.31 },
  { max: 910000000, rate: 0.32 },
  { max: 1400000000, rate: 0.33 },
  { max: Infinity, rate: 0.34 },
];

// TER PPh 21 — Category B: TK/2, TK/3, K/0, K/1
const TER_CATEGORY_B = [
  { max: 6200000, rate: 0 },
  { max: 6500000, rate: 0.0025 },
  { max: 6850000, rate: 0.005 },
  { max: 7300000, rate: 0.0075 },
  { max: 9200000, rate: 0.01 },
  { max: 10750000, rate: 0.015 },
  { max: 11250000, rate: 0.02 },
  { max: 11600000, rate: 0.025 },
  { max: 12600000, rate: 0.03 },
  { max: 13600000, rate: 0.04 },
  { max: 14950000, rate: 0.05 },
  { max: 16400000, rate: 0.06 },
  { max: 18450000, rate: 0.07 },
  { max: 21850000, rate: 0.08 },
  { max: 26000000, rate: 0.09 },
  { max: 27700000, rate: 0.10 },
  { max: 29350000, rate: 0.11 },
  { max: 31450000, rate: 0.12 },
  { max: 33950000, rate: 0.13 },
  { max: 37100000, rate: 0.14 },
  { max: 41100000, rate: 0.15 },
  { max: 45800000, rate: 0.16 },
  { max: 49500000, rate: 0.17 },
  { max: 53800000, rate: 0.18 },
  { max: 58500000, rate: 0.19 },
  { max: 64000000, rate: 0.20 },
  { max: 71000000, rate: 0.21 },
  { max: 80000000, rate: 0.22 },
  { max: 93000000, rate: 0.23 },
  { max: 109000000, rate: 0.24 },
  { max: 129000000, rate: 0.25 },
  { max: 163000000, rate: 0.26 },
  { max: 211000000, rate: 0.27 },
  { max: 374000000, rate: 0.28 },
  { max: 459000000, rate: 0.29 },
  { max: 555000000, rate: 0.30 },
  { max: 704000000, rate: 0.31 },
  { max: 957000000, rate: 0.32 },
  { max: 1405000000, rate: 0.33 },
  { max: Infinity, rate: 0.34 },
];

// TER PPh 21 — Category C: K/2, K/3
const TER_CATEGORY_C = [
  { max: 6600000, rate: 0 },
  { max: 6950000, rate: 0.0025 },
  { max: 7350000, rate: 0.005 },
  { max: 7800000, rate: 0.0075 },
  { max: 8850000, rate: 0.01 },
  { max: 9800000, rate: 0.0125 },
  { max: 10950000, rate: 0.015 },
  { max: 11200000, rate: 0.0175 },
  { max: 12050000, rate: 0.02 },
  { max: 12950000, rate: 0.03 },
  { max: 14150000, rate: 0.04 },
  { max: 15550000, rate: 0.05 },
  { max: 17050000, rate: 0.06 },
  { max: 19500000, rate: 0.07 },
  { max: 22700000, rate: 0.08 },
  { max: 26600000, rate: 0.09 },
  { max: 28100000, rate: 0.10 },
  { max: 30100000, rate: 0.11 },
  { max: 32600000, rate: 0.12 },
  { max: 35400000, rate: 0.13 },
  { max: 38900000, rate: 0.14 },
  { max: 43000000, rate: 0.15 },
  { max: 47400000, rate: 0.16 },
  { max: 51200000, rate: 0.17 },
  { max: 55800000, rate: 0.18 },
  { max: 60400000, rate: 0.19 },
  { max: 66700000, rate: 0.20 },
  { max: 74500000, rate: 0.21 },
  { max: 83200000, rate: 0.22 },
  { max: 95000000, rate: 0.23 },
  { max: 110000000, rate: 0.24 },
  { max: 134000000, rate: 0.25 },
  { max: 169000000, rate: 0.26 },
  { max: 221000000, rate: 0.27 },
  { max: 390000000, rate: 0.28 },
  { max: 463000000, rate: 0.29 },
  { max: 561000000, rate: 0.30 },
  { max: 709000000, rate: 0.31 },
  { max: 965000000, rate: 0.32 },
  { max: 1419000000, rate: 0.33 },
  { max: Infinity, rate: 0.34 },
];

/**
 * Determine TER category based on marital status and dependents
 * Category A: TK/0, TK/1 (single 0-1 dep)
 * Category B: TK/2, TK/3, K/0, K/1 (single 2-3 dep, married 0-1 dep)
 * Category C: K/2, K/3 (married 2-3 dep)
 */
function getTERCategory(maritalStatus, dependents) {
  const isMarried = maritalStatus === 'Married';
  if (!isMarried && dependents <= 1) return TER_CATEGORY_A;
  if (!isMarried && dependents >= 2) return TER_CATEGORY_B;
  if (isMarried && dependents <= 1) return TER_CATEGORY_B;
  return TER_CATEGORY_C;
}

/**
 * Calculate PPh 21 using TER method
 * @param {number} grossMonthly - Monthly gross income (salary + allowances)
 * @param {string} maritalStatus - 'Single' or 'Married'
 * @param {number} dependents - Number of dependents (0-3)
 * @returns {{ rate: number, amount: number }}
 */
export function calculatePPh21(grossMonthly, maritalStatus = 'Single', dependents = 0) {
  const terTable = getTERCategory(maritalStatus, dependents);
  const bracket = terTable.find((b) => grossMonthly <= b.max);
  const rate = bracket ? bracket.rate : 0.34;
  const amount = Math.round(grossMonthly * rate);
  return { rate, amount };
}

/**
 * BPJS Calculations
 * BPJS Kesehatan: 4% employer + 1% employee (cap Rp 12,000,000)
 * BPJS Ketenagakerjaan:
 *   JKK: 0.24% (employer)
 *   JKM: 0.30% (employer)
 *   JHT: 3.70% employer + 2.00% employee
 *   JP:  2.00% employer + 1.00% employee (cap Rp 10,042,300 for 2026)
 */
const BPJS_KES_CEILING = 12000000;
const BPJS_JP_CEILING = 10042300;

export function calculateBPJS(grossMonthly) {
  const kesCeiling = Math.min(grossMonthly, BPJS_KES_CEILING);
  const jpCeiling = Math.min(grossMonthly, BPJS_JP_CEILING);

  const kesEmployer = Math.round(kesCeiling * 0.04);
  const kesEmployee = Math.round(kesCeiling * 0.01);

  const jkk = Math.round(grossMonthly * 0.0024);
  const jkm = Math.round(grossMonthly * 0.003);
  const jhtEmployer = Math.round(grossMonthly * 0.037);
  const jhtEmployee = Math.round(grossMonthly * 0.02);
  const jpEmployer = Math.round(jpCeiling * 0.02);
  const jpEmployee = Math.round(jpCeiling * 0.01);

  return {
    kesehatan: { employer: kesEmployer, employee: kesEmployee, total: kesEmployer + kesEmployee },
    jkk,
    jkm,
    jht: { employer: jhtEmployer, employee: jhtEmployee, total: jhtEmployer + jhtEmployee },
    jp: { employer: jpEmployer, employee: jpEmployee, total: jpEmployer + jpEmployee },
    totalEmployer: kesEmployer + jkk + jkm + jhtEmployer + jpEmployer,
    totalEmployee: kesEmployee + jhtEmployee + jpEmployee,
  };
}

/**
 * Full remuneration calculation
 */
export function calculateRemuneration(salary, allowances = [], maritalStatus = 'Single', dependents = 0) {
  const totalAllowances = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const grossMonthly = salary + totalAllowances;
  const pph21 = calculatePPh21(grossMonthly, maritalStatus, dependents);
  const bpjs = calculateBPJS(grossMonthly);

  const totalDeductions = pph21.amount + bpjs.totalEmployee;
  const takeHomePay = grossMonthly - totalDeductions;

  return {
    salary,
    totalAllowances,
    grossMonthly,
    pph21,
    bpjs,
    totalDeductions,
    takeHomePay,
  };
}
