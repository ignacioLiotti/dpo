import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: "large" | "medium" | "small"
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "large", ...props }, ref) => {
  const sizes = {
    large: {
      root: "h-6 w-11",
      thumb: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
    },
    medium: {
      root: "h-5 w-9",
      thumb: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
    },
    small: {
      root: "h-4 w-7",
      thumb: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
    },
  }

  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        `peer inline-flex shrink-0 cursor-pointer items-center 
         rounded-full border-2 border-transparent transition-colors 
         focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-ring focus-visible:ring-offset-2 
         focus-visible:ring-offset-background disabled:cursor-not-allowed 
         disabled:opacity-50 data-[state=checked]:bg-input
         data-[state=unchecked]:bg-input-secondary ${sizes[size].root}`,
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          `pointer-events-none block rounded-full bg-background 
           shadow-lg ring-0 transition-transform ${sizes[size].thumb}`
        )}
      />
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = SwitchPrimitives.Root.displayName
export { Switch }