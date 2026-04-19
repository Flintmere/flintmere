const VALID_LENGTHS = new Set([8, 12, 13, 14]);

export function isValidGtin(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(digits)) return false;
  if (!VALID_LENGTHS.has(digits.length)) return false;
  return modulo10(digits);
}

export function gtinLength(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[\s-]/g, '');
  return digits.length;
}

function modulo10(digits: string): boolean {
  const lastIndex = digits.length - 1;
  const checkDigit = Number(digits[lastIndex]);
  let sum = 0;
  for (let i = 0; i < lastIndex; i += 1) {
    const digit = Number(digits[i]);
    const position = lastIndex - i;
    const weight = position % 2 === 1 ? 3 : 1;
    sum += digit * weight;
  }
  const computed = (10 - (sum % 10)) % 10;
  return computed === checkDigit;
}
