import { redirect } from "next/navigation"
import { getDemoUser } from "@/lib/auth"
import { DashboardSidebar } from "./sidebar"
import { DashboardTopbar } from "./topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getDemoUser()
  if (!user) {
    redirect("/login")
  }

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
