import { cn } from "@/lib/cn";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = "Cargando" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full",
        "border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)]",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
