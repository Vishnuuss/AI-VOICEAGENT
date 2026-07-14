"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  AudioWaveform,
  Calendar,
  LayoutDashboard,
  Mic,
  PhoneCall,
  Users,
} from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/call", label: "Live Call", icon: Mic },
  { href: "/calls", label: "Call History", icon: PhoneCall },
  { href: "/personas", label: "Agent Personas", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-svh w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:w-56">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3 md:px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <AudioWaveform className="size-4" />
        </div>
        <span className="hidden font-semibold tracking-tight md:inline">
          VaaniOS
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main navigation">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("size-4 shrink-0", active && "text-primary")}
              />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className="hidden text-xs text-muted-foreground md:block">
          Groq + Sarvam AI
          <br />
          Telugu &amp; Hinglish
        </p>
      </div>
    </aside>
  )
}
