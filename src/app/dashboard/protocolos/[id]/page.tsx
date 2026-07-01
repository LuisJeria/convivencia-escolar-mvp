import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IncidentTimeline } from "./timeline"
import type { DemoUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  const user: DemoUser = JSON.parse(cookie!.value)

  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true } },
      assignee: { select: { name: true } },
      involved: {
        include: {
          user: { select: { name: true, course: { select: { name: true } } } },
        },
      },
      steps: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!incident) {
    notFound()
  }

  const completedSteps = incident.steps.filter((s) => s.status === "COMPLETADO").length
  const totalSteps = incident.steps.length
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

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
          <Badge variant="secondary" className={
            incident.severity === "LEVE" ? "bg-green-100 text-green-800" :
            incident.severity === "MODERADO" ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }>
            {incident.severity}
          </Badge>
          <Badge variant="secondary" className={
            incident.status === "REPORTADO" ? "bg-blue-100 text-blue-800" :
            incident.status === "EN_INVESTIGACION" ? "bg-amber-100 text-amber-800" :
            incident.status === "RESUELTO" ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }>
            {incident.status === "REPORTADO" ? "Reportado" :
             incident.status === "EN_INVESTIGACION" ? "En Investigación" :
             incident.status === "RESUELTO" ? "Resuelto" :
             incident.status === "CERRADO" ? "Cerrado" : incident.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Tabs defaultValue="pasos">
        <TabsList>
          <TabsTrigger value="pasos">Pasos del protocolo</TabsTrigger>
          <TabsTrigger value="involucrados">Personas involucradas</TabsTrigger>
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
                canEdit={["ADMIN", "ENCARGADO"].includes(user.role)}
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
                      <TableCell className="font-medium">
                        {person.user.name}
                      </TableCell>
                      <TableCell>
                        {person.user.course?.name || "—"}
                      </TableCell>
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
