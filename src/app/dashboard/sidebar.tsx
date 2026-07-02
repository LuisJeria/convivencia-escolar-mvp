"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"
import {
  LayoutDashboard,
  ShieldAlert,
  Trophy,
  Users,
  School,
  Settings,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react"

const ADMIN_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/protocolos", label: "Protocolos", icon: ShieldAlert },
  { href: "/dashboard/gamificacion", label: "Gamificación", icon: Trophy },
  { href: "#", label: "Usuarios", icon: Users, disabled: true },
  { href: "#", label: "Escuelas", icon: School, disabled: true },
  { href: "#", label: "Configuración", icon: Settings, disabled: true },
]

const ENCARGADO_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/protocolos", label: "Protocolos", icon: ShieldAlert },
  { href: "/dashboard/gamificacion", label: "Gamificación", icon: Trophy },
  { href: "#", label: "Reportes", icon: ChevronLeft, disabled: true },
]

const DOCENTE_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/protocolos", label: "Protocolos", icon: ShieldAlert },
  { href: "/dashboard/gamificacion", label: "Gamificación", icon: Trophy },
]

const ESTUDIANTE_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/gamificacion", label: "Gamificación", icon: Trophy },
  { href: "/dashboard/protocolos", label: "Mis Casos", icon: ShieldAlert },
]

const APODERADO_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/protocolos", label: "Casos", icon: ShieldAlert },
  { href: "/dashboard/gamificacion", label: "Gamificación", icon: Trophy },
]

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

function getLinks(role: string): NavLink[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_LINKS
    case "ENCARGADO":
      return ENCARGADO_LINKS
    case "DOCENTE":
      return DOCENTE_LINKS
    case "ESTUDIANTE":
      return ESTUDIANTE_LINKS
    case "APODERADO":
      return APODERADO_LINKS
    default:
      return DOCENTE_LINKS
  }
}

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const links = getLinks(role)

  async function handleLogout() {
    await logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="w-64 border-r bg-white flex flex-col shrink-0">
      <div className="flex items-center gap-2 h-14 px-4 border-b">
        <div className="p-1.5 rounded-lg bg-primary">
          <ShieldAlert className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="font-semibold text-sm leading-tight">
          Convivencia
          <br />
          Escolar
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            const commonClasses = cn(
              "inline-flex shrink-0 items-center justify-start gap-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all h-9 px-2.5 w-full",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-muted hover:text-foreground text-muted-foreground",
              link.disabled && "opacity-50 cursor-not-allowed"
            )

            if (link.disabled) {
              return (
                <span key={link.href} className={commonClasses}>
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </span>
              )
            }

            return (
              <Link key={link.href} href={link.href} className={commonClasses}>
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="border-t p-3 space-y-2">
        <button
          onClick={handleLogout}
          className="inline-flex shrink-0 items-center justify-start gap-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all h-9 px-2.5 w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cambiar de rol
        </button>
        <p className="text-xs text-muted-foreground text-center">
          MVP Demo v0.1
        </p>
      </div>
    </aside>
  )
}
