import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    { className, label, hint, error, id, ...rest },
    ref,
  ) {
    const reactId = useId();
    const inputId = id ?? reactId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-fg)]"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "h-11 w-full rounded-[var(--radius-input)] border px-3.5 text-sm",
            "bg-[var(--color-bg)] text-[var(--color-fg)]",
            "border-[var(--color-border-strong)] placeholder:text-[var(--color-fg-subtle)]",
            "focus:border-[var(--color-primary)] focus:outline-none",
            error && "border-[var(--color-accent-critical)]",
            className,
          )}
          {...rest}
        />
        {hint && !error ? (
          <p id={hintId} className="text-xs text-[var(--color-fg-muted)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            className="text-xs text-[var(--color-accent-critical)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
