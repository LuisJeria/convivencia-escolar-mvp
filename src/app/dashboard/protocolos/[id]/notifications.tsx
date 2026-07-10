"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { notifyInvolved } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type InvolvedPerson = {
  id: string
  role: string
  user: {
    name: string
    course: { name: string } | null
  }
  studentNotified: boolean
  studentNotifiedAt: Date | null
  guardianNotified: boolean
  guardianNotifiedAt: Date | null
}

type Props = {
  incidentId: string
  involved: InvolvedPerson[]
  canEdit: boolean
}

export function NotificationSection({ incidentId, involved, canEdit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleNotify(involvedId: string, type: "student" | "guardian") {
    setLoading(`${involvedId}-${type}`)
    try {
      await notifyInvolved({ incidentId, involvedId, type })
      toast.success("Notificación registrada")
      router.refresh()
    } catch {
      toast.error("Error al registrar la notificación")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notificaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 mb-4">
          <Bell className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Los estudiantes y apoderados deben ser notificados sobre el incidente. Registra cada notificación aquí.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Rol en el caso</TableHead>
              <TableHead>Notificación Estudiante</TableHead>
              <TableHead>Notificación Apoderado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {involved.map((person) => (
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
                <TableCell>
                  {person.studentNotified ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Notificado
                      </Badge>
                      {person.studentNotifiedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(person.studentNotifiedAt), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <BellOff className="h-3 w-3" />
                        Pendiente
                      </Badge>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNotify(person.id, "student")}
                          disabled={loading === `${person.id}-student`}
                        >
                          {loading === `${person.id}-student` ? "Registrando..." : "Marcar como notificado"}
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {person.guardianNotified ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Notificado
                      </Badge>
                      {person.guardianNotifiedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(person.guardianNotifiedAt), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <BellOff className="h-3 w-3" />
                        Pendiente
                      </Badge>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNotify(person.id, "guardian")}
                          disabled={loading === `${person.id}-guardian`}
                        >
                          {loading === `${person.id}-guardian` ? "Registrando..." : "Marcar como notificado"}
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
