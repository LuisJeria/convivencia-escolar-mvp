"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { reviewDenounceReport } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type DenounceReport = {
  id: string
  title: string
  description: string
  involvedName: string | null
  involvedCourse: string | null
  reporterRole: string
  reporterIsVictim: boolean
  status: string
  reviewNote: string | null
  createdAt: Date
  reporter: {
    name: string
    email: string
    role: string
  }
}

type Props = {
  pendingReports: DenounceReport[]
}

export function DenounceReportsSection({ pendingReports }: Props) {
  const router = useRouter()
  const [reports, setReports] = useState(pendingReports)
  const [selectedReport, setSelectedReport] = useState<DenounceReport | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setReports(pendingReports)
  }, [pendingReports])

  async function handleApproveAndCreate(report: DenounceReport) {
    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await reviewDenounceReport({
        reportId: report.id,
        action: "APPROVE",
        reviewNote,
        reviewerId: user.id,
      })

      const params = new URLSearchParams({
        title: report.title,
        description: report.description,
      })
      if (report.involvedName) params.set("involvedName", report.involvedName)
      if (report.involvedCourse) params.set("involvedCourse", report.involvedCourse)

      toast.success("Denuncia aprobada. Redirigiendo al formulario de caso...")
      router.push(`/dashboard/protocolos/nuevo?${params.toString()}`)
    } catch {
      toast.error("Error al procesar la denuncia")
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!selectedReport) return
    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await reviewDenounceReport({
        reportId: selectedReport.id,
        action: "REJECT",
        reviewNote,
        reviewerId: user.id,
      })

      toast.success("Denuncia rechazada")
      setReports(reports.filter((r) => r.id !== selectedReport.id))
      setDialogOpen(false)
      setSelectedReport(null)
      setReviewNote("")
      router.refresh()
    } catch {
      toast.error("Error al procesar la denuncia")
    } finally {
      setLoading(false)
    }
  }

  function openDetail(report: DenounceReport) {
    setSelectedReport(report)
    setReviewNote("")
    setDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Denuncias pendientes de revisión
          {reports.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {reports.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay denuncias pendientes por revisar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Reportado por</TableHead>
                <TableHead>Persona involucrada</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-sm">
                    {format(new Date(report.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{report.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{report.reporter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.reporterRole === "ESTUDIANTE"
                          ? "Estudiante"
                          : report.reporterRole === "APODERADO"
                            ? "Apoderado"
                            : report.reporterRole}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {report.involvedName ? (
                        <>
                          <p className="text-sm">{report.involvedName}</p>
                          {report.involvedCourse && (
                            <p className="text-xs text-muted-foreground">
                              {report.involvedCourse}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No especificado
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetail(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalle de la denuncia</DialogTitle>
                        </DialogHeader>
                        {selectedReport && (
                          <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span>
                                Reportado el{" "}
                                {format(
                                  new Date(selectedReport.createdAt),
                                  "dd 'de' MMMM 'de' yyyy 'a las' HH:mm"
                                )}{" "}
                                por {selectedReport.reporter.name} (
                                {selectedReport.reporterRole === "ESTUDIANTE"
                                  ? "Estudiante"
                                  : selectedReport.reporterRole === "APODERADO"
                                    ? "Apoderado"
                                    : selectedReport.reporterRole}
                                )
                              </span>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Título de la situación
                              </Label>
                              <p className="font-medium">{selectedReport.title}</p>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Descripción
                              </Label>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/50 p-3 rounded">
                                {selectedReport.description}
                              </p>
                            </div>

                            {selectedReport.involvedName && (
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Persona involucrada
                                </Label>
                                <p className="text-sm">
                                  {selectedReport.involvedName}
                                  {selectedReport.involvedCourse &&
                                    ` (${selectedReport.involvedCourse})`}
                                </p>
                              </div>
                            )}

                            <div className="border-t pt-4">
                              <Label className="text-xs text-muted-foreground mb-2 block">
                                Nota de revisión (opcional)
                              </Label>
                              <Textarea
                                placeholder="Agrega una nota sobre tu decisión..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                              <Button
                                onClick={() => handleApproveAndCreate(selectedReport)}
                                disabled={loading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar y crear caso
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
