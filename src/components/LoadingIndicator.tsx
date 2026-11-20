export function Spinner({ className = 'size-4' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin ${className}`}
    />
  );
}

export function LoadingIndicator({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="inline-flex items-center gap-2">
        <Spinner />
        {label}
      </span>
    </div>
  );
}
