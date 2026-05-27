export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeCpf(value) {
  return onlyDigits(value).slice(0, 11);
}

export function toMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(2));
}

export function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || ''
  };
}
