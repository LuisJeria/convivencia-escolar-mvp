import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ROLE_LABELS } from "@/lib/constants"
import { DashboardSidebar } from "./sidebar"
import { DashboardTopbar } from "./topbar"
import type { DemoUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")

  if (!cookie) {
    redirect("/login")
  }

  const user: DemoUser = JSON.parse(cookie.value)

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
