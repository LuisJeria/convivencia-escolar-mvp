"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { loginDemo } from "@/lib/auth"
import { ROLE_LABELS, ROLES } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Heart, GraduationCap, BookOpen, Users, UserCheck, ClipboardList, Trophy } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ROLE_ICONS: Record<string, LucideIcon> = {
  ADMIN: Shield,
  DIRECTOR: UserCheck,
  ENCARGADO_CONVIVENCIA: Heart,
  ORIENTADOR: ClipboardList,
  INSPECTOR: ClipboardList,
  PROFESOR_JEFE: Users,
  DOCENTE: GraduationCap,
  ESTUDIANTE: BookOpen,
  APODERADO: Users,
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Gestión de escuelas, usuarios y configuración general del sistema",
  DIRECTOR: "Supervisión general, aprobación de medidas graves y reportes",
  ENCARGADO_CONVIVENCIA: "Gestión de protocolos, casos de convivencia y prevención",
  ORIENTADOR: "Apoyo en protocolos, entrevistas, seguimiento y derivaciones",
  INSPECTOR: "Apoyo en protocolos,Fiscalización y seguimiento de conducta",
  PROFESOR_JEFE: "Vista de su curso, incidentes, puntos y ranking",
  DOCENTE: "Reporte de incidentes y otorgamiento de puntos por conducta positiva",
  ESTUDIANTE: "Consulta de puntos, ranking, insignias y canje de recompensas",
  APODERADO: "Seguimiento de casos de su pupilo y progreso en gamificación",
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleLogin(role: string) {
    setLoading(role)
    try {
      await loginDemo(role)
      router.push("/dashboard")
      router.refresh()
    } catch (e) {
      console.error(e)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convivencia Escolar
          </h1>
          <p className="text-gray-500 text-lg">
            Plataforma de gestión y prevención gamificada
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            MVP Demo — Selecciona un rol para ingresar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ROLES).map(([key]) => {
            const Icon = ROLE_ICONS[key]
            return (
              <Card
                key={key}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5"
                onClick={() => handleLogin(key)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{ROLE_LABELS[key]}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {ROLE_DESCRIPTIONS[key]}
                  </CardDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    disabled={loading === key}
                  >
                    {loading === key ? "Ingresando..." : "Ingresar"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
