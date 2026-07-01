import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { ROLE_LABELS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Swords, CheckCircle, Clock } from "lucide-react"
import type { DemoUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("demo_user")
  const user: DemoUser = JSON.parse(cookie!.value)

  const [totalIncidents, resolvedIncidents, pendingSteps, topCourses] = await Promise.all([
    user.role === "ESTUDIANTE"
      ? db.incident.count({
          where: { involved: { some: { userId: user.id } } },
        })
      : user.role === "APODERADO"
        ? 0
        : db.incident.count(),
    user.role === "ESTUDIANTE"
      ? db.incident.count({
          where: {
            status: { in: ["RESUELTO", "CERRADO"] },
            involved: { some: { userId: user.id } },
          },
        })
      : user.role === "APODERADO"
        ? 0
        : db.incident.count({ where: { status: { in: ["RESUELTO", "CERRADO"] } } }),
    db.protocolStep.count({ where: { status: "PENDIENTE" } }),
    db.course.findMany({
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, name: true, points: true },
    }),
  ])

  const puntosEstudiante =
    user.role === "ESTUDIANTE"
      ? (
          await db.pointTransaction.aggregate({
            where: { studentId: user.id },
            _sum: { points: true },
          })
        )._sum.points ?? 0
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {user.name}
        </h1>
        <p className="text-muted-foreground">
          {ROLE_LABELS[user.role]} — Panel de control
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Casos totales</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Incidentes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Casos resueltos/cerrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pasos pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSteps}</div>
            <p className="text-xs text-muted-foreground">
              Acciones por completar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === "ESTUDIANTE" ? "Tus puntos" : "Cursos activos"}
            </CardTitle>
            <Swords className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {user.role === "ESTUDIANTE" ? (
              <>
                <div className="text-2xl font-bold">{puntosEstudiante}</div>
                <p className="text-xs text-muted-foreground">Puntos acumulados</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Desde 1° básico a 3° medio</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranking de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{course.name}</span>
                  </div>
                  <span className="text-sm font-bold">{course.points} pts</span>
                </div>
              ))}
              {topCourses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos de ranking aún.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acceso rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/protocolos"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Protocolos</p>
                <p className="text-xs text-muted-foreground">
                  Gestionar casos de convivencia
                </p>
              </div>
            </a>
            <a
              href="/dashboard/gamificacion"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Swords className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Gamificación</p>
                <p className="text-xs text-muted-foreground">
                  Puntos, ranking y prevención
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
