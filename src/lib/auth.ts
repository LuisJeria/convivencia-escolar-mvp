"use server"
import { cookies } from "next/headers"
import { z } from "zod"
import { db } from "@/lib/db"
import { ROLES } from "@/lib/constants"

export type DemoUser = {
  id: string
  name: string
  email: string
  role: string
  courseId?: string
  courseName?: string
}

const roleSchema = z.enum([
  ROLES.ADMIN,
  ROLES.ENCARGADO,
  ROLES.DOCENTE,
  ROLES.ESTUDIANTE,
  ROLES.APODERADO,
])

export async function loginDemo(role: string): Promise<DemoUser> {
  const parsed = roleSchema.safeParse(role)
  if (!parsed.success) {
    throw new Error("Rol inválido")
  }

  const user = await db.user.findFirst({
    where: { role: parsed.data },
    include: { course: { select: { name: true } } },
  })

  if (!user) {
    throw new Error(
      `No hay usuarios con rol ${role} en la base de datos. Ejecuta el seed primero.`
    )
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
    secure: process.env.NODE_ENV === "production",
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

export async function requireDemoUser(): Promise<DemoUser> {
  const user = await getDemoUser()
  if (!user) {
    throw new Error("No autenticado")
  }
  return user
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("demo_user")
}
