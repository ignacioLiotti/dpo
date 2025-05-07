import * as React from "react"
import { Search, Command } from "lucide-react"
import { cn } from "@/utils/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showSearchIcon?: boolean
  showCommandIcon?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showSearchIcon = false, showCommandIcon = false, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-8 w-full relative justify-start items-center rounded-full border-none outline outline-outline outline-1 shadow bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          showSearchIcon ? "pl-9" : "pl-3",
          showCommandIcon ? "pr-16" : "pr-3",
          className
        )}
      >
        {showSearchIcon && (
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          type={type}
          ref={ref}
          className="w-full h-full bg-transparent outline-none"
          {...props}
        />
        {showCommandIcon && (
          <div className="absolute right-3 flex items-center gap-1 rounded-xl border-none px-1.5 py-0.5 text-xs text-muted-foreground bg-containerBackground/80 outline outline-outline outline-1 shadow" aria-hidden="true">
            <Command className="h-3 w-3" />
            F
          </div>
        )}
      </div >
    )
  }
)
Input.displayName = "Input"

export { Input }
