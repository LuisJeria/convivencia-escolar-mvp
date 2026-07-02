import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PROTOCOL_STEPS = [
  { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente." },
  { order: 1, name: "Notificación a apoderados", description: "Informar a los apoderados de los estudiantes involucrados sobre el caso." },
  { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual." },
  { order: 3, name: "Entrevista con el agresor", description: "Recopilar la versión del agresor en entrevista individual." },
  { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente." },
  { order: 5, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones de la investigación." },
  { order: 6, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria si corresponde." },
  { order: 7, name: "Seguimiento", description: "Realizar seguimiento a los 15-30 días para verificar la efectividad de las medidas." },
]

async function main() {
  console.log("Seeding database...")

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

  await prisma.user.create({
    data: { name: "María González", email: "admin@colegio.cl", role: "ADMIN" },
  })

  const encargado = await prisma.user.create({
    data: { name: "Carlos Muñoz", email: "encargado@colegio.cl", role: "ENCARGADO" },
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

  const incidente1 = await prisma.incident.create({
    data: {
      title: "Discusión en el recreo con insultos",
      type: "MALTRATO",
      severity: "LEVE",
      status: "RESUELTO",
      description: "Durante el recreo del día lunes, dos estudiantes de 1° básico discutieron por un juguete, intercambiando insultos leves. Un docente auxiliar intervino de inmediato.",
      reporterId: docente1.id,
      assigneeId: encargado.id,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente1.id, userId: estudiantes[cursos[0].id][0].id, role: "AGRESOR" },
      { incidentId: incidente1.id, userId: estudiantes[cursos[0].id][1].id, role: "VICTIMA" },
    ],
  })

  for (const step of PROTOCOL_STEPS.slice(0, 4)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente1.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "COMPLETADO",
        completedAt: new Date(),
      },
    })
  }

  for (const step of PROTOCOL_STEPS.slice(4, 6)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente1.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "COMPLETADO",
        completedAt: new Date(),
      },
    })
  }

  for (const step of PROTOCOL_STEPS.slice(6)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente1.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "PENDIENTE",
      },
    })
  }

  const incidente2 = await prisma.incident.create({
    data: {
      title: "Exclusión reiterada en trabajos grupales",
      type: "ACOSO_ESCOLAR",
      severity: "MODERADO",
      status: "EN_INVESTIGACION",
      description: "Estudiante de 1° medio ha sido excluido sistemáticamente de grupos de trabajo durante las últimas 3 semanas. El estudiante reportó sentirse aislado por sus compañeros.",
      reporterId: docente2.id,
      assigneeId: encargado.id,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][1].id, role: "AGRESOR" },
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][0].id, role: "VICTIMA" },
      { incidentId: incidente2.id, userId: estudiantes[cursos[3].id][2].id, role: "TESTIGO" },
    ],
  })

  for (const step of PROTOCOL_STEPS.slice(0, 3)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente2.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "COMPLETADO",
        completedAt: new Date(),
      },
    })
  }

  for (const step of PROTOCOL_STEPS.slice(3)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente2.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "PENDIENTE",
      },
    })
  }

  const incidente3 = await prisma.incident.create({
    data: {
      title: "Empujón en pasillo durante cambio de hora",
      type: "AGRESION_FISICA",
      severity: "LEVE",
      status: "REPORTADO",
      description: "Dos estudiantes de 3° medio forcejearon en el pasillo camino a la sala de clases. Un estudiante empujó al otro contra la pared sin causar lesiones visibles.",
      reporterId: docente1.id,
      assigneeId: encargado.id,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente3.id, userId: estudiantes[cursos[4].id][0].id, role: "AGRESOR" },
      { incidentId: incidente3.id, userId: estudiantes[cursos[4].id][1].id, role: "VICTIMA" },
    ],
  })

  for (const step of PROTOCOL_STEPS.slice(0, 2)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente3.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "COMPLETADO",
        completedAt: new Date(),
      },
    })
  }

  for (const step of PROTOCOL_STEPS.slice(2)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente3.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "PENDIENTE",
      },
    })
  }

  const incidente4 = await prisma.incident.create({
    data: {
      title: "Mensajes ofensivos en grupo de WhatsApp del curso",
      type: "CIBERACOSO",
      severity: "GRAVE",
      status: "REPORTADO",
      description: "Se detectó un grupo paralelo de WhatsApp donde algunos estudiantes publicaban mensajes ofensivos y memes burlándose de un compañero. El caso fue reportado por la madre del estudiante afectado.",
      reporterId: docente2.id,
      assigneeId: encargado.id,
    },
  })

  await prisma.incidentInvolved.createMany({
    data: [
      { incidentId: incidente4.id, userId: estudiantes[cursos[2].id][2].id, role: "AGRESOR" },
      { incidentId: incidente4.id, userId: estudiantes[cursos[2].id][0].id, role: "VICTIMA" },
      { incidentId: incidente4.id, userId: estudiantes[cursos[2].id][1].id, role: "TESTIGO" },
    ],
  })

  for (const step of PROTOCOL_STEPS.slice(0, 1)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente4.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "COMPLETADO",
        completedAt: new Date(),
      },
    })
  }

  for (const step of PROTOCOL_STEPS.slice(1)) {
    await prisma.protocolStep.create({
      data: {
        incidentId: incidente4.id,
        order: step.order,
        name: step.name,
        description: step.description,
        status: "PENDIENTE",
      },
    })
  }

  const pointData = [
    { student: allEstudiantes[0], points: 15, reason: "Ayudó a un compañero a recoger sus materiales" },
    { student: allEstudiantes[1], points: 10, reason: "Medió en una discusión entre compañeros" },
    { student: allEstudiantes[3], points: 20, reason: "Incluyó a un compañero nuevo en el grupo de juego" },
    { student: allEstudiantes[6], points: 15, reason: "Excelente trato y respeto durante toda la semana" },
    { student: allEstudiantes[9], points: 25, reason: "Organizó actividad de bienvenida para estudiante nuevo" },
    { student: allEstudiantes[12], points: 10, reason: "Ayudó a explicar materia a compañero con dificultades" },
    { student: allEstudiantes[2], points: 5, reason: "Buen trato y compañerismo" },
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
