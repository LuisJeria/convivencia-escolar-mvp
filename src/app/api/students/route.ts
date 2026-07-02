import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoUser } from "@/lib/auth"

const ALLOWED_ROLES = new Set(["ADMIN", "ENCARGADO", "DOCENTE"])

export async function GET(request: NextRequest) {
  const user = await getDemoUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (!ALLOWED_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const query = request.nextUrl.searchParams.get("q") || ""

  if (query.length < 2) {
    return NextResponse.json([])
  }

  const students = await db.user.findMany({
    where: {
      role: "ESTUDIANTE",
      name: { contains: query },
    },
    select: {
      id: true,
      name: true,
      course: { select: { name: true } },
    },
    take: 10,
  })

  return NextResponse.json(
    students.map((s) => ({
      id: s.id,
      name: s.name,
      courseName: s.course?.name ?? null,
    }))
  )
}
