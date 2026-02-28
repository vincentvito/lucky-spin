"use client"

import { CircleHelp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InfoTooltipProps {
  text: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function InfoTooltip({ text, className, side = "top" }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        onClick={(e) => e.preventDefault()}
      >
        <CircleHelp className="h-3.5 w-3.5" />
        <span className="sr-only">More info</span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[240px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
