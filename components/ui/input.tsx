import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
                className
            )}
            {...props}
        />
    )
}

export { Input }
