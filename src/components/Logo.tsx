export function Logo({ compact = false }: { compact?: boolean }) {
  return <span className="logo" aria-label="trace home">
    <svg viewBox="0 0 42 30" aria-hidden="true"><path d="M5 6h14v12c0 5 3 7 8 7h10"/><circle cx="5" cy="6" r="3"/><circle cx="37" cy="25" r="3"/></svg>
    {!compact && <span>trace</span>}
  </span>
}
