import * as React from "react"

import { cn } from "@/lib/utils"
import { Search, SearchIcon } from "lucide-react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, hidden, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 text-foreground-secondary size-4" />
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl shadow border bg-background pl-10 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hidden && "max-h-8 max-w-12 w-8 border-none px-0 text-right justify-end items-center focus:border-input focus:border focus:bg-sky-50 focus:text-left ",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
