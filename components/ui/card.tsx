import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border bg-surface rounded-xl border p-5 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-muted mt-1 text-sm">{label}</div>
      {hint ? <div className="text-muted mt-0.5 text-xs">{hint}</div> : null}
    </Card>
  );
}
