import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-border bg-surface text-ink hover:bg-canvas",
};

const SIZES: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

function classes(variant: Variant, size: Size, extra?: string): string {
  return [BASE, VARIANTS[variant], SIZES[size], extra]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

/**
 * A link styled as a button. Kept distinct from `Button` because navigation
 * must stay an anchor -- screen readers and middle-click both depend on it.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
