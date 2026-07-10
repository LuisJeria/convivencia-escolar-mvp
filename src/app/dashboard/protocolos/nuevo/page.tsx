"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createIncident } from "@/lib/actions"
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Search, X, FileText } from "lucide-react"
import { toast } from "sonner"

type StudentResult = {
  id: string
  name: string
  courseName: string | null
}

type InvolvedPerson = {
  userId: string
  name: string
  courseName: string | null
  role: string
}

function NuevoCasoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState("")
  const [description, setDescription] = useState("")
  const [involved, setInvolved] = useState<InvolvedPerson[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StudentResult[]>([])
  const [selectedRole, setSelectedRole] = useState("VICTIMA")
  const [searching, setSearching] = useState(false)
  const [prefilledNote, setPrefilledNote] = useState("")

  useEffect(() => {
    const titleParam = searchParams.get("title")
    const descParam = searchParams.get("description")
    const involvedName = searchParams.get("involvedName")
    const involvedCourse = searchParams.get("involvedCourse")

    if (titleParam) {
      setTitle(titleParam)
      setPrefilledNote("Denuncia aprobada - caso creado desde denuncia.")
    }
    if (descParam) {
      setDescription(descParam)
    }
    if (involvedName) {
      setInvolved([{
        userId: "",
        name: involvedName,
        courseName: involvedCourse,
        role: "VICTIMA",
      }])
      setStep(2)
    }
  }, [searchParams])

  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  function addInvolved(student: StudentResult) {
    if (involved.some((p) => p.userId === student.id)) {
      toast.error("Esta persona ya fue agregada")
      return
    }
    setInvolved([
      ...involved,
      {
        userId: student.id,
        name: student.name,
        courseName: student.courseName,
        role: selectedRole,
      },
    ])
    setSearchQuery("")
    setSearchResults([])
  }

  function removeInvolved(index: number) {
    setInvolved(involved.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!title || !type || !severity || !description) {
      toast.error("Completa todos los campos requeridos")
      return
    }

    if (involved.length === 0) {
      toast.error("Agrega al menos una persona involucrada")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/current-user")
      const user = await res.json()

      await createIncident({
        title,
        type,
        severity,
        description,
        reporterId: user.id,
        reporterRole: user.role,
        involved: involved.map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      })

      toast.success("Caso creado exitosamente")
      router.push("/dashboard/protocolos")
      router.refresh()
    } catch (e) {
      toast.error("Error al crear el caso")
      console.error(e)
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
          <h1 className="text-2xl font-bold tracking-tight">Nuevo caso</h1>
          <p className="text-muted-foreground">Registrar un nuevo incidente de convivencia</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 1: Datos del incidente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del caso *</Label>
              <Input
                id="title"
                placeholder="Ej: Discusión en el recreo con insultos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de incidente *</Label>
                <Select value={type} onValueChange={(val) => setType(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gravedad *</Label>
                <Select value={severity} onValueChange={(val) => setSeverity(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar gravedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_SEVERITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción de los hechos *</Label>
              <Textarea
                id="description"
                placeholder="Describe lo sucedido con el mayor detalle posible"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => {
                if (!title || !type || !severity || !description) {
                  toast.error("Completa todos los campos requeridos")
                  return
                }
                setStep(2)
              }}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 2: Personas involucradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar estudiante</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Escribe al menos 2 letras..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      searchStudents(e.target.value)
                    }}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((student) => (
                        <button
                          key={student.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                          onClick={() => addInvolved(student)}
                        >
                          <span>{student.name}</span>
                          {student.courseName && (
                            <span className="text-xs text-muted-foreground">{student.courseName}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "VICTIMA")}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGRESOR">Agresor</SelectItem>
                    <SelectItem value="VICTIMA">Víctima</SelectItem>
                    <SelectItem value="TESTIGO">Testigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
            </div>

            {involved.length > 0 && (
              <div className="space-y-2">
                <Label>Involucrados ({involved.length})</Label>
                <div className="space-y-2">
                  {involved.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.courseName && (
                            <p className="text-xs text-muted-foreground">{p.courseName}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.role === "AGRESOR"
                            ? "bg-red-100 text-red-800"
                            : p.role === "VICTIMA"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}>
                          {p.role === "AGRESOR" ? "Agresor" : p.role === "VICTIMA" ? "Víctima" : "Testigo"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvolved(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={() => {
                if (involved.length < 2) {
                  toast.error("Agrega al menos 2 personas involucradas")
                  return
                }
                setStep(3)
              }}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 3: Revisión y confirmación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título</Label>
                <p className="text-sm font-medium">{title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <p className="text-sm font-medium">
                    {INCIDENT_TYPES.find((t) => t.value === type)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gravedad</Label>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    severity === "LEVE" ? "bg-green-100 text-green-800" :
                    severity === "MODERADO" ? "bg-yellow-100 text-yellow-800" :
                    severity === "GRAVE" ? "bg-orange-100 text-orange-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {severity}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descripción</Label>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Involucrados ({involved.length})
                </Label>
                <ul className="text-sm space-y-1 mt-1">
                  {involved.map((p, i) => (
                    <li key={i}>
                      {p.name} ({p.courseName}) —{" "}
                      {p.role === "AGRESOR" ? "Agresor" : p.role === "VICTIMA" ? "Víctima" : "Testigo"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {prefilledNote && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {prefilledNote}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Al crear este caso se generarán automáticamente los pasos de protocolo
                según la Ley 20.536 de Violencia Escolar.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Check className="h-4 w-4 mr-2" />
                {loading ? "Creando..." : "Crear caso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function NuevoCasoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <NuevoCasoContent />
    </Suspense>
  )
}
