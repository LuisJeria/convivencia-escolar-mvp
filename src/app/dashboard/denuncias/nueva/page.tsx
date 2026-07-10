"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDenounceReport } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NuevaDenunciaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{
    title: string
    description: string
    involvedName: string
    involvedCourse: string
    reporterIsVictim: string
  }>({
    title: "",
    description: "",
    involvedName: "",
    involvedCourse: "",
    reporterIsVictim: "true",
  })

  async function handleSubmit() {
    if (!form.title || !form.description) {
      toast.error("Completa todos los campos requeridos")
      return
    }

    if (form.description.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await createDenounceReport({
        reporterId: user.id,
        reporterRole: user.role,
        reporterIsVictim: form.reporterIsVictim === "true",
        title: form.title,
        description: form.description,
        involvedName: form.involvedName || undefined,
        involvedCourse: form.involvedCourse || undefined,
      })

      toast.success("Denuncia enviada exitosamente. El Encargado de Convivencia la revisará.")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Error al enviar la denuncia")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Denunciar incidente</h1>
          <p className="text-muted-foreground">
            Reporta una situación de manera confidencial
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800">
            <strong>Importante:</strong> Esta denuncia será enviada al Encargado de Convivencia
            para su revisión. No se tomarán acciones hasta que sea evaluada.
            La información que proporciones será tratada de manera confidencial.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Qué sucedió?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la situación *</Label>
            <Input
              id="title"
              placeholder="Ej: Estudiante es burlado por su apariencia física"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>¿Cómo te relaciones con esta situación? *</Label>
            <Select
              value={form.reporterIsVictim}
              onValueChange={(val) => setForm({ ...form, reporterIsVictim: val ?? "true" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Soy la víctima</SelectItem>
                <SelectItem value="false">Soy testigo de lo ocurrido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Esta información ayudará al Encargado de Convivencia a definir los pasos del protocolo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe lo que observaste o viviste *</Label>
            <Textarea
              id="description"
              placeholder="Cuentanos con tus propias palabras qué ocurrió, cuándo, dónde y quiénes estaban involucrados. Mientras más detalles, mejor podremos actuar."
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Tu descripción se mantendrá en confidencial.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="involvedName">Nombre del estudiante involucrado (opcional)</Label>
              <Input
                id="involvedName"
                placeholder="Si conoces el nombre"
                value={form.involvedName}
                onChange={(e) => setForm({ ...form, involvedName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="involvedCourse">Curso del estudiante (opcional)</Label>
              <Input
                id="involvedCourse"
                placeholder="Ej: 3° Básico A"
                value={form.involvedCourse}
                onChange={(e) => setForm({ ...form, involvedCourse: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar denuncia
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
