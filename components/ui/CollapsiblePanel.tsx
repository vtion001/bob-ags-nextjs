import React from "react"
import { ChevronDown } from "lucide-react"

interface CollapsiblePanelProps {
  title: string
  icon?: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
  rightElement?: React.ReactNode
}

export default function CollapsiblePanel({
  title,
  icon,
  expanded,
  onToggle,
  children,
  className = "",
  rightElement
}: CollapsiblePanelProps) {
  return (
    <div className={className}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {rightElement}
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  )
}
