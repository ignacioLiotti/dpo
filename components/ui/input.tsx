import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/utils"
import { Search } from "lucide-react"

const inputVariants = cva(
  "flex h-10 w-full rounded-xl border bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "pl-10 pr-3 shadow",
        cammo: "bg-transparent border-transparent hover:bg-background/5 hover:shadow-sm rounded-sm hover:border-input px-2 focus:bg-background focus:border-input disabled:opacity-100",
        cell: "bg-transparent border-transparent hover:bg-background/5 hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] rounded-none hover:border-input p-0 focus:bg-background focus:border-input text-center px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> {
  icon?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, icon = variant === "default", ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && <Search className="absolute left-4 text-foreground-secondary size-4" />}
        <input
          type={type}
          className={cn(inputVariants({ variant, className }), className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
