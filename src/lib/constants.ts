export const ROLES = {
  ADMIN: "ADMIN",
  ENCARGADO: "ENCARGADO",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ESTUDIANTE",
  APODERADO: "APODERADO",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ENCARGADO: "Encargado de Convivencia",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
  APODERADO: "Apoderado",
}

export const INCIDENT_TYPES = [
  { value: "MALTRATO", label: "Maltrato" },
  { value: "ACOSO_ESCOLAR", label: "Acoso Escolar" },
  { value: "AGRESION_FISICA", label: "Agresión Física" },
  { value: "AGRESION_PSICOLOGICA", label: "Agresión Psicológica" },
  { value: "CIBERACOSO", label: "Ciberacoso" },
  { value: "DISCRIMINACION", label: "Discriminación" },
] as const

export const INCIDENT_SEVERITIES = [
  { value: "LEVE", label: "Leve" },
  { value: "MODERADO", label: "Moderado" },
  { value: "GRAVE", label: "Grave" },
  { value: "MUY_GRAVE", label: "Muy Grave" },
] as const

export const INCIDENT_STATUSES = [
  { value: "REPORTADO", label: "Reportado" },
  { value: "EN_INVESTIGACION", label: "En Investigación" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CERRADO", label: "Cerrado" },
] as const

export const PROTOCOL_STEPS = [
  { order: 0, name: "Recepción y registro de la denuncia", description: "Documentar la denuncia recibida y abrir el caso formalmente." },
  { order: 1, name: "Notificación a apoderados", description: "Informar a los apoderados de los estudiantes involucrados." },
  { order: 2, name: "Entrevista con la víctima", description: "Recopilar el relato de la víctima en entrevista individual." },
  { order: 3, name: "Entrevista con el agresor", description: "Recopilar la versión del agresor en entrevista individual." },
  { order: 4, name: "Entrevista con testigos", description: "Entrevistar a los testigos identificados del incidente." },
  { order: 5, name: "Informe de investigación", description: "Redactar informe con los hallazgos y conclusiones." },
  { order: 6, name: "Resolución y medida disciplinaria", description: "Emitir resolución formal y aplicar medida disciplinaria." },
  { order: 7, name: "Seguimiento", description: "Realizar seguimiento a los 15-30 días para verificar efectividad." },
]
