"use server"
import { cookies } from "next/headers"

export type DemoUser = {
  id: string
  name: string
  email: string
  role: string
  courseId?: string
  courseName?: string
}

export async function loginDemo(role: string): Promise<DemoUser> {
  const { db } = await import("@/lib/db")

  const where: any = {}
  if (role === "ESTUDIANTE") {
    where.role = "ESTUDIANTE"
  } else if (role === "APODERADO") {
    where.role = "APODERADO"
  } else if (role === "DOCENTE") {
    where.role = "DOCENTE"
  } else if (role === "ENCARGADO") {
    where.role = "ENCARGADO"
  } else {
    where.role = "ADMIN"
  }

  const user = await db.user.findFirst({
    where,
    include: { course: { select: { name: true } } },
  })

  if (!user) {
    throw new Error(`No hay usuarios con rol ${role} en la base de datos. Ejecuta el seed primero.`)
  }

  const demoUser: DemoUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    courseId: user.courseId ?? undefined,
    courseName: user.course?.name,
  }

  const cookieStore = await cookies()
  cookieStore.set("demo_user", JSON.stringify(demoUser), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return demoUser
}

export async function getDemoUser(): Promise<DemoUser | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  if (!cookie) return null
  try {
    return JSON.parse(cookie.value) as DemoUser
  } catch {
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("demo_user")
}
