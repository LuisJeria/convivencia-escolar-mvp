"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { PROTOCOL_STEPS, INCIDENT_TYPES, INCIDENT_SEVERITIES } from "@/lib/constants"

const incidentTypeValues = INCIDENT_TYPES.map((t) => t.value) as [string, ...string[]]
const incidentSeverityValues = INCIDENT_SEVERITIES.map((s) => s.value) as [string, ...string[]]

const createIncidentSchema = z.object({
  title: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
  type: z.enum(incidentTypeValues, { message: "Tipo inválido" }),
  severity: z.enum(incidentSeverityValues, { message: "Gravedad inválida" }),
  description: z.string().trim().min(10, "Mínimo 10 caracteres").max(5000),
  reporterId: z.string().cuid("reporterId inválido"),
  involved: z
    .array(
      z.object({
        userId: z.string().cuid("userId inválido"),
        role: z.enum(["AGRESOR", "VICTIMA", "TESTIGO"]),
      })
    )
    .min(1, "Agrega al menos una persona involucrada"),
})

const idSchema = z.string().cuid("id inválido")

const awardPointsSchema = z.object({
  studentId: z.string().cuid("studentId inválido"),
  awardedById: z.string().cuid("awardedById inválido"),
  points: z.number().int().min(1, "Mínimo 1 punto").max(50, "Máximo 50 puntos"),
  reason: z.string().trim().min(3, "Mínimo 3 caracteres").max(280),
})

export async function createIncident(input: unknown) {
  const parsed = createIncidentSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos inválidos: ${msg}`)
  }
  const data = parsed.data

  const incident = await db.incident.create({
    data: {
      title: data.title,
      type: data.type,
      severity: data.severity,
      description: data.description,
      reporterId: data.reporterId,
      status: data.involved.length >= 2 ? "EN_INVESTIGACION" : "REPORTADO",
      involved: {
        create: data.involved,
      },
      steps: {
        create: PROTOCOL_STEPS.map((step) => ({
          order: step.order,
          name: step.name,
          description: step.description,
        })),
      },
    },
  })

  revalidatePath("/dashboard/protocolos")
  return incident
}

export async function completeStep(input: unknown) {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) throw new Error("stepId inválido")

  await db.protocolStep.update({
    where: { id: parsed.data },
    data: {
      status: "COMPLETADO",
      completedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function resolveIncident(input: unknown) {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) throw new Error("incidentId inválido")

  await db.incident.update({
    where: { id: parsed.data },
    data: { status: "RESUELTO" },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function closeIncident(input: unknown) {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) throw new Error("incidentId inválido")

  await db.incident.update({
    where: { id: parsed.data },
    data: { status: "CERRADO" },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function awardPoints(input: unknown) {
  const parsed = awardPointsSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos inválidos: ${msg}`)
  }
  const data = parsed.data

  const transaction = await db.pointTransaction.create({
    data: {
      studentId: data.studentId,
      awardedById: data.awardedById,
      points: data.points,
      reason: data.reason,
    },
  })

  const student = await db.user.findUnique({
    where: { id: data.studentId },
    select: { courseId: true },
  })

  if (student?.courseId) {
    await db.course.update({
      where: { id: student.courseId },
      data: { points: { increment: data.points } },
    })
  }

  revalidatePath("/dashboard/gamificacion")
  return transaction
}
