"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { ROLE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { LogOut, Menu } from "lucide-react"
import type { DemoUser } from "@/lib/auth"
import { SidebarContent } from "./sidebar"

export function DashboardTopbar({ user }: { user: DemoUser }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  async function handleLogout() {
    await logout()
    setMobileOpen(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <header className="h-14 border-b bg-white flex items-center justify-between gap-2 px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium text-muted-foreground">
            {ROLE_LABELS[user.role] || user.role}
          </h2>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-8 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-1.5 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                  {user.courseName ? ` · ${user.courseName}` : ""}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 gap-0"
          showCloseButton={false}
        >
          <SidebarContent
            role={user.role}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
