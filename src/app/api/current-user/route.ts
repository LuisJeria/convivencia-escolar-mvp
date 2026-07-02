import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getDemoUser } from "@/lib/auth"

export async function GET() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  if (!cookie) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  try {
    const user = await getDemoUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
  }
}
