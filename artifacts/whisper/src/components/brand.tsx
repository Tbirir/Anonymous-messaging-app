import { Link } from "wouter";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M4 9.5 16 4l12 5.5v13L16 28 4 22.5z" fill="hsl(var(--secondary))" />
      <path d="M4 9.5 16 17l12-7.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2" data-testid="link-home">
      <Mark className="h-7 w-7" />
      <span className="display text-2xl italic">whisper</span>
    </Link>
  );
}
