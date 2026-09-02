"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong disabled:bg-accent/50",
  secondary:
    "border border-line bg-white text-ink hover:border-ink-soft disabled:opacity-50",
  danger:
    "border border-transparent bg-white text-danger hover:border-danger/40 disabled:opacity-50",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}
