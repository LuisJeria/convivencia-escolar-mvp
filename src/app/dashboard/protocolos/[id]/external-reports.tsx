"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createExternalReport } from "@/lib/actions"
import { EXTERNAL_ENTITIES } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Building2, FileText } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type ExternalReport = {
  id: string
  entity: string
  reportDate: Date
  status: string
  description: string
  filedBy: { name: string }
  createdAt: Date
}

type Props = {
  incidentId: string
  reports: ExternalReport[]
  incidentType: string
  canEdit: boolean
}

export function ExternalReportsSection({ incidentId, reports, incidentType, canEdit }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    entity: "",
    reportDate: new Date().toISOString().split("T")[0],
    description: "",
  })

  const needsExternalReport = incidentType === "VULNERACION_DERECHO" || incidentType === "CONSUMO_SUSTANCIAS"

  async function handleSubmit() {
    if (!form.entity || !form.description) {
      toast.error("Completa todos los campos")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await createExternalReport({
        incidentId,
        entity: form.entity,
        reportDate: form.reportDate,
        description: form.description,
        filedById: user.id,
      })

      toast.success("Denuncia externa registrada")
      setOpen(false)
      setForm({ entity: "", reportDate: new Date().toISOString().split("T")[0], description: "" })
      router.refresh()
    } catch {
      toast.error("Error al registrar la denuncia")
    } finally {
      setLoading(false)
    }
  }

  function getEntityLabel(entity: string) {
    return EXTERNAL_ENTITIES.find((e) => e.value === entity)?.label || entity
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Denuncias a Entidades Externas</CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Denuncia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Denuncia Externa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Entidad *</Label>
                  <Select
                    value={form.entity}
                    onValueChange={(val) => setForm({ ...form, entity: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar entidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTERNAL_ENTITIES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de denuncia *</Label>
                  <Input
                    type="date"
                    value={form.reportDate}
                    onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    placeholder="Describe los antecedentes de la denuncia..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Denuncia"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {needsExternalReport && reports.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
            <Building2 className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Este tipo de incidente requiere denuncia a entidades externas (PDI, Carabineros, Tribunal de Familia)
            </p>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay denuncias externas registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Registrado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {getEntityLabel(report.entity)}
                  </TableCell>
                  <TableCell>{format(new Date(report.reportDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        report.status === "PRESENTADA"
                          ? "bg-blue-100 text-blue-800"
                          : report.status === "EN_PROCESO"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                      }
                    >
                      {report.status === "PRESENTADA"
                        ? "Presentada"
                        : report.status === "EN_PROCESO"
                          ? "En Proceso"
                          : "Resuelta"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                  <TableCell>{report.filedBy.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
