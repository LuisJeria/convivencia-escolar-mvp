"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"
import { db } from "@/lib/db"
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, ROLES_CAN_APPROVE } from "@/lib/constants"
import { addBusinessDays } from "date-fns"

const PROTOCOL_STEPS_BY_TYPE: Record<string, { order: number; name: string; description: string; businessDaysDeadline: number }[]> = {
  MALTRATO: [
    { order: 0, name: "Recepcion y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificacion a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la victima", description: "Recopilar el relato de la victima en entrevista individual.", businessDaysDeadline: 3 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la version del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigacion", description: "Redactar informe con los hallazgos y conclusiones de la investigacion.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolucion y medida disciplinaria", description: "Emitir resolucion formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento 15 dias", description: "Realizar seguimiento a los 15 dias para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  ACOSO_ESCOLAR: [
    { order: 0, name: "Recepcion y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificacion a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la victima", description: "Recopilar el relato de la victima en entrevista individual.", businessDaysDeadline: 2 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la version del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente.", businessDaysDeadline: 5 },
    { order: 5, name: "Informe de investigacion", description: "Redactar informe con los hallazgos y conclusiones de la investigacion.", businessDaysDeadline: 7 },
    { order: 6, name: "Resolucion y medida disciplinaria", description: "Emitir resolucion formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 7, name: "Seguimiento 15 dias", description: "Realizar seguimiento a los 15 dias para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
    { order: 8, name: "Seguimiento 30 dias", description: "Realizar seguimiento a los 30 dias para verificar la efectividad de las medidas.", businessDaysDeadline: 40 },
  ],
  VULNERACION_DERECHO: [
    { order: 0, name: "Recepcion y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificacion a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la victima", description: "Recopilar el relato de la victima en entrevista individual.", businessDaysDeadline: 2 },
    { order: 3, name: "Denuncia a entidad externa", description: "Presentar denuncia ante PDI, Carabineros de Chile o Tribunal de Familia segun corresponda.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigacion", description: "Redactar informe con los hallazgos y conclusiones de la investigacion.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolucion y medida disciplinaria", description: "Emitir resolucion formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento", description: "Realizar seguimiento para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  CONSUMO_SUSTANCIAS: [
    { order: 0, name: "Recepcion y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificacion a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con el estudiante", description: "Recopilar el relato del estudiante involucrado.", businessDaysDeadline: 2 },
    { order: 3, name: "Derivacion a redes de salud / Denuncia", description: "Derivacion a centros de salud o presentacion de denuncia segun corresponda.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigacion", description: "Redactar informe con los hallazgos y conclusiones.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolucion y medida disciplinaria", description: "Emitir resolucion formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento", description: "Realizar seguimiento para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  default: [
    { order: 0, name: "Recepcion y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificacion a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la victima", description: "Recopilar el relato de la victima en entrevista individual.", businessDaysDeadline: 3 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la version del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente.", businessDaysDeadline: 5 },
    { order: 5, name: "Informe de investigacion", description: "Redactar informe con los hallazgos y conclusiones de la investigacion.", businessDaysDeadline: 7 },
    { order: 6, name: "Resolucion y medida disciplinaria", description: "Emitir resolucion formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 7, name: "Seguimiento", description: "Realizar seguimiento a los 15-30 dias para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
}

function getStepsForType(type: string) {
  return PROTOCOL_STEPS_BY_TYPE[type] || PROTOCOL_STEPS_BY_TYPE.default
}

const incidentTypeValues = INCIDENT_TYPES.map((t) => t.value) as [string, ...string[]]
const incidentSeverityValues = INCIDENT_SEVERITIES.map((s) => s.value) as [string, ...string[]]

const createIncidentSchema = z.object({
  title: z.string().trim().min(3, "Minimo 3 caracteres").max(120),
  type: z.enum(incidentTypeValues, { message: "Tipo invalido" }),
  severity: z.enum(incidentSeverityValues, { message: "Gravedad invalida" }),
  description: z.string().trim().min(10, "Minimo 10 caracteres").max(5000),
  reporterId: z.string().cuid("reporterId invalido"),
  reporterRole: z.string(),
  involved: z
    .array(
      z.object({
        userId: z.string().cuid("userId invalido"),
        role: z.enum(["AGRESOR", "VICTIMA", "TESTIGO"]),
      })
    )
    .min(1, "Agrega al menos una persona involucrada"),
})

const NEEDS_APPROVAL_ROLES = ["ORIENTADOR", "PROFESOR_JEFE", "DOCENTE"]

const idSchema = z.string().cuid("id invalido")

const awardPointsSchema = z.object({
  studentId: z.string().cuid("studentId invalido"),
  awardedById: z.string().cuid("awardedById invalido"),
  points: z.number().int().min(1, "Minimo 1 punto").max(50, "Maximo 50 puntos"),
  reason: z.string().trim().min(3, "Minimo 3 caracteres").max(280),
})

const createExternalReportSchema = z.object({
  incidentId: z.string().cuid("incidentId invalido"),
  entity: z.enum(["PDI", "CARABINEROS", "TRIBUNAL_FAMILIA", "FISCALIA", "OTRA"]),
  reportDate: z.string(),
  description: z.string().trim().min(10, "Minimo 10 caracteres"),
  filedById: z.string().cuid("filedById invalido"),
})

const createDisciplinaryMeasureSchema = z.object({
  incidentId: z.string().cuid("incidentId invalido"),
  type: z.enum(["AMONESTACION", "SUSPENSION", "EXPULSION", "OTRA"]),
  description: z.string().trim().min(10, "Minimo 10 caracteres"),
  startDate: z.string(),
  endDate: z.string().optional(),
  suspensionPedagogicalPlan: z.string().optional(),
  suspensionMaterialDetails: z.string().optional(),
  createdById: z.string().cuid("createdById invalido"),
})

const notifyInvolvedSchema = z.object({
  incidentId: z.string().cuid("incidentId invalido"),
  involvedId: z.string().cuid("involvedId invalido"),
  type: z.enum(["student", "guardian"]),
})

export async function createIncident(input: unknown) {
  const parsed = createIncidentSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }
  const data = parsed.data

  const now = new Date()
  const stepsTemplate = getStepsForType(data.type)

  const needsApproval = NEEDS_APPROVAL_ROLES.includes(data.reporterRole)

  const incident = await db.incident.create({
    data: {
      title: data.title,
      type: data.type,
      severity: data.severity,
      description: data.description,
      reporterId: data.reporterId,
      status: needsApproval ? "PENDIENTE_APROBACION" : (data.involved.length >= 2 ? "EN_INVESTIGACION" : "REPORTADO"),
      reportedAt: now,
      businessDaysElapsed: 0,
      needsApproval,
      involved: {
        create: data.involved.map((inv) => ({
          ...inv,
          studentNotified: false,
          guardianNotified: false,
        })),
      },
      steps: {
        create: stepsTemplate.map((step) => ({
          order: step.order,
          name: step.name,
          description: step.description,
          businessDaysDeadline: step.businessDaysDeadline,
          deadlineDate: addBusinessDays(now, step.businessDaysDeadline),
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

export async function approveIncident(input: unknown) {
  try {
    const schema = z.object({
      incidentId: z.string(),
    })
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      console.error("Validation error:", parsed.error)
      throw new Error("Datos inválidos")
    }

    const cookieStore = await cookies()
    const cookie = cookieStore.get("demo_user")
    if (!cookie) throw new Error("No autenticado")
    const user = JSON.parse(cookie.value) as { id: string; role: string }

    if (!ROLES_CAN_APPROVE.includes(user.role)) {
      throw new Error("No tienes permisos para aprobar")
    }

    const incident = await db.incident.findUnique({
      where: { id: parsed.data.incidentId },
      include: { involved: true },
    })
    if (!incident) throw new Error("Incidente no encontrado")

    await db.incident.update({
      where: { id: parsed.data.incidentId },
      data: {
        status: incident.involved.length >= 2 ? "EN_INVESTIGACION" : "REPORTADO",
        needsApproval: false,
        approvedById: user.id,
      },
    })

    revalidatePath("/dashboard/protocolos")
    revalidatePath("/dashboard/protocolos/[id]", "page")
  } catch (error) {
    console.error("approveIncident error:", error)
    throw error
  }
}

export async function rejectIncident(input: unknown) {
  const schema = z.object({
    incidentId: z.string(),
    rejectionReason: z.string().min(1, "Debe ingresar la razón del rechazo"),
  })
  const parsed = schema.safeParse(input)
  if (!parsed.success) throw new Error("Datos inválidos")

  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  if (!cookie) throw new Error("No autenticado")
  const user = JSON.parse(cookie.value) as { id: string; role: string }

  if (!ROLES_CAN_APPROVE.includes(user.role)) {
    throw new Error("No tienes permisos para rechazar")
  }

  await db.incident.update({
    where: { id: parsed.data.incidentId },
    data: {
      status: "CERRADO",
      needsApproval: false,
      rejectedById: user.id,
      rejectionReason: parsed.data.rejectionReason,
    },
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

export async function createExternalReport(input: unknown) {
  const parsed = createExternalReportSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }
  const data = parsed.data

  const report = await db.externalReport.create({
    data: {
      incidentId: data.incidentId,
      entity: data.entity,
      reportDate: new Date(data.reportDate),
      description: data.description,
      filedById: data.filedById,
      status: "PRESENTADA",
    },
  })

  revalidatePath("/dashboard/protocolos")
  return report
}

export async function createDisciplinaryMeasure(input: unknown) {
  const parsed = createDisciplinaryMeasureSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }
  const data = parsed.data

  const measure = await db.disciplinaryMeasure.create({
    data: {
      incidentId: data.incidentId,
      type: data.type,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      suspensionPedagogicalPlan: data.type === "SUSPENSION" ? data.suspensionPedagogicalPlan : null,
      suspensionMaterialDetails: data.type === "SUSPENSION" ? data.suspensionMaterialDetails : null,
      createdById: data.createdById,
    },
  })

  revalidatePath("/dashboard/protocolos")
  return measure
}

export async function notifyInvolved(input: unknown) {
  const parsed = notifyInvolvedSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }
  const data = parsed.data

  const updateData: Record<string, Date | boolean> = {}
  if (data.type === "student") {
    updateData.studentNotified = true
    updateData.studentNotifiedAt = new Date()
  } else {
    updateData.guardianNotified = true
    updateData.guardianNotifiedAt = new Date()
  }

  await db.incidentInvolved.update({
    where: { id: data.involvedId },
    data: updateData,
  })

  revalidatePath("/dashboard/protocolos")
}

export async function createDenounceReport(input: unknown) {
  const schema = z.object({
    reporterId: z.string().cuid(),
    reporterRole: z.string(),
    reporterIsVictim: z.boolean(),
    title: z.string().trim().min(3, "Minimo 3 caracteres").max(120),
    description: z.string().trim().min(10, "Minimo 10 caracteres").max(5000),
    involvedName: z.string().optional(),
    involvedCourse: z.string().optional(),
  })

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }

  const data = parsed.data

  const report = await db.denounceReport.create({
    data: {
      reporterId: data.reporterId,
      reporterRole: data.reporterRole,
      reporterIsVictim: data.reporterIsVictim,
      title: data.title,
      description: data.description,
      involvedName: data.involvedName,
      involvedCourse: data.involvedCourse,
      status: "PENDIENTE",
    },
  })

  revalidatePath("/dashboard")
  return report
}

export async function getDenounceReports() {
  return db.denounceReport.findMany({
    where: { status: "PENDIENTE" },
    include: {
      reporter: { select: { name: true, email: true, role: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function reviewDenounceReport(input: unknown) {
  const schema = z.object({
    reportId: z.string().cuid(),
    action: z.enum(["APPROVE", "REJECT"]),
    reviewNote: z.string().optional(),
    reviewerId: z.string().cuid(),
  })

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ")
    throw new Error(`Datos invalidos: ${msg}`)
  }

  const data = parsed.data

  await db.denounceReport.update({
    where: { id: data.reportId },
    data: {
      status: data.action === "APPROVE" ? "APROBADO" : "RECHAZADO",
      reviewNote: data.reviewNote,
      reviewedById: data.reviewerId,
      reviewedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/denuncias")
  return { success: true }
}
