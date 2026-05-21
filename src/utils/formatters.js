export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatPercentage = (num) => {
  return `${num.toFixed(1)}%`;
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const daysUntil = (dateStr) => {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count > 0) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

export const formatHoursToHHMM = (decimalHours) => {
  if (!decimalHours) return '0h 0m';
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const parseTimeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const durationBetweenTimes = (start, end) => {
  if (!start || !end) return 0;
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  const diff = endMinutes - startMinutes;
  return diff >= 0 ? diff / 60 : (diff + 24 * 60) / 60;
};

export const formatTimeRange = (start, end, durationHours = null) => {
  if (!start || !end) return '—';
  const duration = durationHours !== null ? durationHours : durationBetweenTimes(start, end);
  return `${start} - ${end} (${formatHoursToHHMM(duration)})`;
};

export function calculateOvertimeRate(baseSalary, hours, isWeekend = false) {
  const hourlyRate = (baseSalary || 0) / 173;
  let total = 0;
  if (isWeekend) {
    for (let h = 1; h <= hours; h++) {
      if (h <= 8) total += 2 * hourlyRate;
      else if (h === 9) total += 3 * hourlyRate;
      else total += 4 * hourlyRate;
    }
  } else {
    for (let h = 1; h <= hours; h++) {
      if (h === 1) total += 1.5 * hourlyRate;
      else total += 2 * hourlyRate;
    }
  }
  return Math.round(total);
}

