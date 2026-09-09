"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong disabled:bg-accent/50",
  secondary:
    "border border-line bg-white text-ink hover:border-ink-soft disabled:opacity-50",
  danger:
    "border border-danger/20 bg-white text-danger hover:border-danger/50 hover:bg-red-50 disabled:opacity-50",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`min-h-11 touch-manipulation rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${styles[variant]} ${className}`}
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
