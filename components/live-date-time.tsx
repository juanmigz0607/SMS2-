"use client"

import * as React from "react"
import { Calendar, Clock } from "lucide-react"

export function LiveDateTime() {
    const [time, setTime] = React.useState<Date | null>(null)

    React.useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    if (!time) {
        return (
            <div className="hidden sm:flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-400 font-medium">
                <Calendar className="size-3.5" />
                <span>Loading current date & time...</span>
            </div>
        )
    }

    const formattedDate = time.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    })

    const formattedTime = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    })

    return (
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs text-slate-700 font-medium shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="size-3.5 text-slate-500" />
                <span className="font-medium">{formattedDate}</span>
            </div>
            <span className="h-3 w-px bg-slate-250" />
            <div className="flex items-center gap-1.5 font-mono text-slate-900 font-semibold">
                <Clock className="size-3.5 text-blue-600" />
                <span>{formattedTime}</span>
            </div>
        </div>
    )
}
