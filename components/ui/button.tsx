import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import Link from "next/link"


const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 leading-3 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        facha: cn(
          "inline-flex items-center justify-center bg-[#F8F7FC] text-blue-500 shadow-[inset_0_1px_0_#fff,inset_0_-2px_0_#3b82f621,0_0_0_1px_#3b82f64a,0_2px_7px_0px_#3b85f64a,0_0_0_3px_#3b82f614] font-medium",
          "relative transition-all duration-100 cursor-pointer will-change-transform ",
          "active:scale-[0.97] hover:bg-[#ece9f7] active:shadow-[inset_0_-1px_0_#fff,inset_0_2px_0_#3b82f621,0_0_0_1px_#3b82f64a,0_2px_7px_0px_#3b85f64a,0_0_0_3px_#3b82f614]"
        ),
        box: cn(
          "inline-flex flex-col items-center justify-center bg-containerBackground/40 text-neutral-600 shadow-simple font-medium",
          "relative transition-all duration-100 cursor-pointer will-change-transform ",
          "active:scale-[0.97] hover:bg-containerBackground/70"
        ),
        default: cn(
          "inline-flex items-center justify-center bg-black text-white shadow-simple font-medium",
          "relative transition-all duration-100 cursor-pointer will-change-transform ",
          "active:scale-[0.97] hover:shadow-simple-hover"
        ),
        secondary: cn(
          "inline-flex items-center justify-center bg-white text-black shadow border font-medium",
          "relative transition-all duration-100 cursor-pointer will-change-transform ",
          "active:translate-y-[1px] active:shadow-none hover:shadow-hover"
        ),
        tertiary: cn(
          "inline-flex items-center justify-center bg-white text-foreground-dim shadow border font-medium",
          "relative transition-all duration-100 cursor-pointer will-change-transform ",
          "hover:bg-input-foreground/10 active:translate-y-[1px] active:shadow-none"
        ),
        destructive:
          cn(
            "inline-flex items-center justify-center bg-destructive text-white shadow-simple-destructive font-medium",
            "relative transition-all duration-100 cursor-pointer will-change-transform ",
            "active:translate-y-[1px] hover:shadow-simple-destructive-hover"
          ),
        destructiveSecondary:
          cn(
            "bg-destructive/30 border border-destructive/30 shadow text-destructive-border",
            "hover:bg-destructive/90",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "active:bg-destructive/70 active:translate-y-[1px] active:shadow-none"
          ),
        success:
          cn(
            "inline-flex items-center justify-center bg-success text-white shadow-simple-success font-medium",
            "relative transition-all duration-100 cursor-pointer will-change-transform ",
            "active:translate-y-[1px] hover:shadow-simple-success-hover"
          ),
        successSecondary:
          cn(
            "bg-success/30 border border-success/30 shadow text-success-border",
            "hover:bg-success/90",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "active:bg-success/70 active:translate-y-[1px] active:shadow-none"
          ),
        alert:
          cn(
            "inline-flex items-center justify-center bg-alert text-white shadow-simple-alert font-medium",
            "relative transition-all duration-100 cursor-pointer will-change-transform ",
            "active:translate-y-[1px] hover:shadow-simple-alert-hover"
          ),
        alertSecondary:
          cn(
            "bg-alert/30 border border-alert/30 shadow text-alert-border",
            "hover:bg-alert/90",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "active:bg-alert/70 active:translate-y-[1px] active:shadow-none"
          ),
        outline:
          "border-2 border-input bg-background hover:bg-input-foreground/10 hover:text-accent-foreground",
        ghost: "hover:bg-input-foreground/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-4 pb-1 pt-[0.2rem]",
        sm: "h-6 rounded-md px-3",
        lg: "h-10 rounded-md px-8",
        icon: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  href?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = 'default', asChild = false, href, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    if (href) {
      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (props.onClick) {
          props.onClick(e);
        }
      }

      // handleClick();

      return (
        // @ts-ignore
        <Link href={href} onClick={handleClick}>
          <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
          />
        </Link>
      )
    }

    return (
      // @ts-ignore
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
