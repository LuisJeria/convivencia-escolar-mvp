import Link from "next/link"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { INCIDENT_TYPES, INCIDENT_STATUSES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getDemoUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    MALTRATO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ACOSO_ESCOLAR: "bg-orange-100 text-orange-800 border-orange-200",
    AGRESION_FISICA: "bg-red-100 text-red-800 border-red-200",
    AGRESION_PSICOLOGICA: "bg-pink-100 text-pink-800 border-pink-200",
    CIBERACOSO: "bg-purple-100 text-purple-800 border-purple-200",
    DISCRIMINACION: "bg-blue-100 text-blue-800 border-blue-200",
    VULNERACION_DERECHO: "bg-red-100 text-red-800 border-red-200",
    CONSUMO_SUSTANCIAS: "bg-indigo-100 text-indigo-800 border-indigo-200",
  }
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
}

function getSeverityBadge(severity: string) {
  const colors: Record<string, string> = {
    LEVE: "bg-green-100 text-green-800",
    MODERADO: "bg-yellow-100 text-yellow-800",
    GRAVE: "bg-orange-100 text-orange-800",
    MUY_GRAVE: "bg-red-100 text-red-800",
  }
  return colors[severity] || ""
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    PENDIENTE_APROBACION: "bg-amber-100 text-amber-800",
    REPORTADO: "bg-blue-100 text-blue-800",
    EN_INVESTIGACION: "bg-amber-100 text-amber-800",
    RESUELTO: "bg-green-100 text-green-800",
    APELADO: "bg-purple-100 text-purple-800",
    RESOLUCION_DEFINITIVA: "bg-purple-100 text-purple-800",
    CERRADO: "bg-gray-100 text-gray-800",
  }
  return colors[status] || ""
}

export default async function ProtocolosPage() {
  const user = await getDemoUser()
  if (!user) redirect("/login")

  const where: Prisma.IncidentWhereInput = {}

  if (user.role === "ESTUDIANTE") {
    where.involved = { some: { userId: user.id } }
  }

  const allIncidents = await db.incident.findMany({
    where,
    include: {
      reporter: { select: { name: true, role: true } },
      assignee: { select: { name: true } },
      involved: {
        include: {
          user: { select: { name: true, course: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const pendingApproval = allIncidents.filter((i) => i.status === "PENDIENTE_APROBACION")
  const activeIncidents = allIncidents.filter((i) => i.status !== "PENDIENTE_APROBACION")

  const canCreate = ["ADMIN", "DIRECTOR", "ENCARGADO_CONVIVENCIA", "ORIENTADOR", "PROFESOR_JEFE", "DOCENTE"].includes(user.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocolos</h1>
          <p className="text-muted-foreground">Gestión de casos de convivencia escolar</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/protocolos/nuevo"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 hover:bg-primary/80 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nuevo caso
          </Link>
        )}
      </div>

      {pendingApproval.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-sm">
                {pendingApproval.length}
              </span>
              Casos pendientes de aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApproval.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">{incident.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{incident.reporter.name}</p>
                        <p className="text-xs text-muted-foreground">{incident.reporter.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeBadge(incident.type)}>
                        {INCIDENT_TYPES.find((t) => t.value === incident.type)?.label || incident.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(incident.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/protocolos/${incident.id}`}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg size-8 hover:bg-muted transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {activeIncidents.length} caso{activeIncidents.length !== 1 ? "s" : ""} activo{activeIncidents.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay casos registrados aún.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">{incident.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeBadge(incident.type)}>
                        {INCIDENT_TYPES.find((t) => t.value === incident.type)?.label || incident.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getSeverityBadge(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadge(incident.status)}>
                        {INCIDENT_STATUSES.find((s) => s.value === incident.status)?.label || incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(incident.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/protocolos/${incident.id}`}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg size-8 hover:bg-muted transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
