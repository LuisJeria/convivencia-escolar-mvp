"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { PROTOCOL_STEPS } from "@/lib/constants"

export async function createIncident(data: {
  title: string
  type: string
  severity: string
  description: string
  reporterId: string
  involved: { userId: string; role: string }[]
}) {
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

export async function completeStep(stepId: string) {
  await db.protocolStep.update({
    where: { id: stepId },
    data: {
      status: "COMPLETADO",
      completedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function resolveIncident(incidentId: string) {
  await db.incident.update({
    where: { id: incidentId },
    data: { status: "RESUELTO" },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function closeIncident(incidentId: string) {
  await db.incident.update({
    where: { id: incidentId },
    data: { status: "CERRADO" },
  })

  revalidatePath("/dashboard/protocolos")
}

export async function awardPoints(data: {
  studentId: string
  awardedById: string
  points: number
  reason: string
}) {
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
