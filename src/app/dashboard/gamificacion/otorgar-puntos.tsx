"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { awardPoints } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

type Estudiante = {
  id: string
  name: string
  courseName: string | null
}

const POINT_REASONS = [
  { value: "Buen trato y respeto", label: "Buen trato y respeto" },
  { value: "Medió en un conflicto entre compañeros", label: "Mediación de conflictos" },
  { value: "Incluyó a un compañero en actividades", label: "Inclusión" },
  { value: "Ayudó a un compañero con dificultades", label: "Ayuda a compañeros" },
  { value: "Mantuvo una actitud positiva y colaborativa", label: "Actitud positiva" },
  { value: "Demostró empatía con un compañero", label: "Empatía" },
]

export function OtorgarPuntosDialog({
  estudiantes,
}: {
  estudiantes: Estudiante[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)
  const [points, setPoints] = useState("5")
  const [reason, setReason] = useState("Buen trato y respeto")
  const [loading, setLoading] = useState(false)

  const filteredEstudiantes = searchQuery.length >= 2
    ? estudiantes.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedStudent
      ? [selectedStudent]
      : []

  async function handleAward() {
    if (!selectedStudent) {
      toast.error("Selecciona un estudiante")
      return
    }
    const pointsNum = parseInt(points)
    if (isNaN(pointsNum) || pointsNum < 1 || pointsNum > 50) {
      toast.error("Los puntos deben ser entre 1 y 50")
      return
    }

    setLoading(true)
    try {
      const userRes = await fetch("/api/current-user")
      const user = await userRes.json()

      await awardPoints({
        studentId: selectedStudent.id,
        awardedById: user.id,
        points: pointsNum,
        reason,
      })

      toast.success(`${pointsNum} puntos otorgados a ${selectedStudent.name}`)
      setOpen(false)
      setSelectedStudent(null)
      setSearchQuery("")
      setPoints("5")
      setReason("Buen trato y respeto")
      router.refresh()
    } catch (e) {
      toast.error("Error al otorgar puntos")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Otorgar puntos
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Otorgar puntos por conducta positiva</DialogTitle>
          <DialogDescription>
            Reconoce a un estudiante por su buena conducta y fomenta la convivencia positiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Buscar estudiante</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escribe el nombre del estudiante..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedStudent(null)
                }}
              />
            </div>
            {filteredEstudiantes.length > 0 && !selectedStudent && (
              <div className="border rounded-lg max-h-36 overflow-y-auto">
                {filteredEstudiantes.map((e) => (
                  <button
                    key={e.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                    onClick={() => {
                      setSelectedStudent(e)
                      setSearchQuery(e.name)
                    }}
                  >
                    <span>{e.name}</span>
                    {e.courseName && (
                      <span className="text-xs text-muted-foreground">{e.courseName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{selectedStudent.name}</p>
                {selectedStudent.courseName && (
                  <p className="text-xs text-muted-foreground">{selectedStudent.courseName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Puntos a otorgar (1-50)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={reason} onValueChange={(val) => setReason(val || "Buen trato y respeto")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POINT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            className="w-full"
            onClick={handleAward}
            disabled={!selectedStudent || loading}
          >
            {loading ? "Otorgando..." : `Otorgar ${points} puntos`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
