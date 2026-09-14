export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  return digits.startsWith('+') ? digits : `+${digits}`;
}
