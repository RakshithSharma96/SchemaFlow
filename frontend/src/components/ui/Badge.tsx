import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let variantClass = "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/80"
  if (variant === "secondary") variantClass = "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80"
  if (variant === "destructive") variantClass = "border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/80"
  if (variant === "outline") variantClass = "text-[var(--foreground)]"

  return (
    <div
      className={`inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 ${variantClass} ${className}`}
      {...props}
    />
  )
}

export { Badge }
