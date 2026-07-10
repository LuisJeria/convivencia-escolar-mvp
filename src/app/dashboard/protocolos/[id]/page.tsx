import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { INCIDENT_TYPES, ROLES_CAN_APPROVE } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IncidentTimeline } from "./timeline"
import { ExternalReportsSection } from "./external-reports"
import { DisciplinaryMeasuresSection } from "./disciplinary-measures"
import { NotificationSection } from "./notifications"
import { getDemoUser } from "@/lib/auth"
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react"
import { RejectForm } from "./reject-form"
import { ApproveButton } from "./approve-button"

export const dynamic = "force-dynamic"

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await getDemoUser()
  if (!user) redirect("/login")

  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true } },
      assignee: { select: { name: true } },
      approvedBy: { select: { name: true } },
      rejectedBy: { select: { name: true } },
      involved: {
        include: {
          user: { select: { name: true, course: { select: { name: true } } } },
        },
      },
      steps: {
        orderBy: { order: "asc" },
      },
      externalReports: {
        include: {
          filedBy: { select: { name: true } },
        },
      },
      measures: {
        include: {
          createdBy: { select: { name: true } },
        },
      },
    },
  })

  if (!incident) {
    notFound()
  }

  const completedSteps = incident.steps.filter((s) => s.status === "COMPLETADO").length
  const totalSteps = incident.steps.length
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const businessDaysElapsed = incident.businessDaysElapsed || 0

  const canEdit = ["ADMIN", "ENCARGADO_CONVIVENCIA", "DIRECTOR"].includes(user.role)

  const needsExternalReport = incident.type === "VULNERACION_DERECHO" || incident.type === "CONSUMO_SUSTANCIAS"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
          <p className="text-muted-foreground">
            Reportado el {format(new Date(incident.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })} por {incident.reporter.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
            {INCIDENT_TYPES.find((t) => t.value === incident.type)?.label}
          </Badge>
          <Badge
            variant="secondary"
            className={
              incident.severity === "LEVE"
                ? "bg-green-100 text-green-800"
                : incident.severity === "MODERADO"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }
          >
            {incident.severity}
          </Badge>
          <Badge
            variant="secondary"
            className={
              incident.status === "REPORTADO"
                ? "bg-blue-100 text-blue-800"
                : incident.status === "EN_INVESTIGACION"
                  ? "bg-amber-100 text-amber-800"
                  : incident.status === "RESUELTO"
                    ? "bg-green-100 text-green-800"
                    : incident.status === "APELADO"
                      ? "bg-purple-100 text-purple-800"
                      : incident.status === "PENDIENTE_APROBACION"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-800"
            }
          >
            {incident.status === "REPORTADO"
              ? "Reportado"
              : incident.status === "EN_INVESTIGACION"
                ? "En Investigación"
                : incident.status === "RESUELTO"
                  ? "Resuelto"
                  : incident.status === "APELADO"
                    ? "Apelado"
                    : incident.status === "RESOLUCION_DEFINITIVA"
                      ? "Resolución Definitiva"
                      : incident.status === "CERRADO"
                        ? "Cerrado"
                        : incident.status === "PENDIENTE_APROBACION"
                          ? "Pendiente de Aprobación"
                          : incident.status}
          </Badge>
          {incident.status === "PENDIENTE_APROBACION" && ROLES_CAN_APPROVE.includes(user.role) && (
            <div className="flex gap-2">
              <ApproveButton incidentId={incident.id} />
              <RejectForm incidentId={incident.id} />
            </div>
          )}
        </div>
      </div>

      {incident.rejectionReason && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Caso rechazado por {incident.rejectedBy?.name}
            </p>
            <p className="text-sm text-red-700 mt-1">
              Razón: {incident.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {incident.approvedById && incident.status !== "CERRADO" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            Caso aprobado por {incident.approvedBy?.name}
          </p>
        </div>
      )}

      {needsExternalReport && incident.externalReports.length === 0 && canEdit && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Este tipo de caso requiere denuncia a entidades externas
            </p>
            <p className="text-xs text-amber-700">
              Según la normativa, los casos de {INCIDENT_TYPES.find((t) => t.value === incident.type)?.label.toLowerCase()} deben ser denunciados a PDI, Carabineros o Tribunal de Familia.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{progress}%</div>
              <p className="text-sm text-muted-foreground">Protocolo completado</p>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{completedSteps}/{totalSteps}</div>
              <p className="text-sm text-muted-foreground">Pasos completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {incident.steps.filter((s) => s.status === "PENDIENTE").length}
              </div>
              <p className="text-sm text-muted-foreground">Pasos pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className={businessDaysElapsed > 10 ? "border-red-200" : businessDaysElapsed > 5 ? "border-amber-200" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  businessDaysElapsed > 10
                    ? "text-red-600"
                    : businessDaysElapsed > 5
                      ? "text-amber-600"
                      : "text-blue-600"
                }`}
              >
                {businessDaysElapsed}
              </div>
              <p className="text-sm text-muted-foreground">
                Días hábiles desde denuncia
              </p>
              {incident.reportedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Denuncia: {format(new Date(incident.reportedAt), "dd/MM/yyyy")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pasos">
        <TabsList>
          <TabsTrigger value="pasos">Pasos del protocolo</TabsTrigger>
          <TabsTrigger value="involucrados">Personas involucradas</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="denuncias">Denuncias Externas</TabsTrigger>
          <TabsTrigger value="medidas">Medidas</TabsTrigger>
          <TabsTrigger value="detalle">Detalle del caso</TabsTrigger>
        </TabsList>

        <TabsContent value="pasos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Protocolo de actuación</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentTimeline
                incidentId={incident.id}
                steps={incident.steps}
                incidentStatus={incident.status}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="involucrados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personas involucradas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Rol en el caso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incident.involved.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.user.name}</TableCell>
                      <TableCell>{person.user.course?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            person.role === "AGRESOR"
                              ? "bg-red-100 text-red-800"
                              : person.role === "VICTIMA"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {person.role === "AGRESOR"
                            ? "Agresor"
                            : person.role === "VICTIMA"
                              ? "Víctima"
                              : "Testigo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <NotificationSection
            incidentId={incident.id}
            involved={incident.involved}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="denuncias" className="mt-4">
          <ExternalReportsSection
            incidentId={incident.id}
            reports={incident.externalReports}
            incidentType={incident.type}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="medidas" className="mt-4">
          <DisciplinaryMeasuresSection
            incidentId={incident.id}
            measures={incident.measures}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="detalle" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del caso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {incident.description}
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Reportado por: {incident.reporter.name}</p>
                {incident.assignee && <p>Asignado a: {incident.assignee.name}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
