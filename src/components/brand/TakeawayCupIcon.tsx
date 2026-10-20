/** Small line icon of the takeaway cup used in activity rows (matches the Lucide stroke style). */
export function TakeawayCupIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 6.5h14" />
      <path d="M6.5 6.5 7 4.2A1 1 0 0 1 8 3.5h8a1 1 0 0 1 1 .7l.5 2.3" />
      <path d="M6 6.5 7.6 20a1 1 0 0 0 1 .9h6.8a1 1 0 0 0 1-.9L18 6.5" />
      <path d="M6.7 11h10.6" />
    </svg>
  );
}
