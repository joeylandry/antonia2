export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-md bg-primary font-display text-base text-primary-foreground"
      >
        A
      </span>
      <span className="font-display text-lg tracking-tight">Antonia Training</span>
    </span>
  );
}
