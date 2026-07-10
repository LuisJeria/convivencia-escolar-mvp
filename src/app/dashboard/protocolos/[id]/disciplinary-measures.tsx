"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDisciplinaryMeasure } from "@/lib/actions"
import { DISCIPLINARY_MEASURE_TYPES } from "@/lib/constants"
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
import { Plus, Scale, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

type DisciplinaryMeasure = {
  id: string
  type: string
  description: string
  startDate: Date
  endDate: Date | null
  suspensionPedagogicalPlan: string | null
  suspensionMaterialDetails: string | null
  createdBy: { name: string } | null
  createdAt: Date
}

type Props = {
  incidentId: string
  measures: DisciplinaryMeasure[]
  canEdit: boolean
}

export function DisciplinaryMeasuresSection({ incidentId, measures, canEdit }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    suspensionPedagogicalPlan: "",
    suspensionMaterialDetails: "",
  })

  async function handleSubmit() {
    if (!form.type || !form.description || !form.startDate) {
      toast.error("Completa los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await createDisciplinaryMeasure({
        incidentId,
        type: form.type,
        description: form.description,
        startDate: form.startDate,
        endDate: form.type === "SUSPENSION" && form.endDate ? form.endDate : undefined,
        suspensionPedagogicalPlan: form.type === "SUSPENSION" ? form.suspensionPedagogicalPlan : undefined,
        suspensionMaterialDetails: form.type === "SUSPENSION" ? form.suspensionMaterialDetails : undefined,
        createdById: user.id,
      })

      toast.success("Medida disciplinaria registrada")
      setOpen(false)
      setForm({
        type: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        suspensionPedagogicalPlan: "",
        suspensionMaterialDetails: "",
      })
      router.refresh()
    } catch {
      toast.error("Error al registrar la medida")
    } finally {
      setLoading(false)
    }
  }

  function getTypeLabel(type: string) {
    return DISCIPLINARY_MEASURE_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Medidas Disciplinarias</CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Medida
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Medida Disciplinaria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de medida *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => setForm({ ...form, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINARY_MEASURE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    placeholder="Describe la medida disciplinaria..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio *</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  {form.type === "SUSPENSION" && (
                    <div className="space-y-2">
                      <Label>Fecha de término</Label>
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {form.type === "SUSPENSION" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Resguardo de material pedagógico</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan de resguardo pedagógico</Label>
                      <Textarea
                        placeholder="Describe cómo se garantizará el acceso al material pedagógico durante la suspensión..."
                        value={form.suspensionPedagogicalPlan}
                        onChange={(e) => setForm({ ...form, suspensionPedagogicalPlan: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Detalle del material</Label>
                      <Input
                        placeholder="Ej: Textos digitales, guías, acceso a plataforma..."
                        value={form.suspensionMaterialDetails}
                        onChange={(e) => setForm({ ...form, suspensionMaterialDetails: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Medida"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {measures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay medidas disciplinarias registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {measures.map((measure) => (
              <div key={measure.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        measure.type === "SUSPENSION"
                          ? "bg-amber-100 text-amber-800"
                          : measure.type === "EXPULSION"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }
                    >
                      {getTypeLabel(measure.type)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{measure.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(measure.startDate), "dd/MM/yyyy")}
                        {measure.endDate && ` - ${format(new Date(measure.endDate), "dd/MM/yyyy")}`}
                      </p>
                    </div>
                  </div>
                </div>

                {measure.type === "SUSPENSION" && measure.suspensionPedagogicalPlan && (
                  <div className="mt-3 p-3 rounded bg-amber-50 border border-amber-100">
                    <p className="text-xs font-medium text-amber-800 mb-1">Resguardo pedagógico:</p>
                    <p className="text-xs text-amber-700">{measure.suspensionPedagogicalPlan}</p>
                    {measure.suspensionMaterialDetails && (
                      <p className="text-xs text-amber-600 mt-1">
                        Material: {measure.suspensionMaterialDetails}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
