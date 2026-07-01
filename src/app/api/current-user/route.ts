import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  if (!cookie) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const user = JSON.parse(cookie.value)
  return NextResponse.json(user)
}
