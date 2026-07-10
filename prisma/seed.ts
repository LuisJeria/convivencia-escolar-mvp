import { PrismaClient } from "@prisma/client"
import { addBusinessDays } from "date-fns"

const prisma = new PrismaClient()

const PROTOCOL_STEPS_BY_TYPE: Record<string, { order: number; name: string; description: string; businessDaysDeadline: number }[]> = {
  MALTRATO: [
    { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificación a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual.", businessDaysDeadline: 3 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la versión del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones de la investigación.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento 15 días", description: "Realizar seguimiento a los 15 días para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  ACOSO_ESCOLAR: [
    { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificación a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual.", businessDaysDeadline: 2 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la versión del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente.", businessDaysDeadline: 5 },
    { order: 5, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones de la investigación.", businessDaysDeadline: 7 },
    { order: 6, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 7, name: "Seguimiento 15 días", description: "Realizar seguimiento a los 15 días para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
    { order: 8, name: "Seguimiento 30 días", description: "Realizar seguimiento a los 30 días para verificar la efectividad de las medidas.", businessDaysDeadline: 40 },
  ],
  VULNERACION_DERECHO: [
    { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificación a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual.", businessDaysDeadline: 2 },
    { order: 3, name: "Denuncia a entidad externa", description: "Presentar denuncia ante PDI, Carabineros de Chile o Tribunal de Familia según corresponda.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones de la investigación.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento", description: "Realizar seguimiento para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  CONSUMO_SUSTANCIAS: [
    { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificación a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con el estudiante", description: "Recopilar el relato del estudiante involucrado.", businessDaysDeadline: 2 },
    { order: 3, name: "Derivación a redes de salud / Denuncia", description: "Derivación a centros de salud o presentación de denuncia según corresponda.", businessDaysDeadline: 3 },
    { order: 4, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones.", businessDaysDeadline: 7 },
    { order: 5, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 6, name: "Seguimiento", description: "Realizar seguimiento para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
  default: [
    { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente.", businessDaysDeadline: 0 },
    { order: 1, name: "Notificación a apoderados y estudiantes", description: "Informar a los apoderados y estudiantes involucrados sobre el caso (sujetos de derecho).", businessDaysDeadline: 1 },
    { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual.", businessDaysDeadline: 3 },
    { order: 3, name: "Entrevista con el agresor", description: "Recopilar la versión del agresor en entrevista individual.", businessDaysDeadline: 3 },
    { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente.", businessDaysDeadline: 5 },
    { order: 5, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones de la investigación.", businessDaysDeadline: 7 },
    { order: 6, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde.", businessDaysDeadline: 10 },
    { order: 7, name: "Seguimiento", description: "Realizar seguimiento a los 15-30 días para verificar la efectividad de las medidas.", businessDaysDeadline: 25 },
  ],
}

function getStepsForType(type: string) {
  return PROTOCOL_STEPS_BY_TYPE[type] || PROTOCOL_STEPS_BY_TYPE.default
}

async function main() {
  console.log("Seeding database...")

  await prisma.appeal.deleteMany()
  await prisma.externalReport.deleteMany()
  await prisma.disciplinaryMeasure.deleteMany()
  await prisma.pointTransaction.deleteMany()
  await prisma.protocolStep.deleteMany()
  await prisma.incidentInvolved.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.user.deleteMany()
  await prisma.course.deleteMany()

  const cursos = await Promise.all([
    prisma.course.create({ data: { name: "1° Básico A", level: 1, points: 45 } }),
    prisma.course.create({ data: { name: "3° Básico A", level: 3, points: 70 } }),
    prisma.course.create({ data: { name: "6° Básico A", level: 6, points: 35 } }),
    prisma.course.create({ data: { name: "1° Medio A", level: 9, points: 90 } }),
    prisma.course.create({ data: { name: "3° Medio A", level: 11, points: 25 } }),
  ])

  const admin = await prisma.user.create({
    data: { name: "María González", email: "admin@colegio.cl", role: "ADMIN" },
  })

  const director = await prisma.user.create({
    data: { name: "Roberto Sánchez", email: "director@colegio.cl", role: "DIRECTOR" },
  })

  const encargado = await prisma.user.create({
    data: { name: "Carlos Muñoz", email: "encargado@colegio.cl", role: "ENCARGADO_CONVIVENCIA" },
  })

  const orientador = await prisma.user.create({
    data: { name: "Lucía Pérez", email: "orientador@colegio.cl", role: "ORIENTADOR" },
  })

  const inspector = await prisma.user.create({
    data: { name: "Roberto Vega", email: "inspector@colegio.cl", role: "INSPECTOR" },
  })

  const profesorJefe = await prisma.user.create({
    data: { name: "Juan Rivera", email: "profesor.jefe@colegio.cl", role: "PROFESOR_JEFE", courseId: cursos[3].id },
  })

  const docente1 = await prisma.user.create({
    data: { name: "Ana Soto", email: "docente1@colegio.cl", role: "DOCENTE" },
  })

  const docente2 = await prisma.user.create({
    data: { name: "Pedro Rivas", email: "docente2@colegio.cl", role: "DOCENTE" },
  })

  type EstudianteSeed = Awaited<ReturnType<typeof prisma.user.create>>
  const estudiantes: Record<string, EstudianteSeed[]> = {}
  const nombres = [
    "Benjamín", "Sofía", "Martín", "Isidora", "Vicente", "Emilia", "Mateo", "Josefa",
    "Lucas", "Antonia", "Diego", "Fernanda", "Nicolás", "Catalina", "Tomás",
  ]

  for (let i = 0; i < cursos.length; i++) {
    estudiantes[cursos[i].id] = []
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j
      const e = await prisma.user.create({
        data: {
          name: nombres[idx],
          email: `estudiante${idx + 1}@colegio.cl`,
          role: "ESTUDIANTE",
          courseId: cursos[i].id,
        },
      })
      estudiantes[cursos[i].id].push(e)
    }
  }

  await prisma.user.create({
    data: { name: "Carolina Díaz", email: "apoderado1@colegio.cl", role: "APODERADO" },
  })
  await prisma.user.create({
    data: { name: "Roberto Flores", email: "apoderado2@colegio.cl", role: "APODERADO" },
  })

  const allEstudiantes = Object.values(estudiantes).flat()

  const createSteps = (incidentId: string, type: string, fromOrder: number, reportedAt: Date) => {
    const stepsTemplate = getStepsForType(type)
    return stepsTemplate.map(step => ({
      incidentId,
      order: step.order,
      name: step.name,
      description: step.description,
      businessDaysDeadline: step.businessDaysDeadline,
      deadlineDate: addBusinessDays(reportedAt, step.businessDaysDeadline),
    }))
  }

  const incidente1 = await prisma.incident.create({
    data: {
      title: "Discusión en el recreo con insultos",
      type: "MALTRATO",
      severity: "LEVE",
      status: "RESUELTO",
      description: "Durante el recreo del día lunes, dos estudiantes de 1° básico discutieron por un juguete, intercambiando insultos leves. Un docente auxiliar intervino de inmediato.",
      reporterId: docente1.id,
      assigneeId: encargado.id,
      reportedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      businessDaysElapsed: 20,
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente1.id, userId: estudiantes[cursos[0].id][0].id, role: "AGRESOR", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: true, guardianNotifiedAt: new Date() },
      { incidentId: incidente1.id, userId: estudiantes[cursos[0].id][1].id, role: "VICTIMA", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: true, guardianNotifiedAt: new Date() },
    ],
  })

  const steps1 = createSteps(incidente1.id, "MALTRATO", 0, incidente1.reportedAt!)
  for (let i = 0; i < steps1.length; i++) {
    await prisma.protocolStep.create({
      data: {
        ...steps1[i],
        status: i < 6 ? "COMPLETADO" : "PENDIENTE",
        completedAt: i < 6 ? new Date() : null,
      },
    })
  }

  await prisma.disciplinaryMeasure.create({
    data: {
      incidentId: incidente1.id,
      type: "AMONESTACION",
      description: "Amonestación escrita al agresor",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdById: encargado.id,
    },
  })

  const incidente2 = await prisma.incident.create({
    data: {
      title: "Exclusión reiterada en trabajos grupales",
      type: "ACOSO_ESCOLAR",
      severity: "MODERADO",
      status: "EN_INVESTIGACION",
      description: "Estudiante de 1° medio ha sido excluido sistemáticamente de grupos de trabajo durante las últimas 3 semanas. El estudiante reportó sentirse aislado por sus compañeros.",
      reporterId: docente2.id,
      assigneeId: encargado.id,
      reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      businessDaysElapsed: 5,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][1].id, role: "AGRESOR", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: false },
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][0].id, role: "VICTIMA", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: true, guardianNotifiedAt: new Date() },
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][2].id, role: "TESTIGO", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: false },
    ],
  })

  const steps2 = createSteps(incidente2.id, "ACOSO_ESCOLAR", 0, incidente2.reportedAt!)
  for (let i = 0; i < steps2.length; i++) {
    await prisma.protocolStep.create({
      data: {
        ...steps2[i],
        status: i < 3 ? "COMPLETADO" : "PENDIENTE",
        completedAt: i < 3 ? new Date() : null,
      },
    })
  }

  const incidente3 = await prisma.incident.create({
    data: {
      title: "Consumo de sustancias en el baño",
      type: "CONSUMO_SUSTANCIAS",
      severity: "MUY_GRAVE",
      status: "REPORTADO",
      description: "Se sorprendió a un estudiante de 3° medio consumiendo sustancias en el baño del establecimiento. Se Requiere derivación a redes de salud y posible denuncia.",
      reporterId: docente1.id,
      assigneeId: encargado.id,
      reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      businessDaysElapsed: 2,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente3.id, userId: estudiantes[cursos[4].id][0].id, role: "AGRESOR", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: true, guardianNotifiedAt: new Date() },
    ],
  })

  const steps3 = createSteps(incidente3.id, "CONSUMO_SUSTANCIAS", 0, incidente3.reportedAt!)
  for (let i = 0; i < steps3.length; i++) {
    await prisma.protocolStep.create({
      data: {
        ...steps3[i],
        status: i < 1 ? "COMPLETADO" : "PENDIENTE",
        completedAt: i < 1 ? new Date() : null,
      },
    })
  }

  await prisma.externalReport.create({
    data: {
      incidentId: incidente3.id,
      entity: "TRIBUNAL_FAMILIA",
      reportDate: new Date(),
      status: "PRESENTADA",
      description: "Denuncia presentada al Tribunal de Familia por consumo de sustancias de menor de edad",
      filedById: encargado.id,
    },
  })

  const incidente4 = await prisma.incident.create({
    data: {
      title: "Vulneración de derechos de estudiante",
      type: "VULNERACION_DERECHO",
      severity: "GRAVE",
      status: "APELADO",
      description: "Un docente habría vulnerado derechos de un estudiante durante clases. Se requiere investigación y denuncia a entidades correspondientes.",
      reporterId: orientador.id,
      assigneeId: encargado.id,
      reportedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      businessDaysElapsed: 12,
      resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente4.id, userId: estudiantes[cursos[2].id][0].id, role: "VICTIMA", studentNotified: true, studentNotifiedAt: new Date(), guardianNotified: true, guardianNotifiedAt: new Date() },
    ],
  })

  const steps4 = createSteps(incidente4.id, "VULNERACION_DERECHO", 0, incidente4.reportedAt!)
  for (let i = 0; i < steps4.length; i++) {
    await prisma.protocolStep.create({
      data: {
        ...steps4[i],
        status: i < 5 ? "COMPLETADO" : "PENDIENTE",
        completedAt: i < 5 ? new Date() : null,
      },
    })
  }

  await prisma.disciplinaryMeasure.create({
    data: {
      incidentId: incidente4.id,
      type: "SUSPENSION",
      description: "Suspensión del docente mientras se resuelve la investigación",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      suspensionPedagogicalPlan: "Se proporciona material pedagógico en formato digital para que el estudiante continúe con sus actividades académicas",
      suspensionMaterialDetails: "Textos digitales, guías de ejercicios y acceso a plataforma Classroom",
      createdById: director.id,
    },
  })

  await prisma.appeal.create({
    data: {
      incidentId: incidente4.id,
      appellantId: estudiantes[cursos[2].id][0].id,
      appellantType: "ESTUDIANTE",
      description: "El estudiante presenta apelación porque considera que la medida de suspensión del docente no es suficiente y solicita mayores garantías de protección.",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })

  const pointData = [
    { student: allEstudiantes[0], points: 15, reason: "Ayudó a un compañero a recoger sus materiales" },
    { student: allEstudiantes[1], points: 10, reason: "Medió en una discusión entre compañeros" },
    { student: allEstudiantes[3], points: 20, reason: "Incluyó a un compañero nuevo en el grupo de juego" },
    { student: allEstudiantes[6], points: 15, reason: "Excelente trato y respeto durante toda la semana" },
    { student: allEstudiantes[9], points: 25, reason: "Organizó actividad de bienvenida para estudiante nuevo" },
    { student: allEstudiantes[12], points: 10, reason: "Ayudó a explicar materia a compañero con dificultades" },
    { student: allEstudiantes[2], points: 5, reason: "Buen trato y companerismo" },
    { student: allEstudiantes[4], points: 20, reason: "Medió conflicto en el recreo" },
    { student: allEstudiantes[7], points: 15, reason: "Colaboró en mantener sala ordenada" },
    { student: allEstudiantes[10], points: 10, reason: "Ayudó a compañero lesionado" },
  ]

  for (const pt of pointData) {
    await prisma.pointTransaction.create({
      data: {
        studentId: pt.student.id,
        awardedById: docente1.id,
        points: pt.points,
        reason: pt.reason,
      },
    })
  }

  for (const curso of cursos) {
    const coursePoints = pointData
      .filter((pt) => estudiantes[curso.id].some((e) => e.id === pt.student.id))
      .reduce((sum, pt) => sum + pt.points, 0)

    if (coursePoints > 0) {
      await prisma.course.update({
        where: { id: curso.id },
        data: { points: curso.points + coursePoints },
      })
    }
  }

  console.log("Seed completado exitosamente.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
