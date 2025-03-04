import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[hsl(230deg_30.5%_88.86%)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
