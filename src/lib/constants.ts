export const ROLES = {
  ADMIN: "ADMIN",
  DIRECTOR: "DIRECTOR",
  ENCARGADO_CONVIVENCIA: "ENCARGADO_CONVIVENCIA",
  ORIENTADOR: "ORIENTADOR",
  INSPECTOR: "INSPECTOR",
  PROFESOR_JEFE: "PROFESOR_JEFE",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ESTUDIANTE",
  APODERADO: "APODERADO",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  DIRECTOR: "Director",
  ENCARGADO_CONVIVENCIA: "Encargado de Convivencia",
  ORIENTADOR: "Orientador",
  INSPECTOR: "Inspector",
  PROFESOR_JEFE: "Profesor Jefe",
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
  { value: "VULNERACION_DERECHO", label: "Vulneración de Derechos" },
  { value: "CONSUMO_SUSTANCIAS", label: "Consumo de Sustancias" },
] as const

export const INCIDENT_SEVERITIES = [
  { value: "LEVE", label: "Leve" },
  { value: "MODERADO", label: "Moderado" },
  { value: "GRAVE", label: "Grave" },
  { value: "MUY_GRAVE", label: "Muy Grave" },
] as const

export const INCIDENT_STATUSES = [
  { value: "PENDIENTE_APROBACION", label: "Pendiente Aprobación" },
  { value: "REPORTADO", label: "Reportado" },
  { value: "EN_INVESTIGACION", label: "En Investigación" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "APELADO", label: "Apelado" },
  { value: "RESOLUCION_DEFINITIVA", label: "Resolución Definitiva" },
  { value: "CERRADO", label: "Cerrado" },
] as const

export const ROLES_NEED_APPROVAL = ["ORIENTADOR", "INSPECTOR", "PROFESOR_JEFE", "DOCENTE"]
export const ROLES_CAN_APPROVE = ["ADMIN", "DIRECTOR", "ENCARGADO_CONVIVENCIA"]

export const EXTERNAL_ENTITIES = [
  { value: "PDI", label: "PDI" },
  { value: "CARABINEROS", label: "Carabineros de Chile" },
  { value: "TRIBUNAL_FAMILIA", label: "Tribunal de Familia" },
  { value: "FISCALIA", label: "Fiscalía" },
  { value: "OTRA", label: "Otra" },
] as const

export const DISCIPLINARY_MEASURE_TYPES = [
  { value: "AMONESTACION", label: "Amonestación" },
  { value: "SUSPENSION", label: "Suspensión" },
  { value: "EXPULSION", label: "Expulsión" },
  { value: "OTRA", label: "Otra" },
] as const
