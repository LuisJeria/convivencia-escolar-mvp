import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
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
