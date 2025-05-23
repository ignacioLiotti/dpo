import * as React from "react"
import { cn } from "@/utils/utils"

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'cammo' | 'show-empty'
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const baseStyles = "w-full font-mono text-base bg-transparent border-none outline-none px-0 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"

    const variantStyles = {
      default: "border-b border-[#e5e7eb] focus:border-black transition-colors",
      cammo: "bg-transparent border-none outline-none shadow-none",
      'show-empty': cn(
        "border-b border-[#e5e7eb] focus:border-black transition-colors",
        !props.value && "bg-dashedInput"
      )
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    )
  }
)
CustomInput.displayName = "CustomInput"

export { CustomInput } 