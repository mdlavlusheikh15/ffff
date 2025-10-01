"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked'> & {
    checked?: boolean | 'indeterminate'
    indeterminate?: boolean
  }
>(({ className, checked, indeterminate, ...props }, ref) => {
  const innerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (innerRef.current) {
      innerRef.current.dataset.state = indeterminate ? 'indeterminate' : (checked ? 'checked' : 'unchecked');
      if (typeof indeterminate === 'boolean') {
        innerRef.current.indeterminate = indeterminate
      }
    }
  }, [indeterminate, checked])
  
  return (
    <CheckboxPrimitive.Root
      ref={innerRef}
      checked={indeterminate ? false : checked}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
