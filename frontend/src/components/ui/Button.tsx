import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Manual shadcn/ui tailwind mapping
    let variantClass = "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
    if (variant === "destructive") variantClass = "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
    if (variant === "outline") variantClass = "border border-[var(--input)] bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
    if (variant === "secondary") variantClass = "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80"
    if (variant === "ghost") variantClass = "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
    if (variant === "link") variantClass = "text-[var(--primary)] underline-offset-4 hover:underline"

    let sizeClass = "h-10 px-4 py-2"
    if (size === "sm") sizeClass = "h-9 rounded-md px-3"
    if (size === "lg") sizeClass = "h-11 rounded-md px-8"
    if (size === "icon") sizeClass = "h-10 w-10"

    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    return (
      <Comp
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
