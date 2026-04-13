export const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

export const normalizeName = (value: string): string => {
  const trimmed = normalizeWhitespace(value);
  return trimmed.replace(/[^a-zA-Z\s'\-]/g, '');
};

export const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const normalizePhoneNumber = (value: string): string => {
  const trimmed = value.trim();
  const withPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  return withPlus ? `+${digitsOnly}` : digitsOnly;
};

export const escapeHtml = (value: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (char) => map[char]);
};
