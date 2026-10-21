const dateLong = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const dateShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export const formatDateTime = (iso: string) => `${dateLong.format(new Date(iso))} · ${time.format(new Date(iso))}`;
export const formatDateTimeShort = (iso: string) => `${dateShort.format(new Date(iso))} • ${time.format(new Date(iso))}`;
export const formatDate = (iso: string) => dateShort.format(new Date(iso));
export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '☕'
  );
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'friend';
}
