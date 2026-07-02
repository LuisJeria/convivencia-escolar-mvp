import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, TrendingUp, Medal } from "lucide-react"
import { OtorgarPuntosDialog } from "./otorgar-puntos"
import { getDemoUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function GamificacionPage() {
  const user = await getDemoUser()
  if (!user) redirect("/login")

  const [topCourses, studentRankings, myPoints, pointHistory] = await Promise.all([
    db.course.findMany({
      orderBy: { points: "desc" },
      select: { id: true, name: true, points: true, _count: { select: { students: true } } },
    }),
    db.user.findMany({
      where: { role: "ESTUDIANTE" },
      include: {
        course: { select: { name: true } },
        receivedPoints: { select: { points: true } },
      },
      orderBy: {
        course: { points: "desc" },
      },
      take: 20,
    }),
    user.role === "ESTUDIANTE"
      ? db.pointTransaction.aggregate({
          where: { studentId: user.id },
          _sum: { points: true },
        })
      : null,
    user.role === "ESTUDIANTE"
      ? db.pointTransaction.findMany({
          where: { studentId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            awardedBy: { select: { name: true } },
          },
        })
      : [],
  ])

  const canAward = ["ADMIN", "ENCARGADO", "DOCENTE"].includes(user.role)
  const estudiantes = await db.user.findMany({
    where: { role: "ESTUDIANTE" },
    include: { course: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gamificación</h1>
          <p className="text-muted-foreground">Sistema de puntos y ranking para fomentar la buena convivencia</p>
        </div>
        {canAward && (
          <OtorgarPuntosDialog estudiantes={estudiantes.map((e) => ({
            id: e.id,
            name: e.name,
            courseName: e.course?.name ?? null,
          }))} />
        )}
      </div>

      {user.role === "ESTUDIANTE" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8" />
                <div>
                  <p className="text-sm font-medium text-blue-100">Tus puntos</p>
                  <p className="text-3xl font-bold">{myPoints?._sum.points ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Medal className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tu curso</p>
                  <p className="text-lg font-bold">{user.courseName || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Historial</p>
                  <p className="text-lg font-bold">{pointHistory.length} transacciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              Ranking de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de ranking aún.
              </p>
            ) : (
              <div className="space-y-3">
                {topCourses.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-amber-100 text-amber-800"
                            : index === 1
                              ? "bg-gray-200 text-gray-700"
                              : index === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {course._count.students} estudiantes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{course.points}</p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Top Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const ranked = studentRankings
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  courseName: s.course?.name ?? "—",
                  points: s.receivedPoints.reduce((sum, pt) => sum + pt.points, 0),
                }))
                .sort((a, b) => b.points - a.points)
                .slice(0, 10)

              return ranked.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay puntajes registrados aún.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead className="text-right">Puntos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranked.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              index < 3 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.courseName}
                        </TableCell>
                        <TableCell className="text-right font-bold">{student.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {user.role === "ESTUDIANTE" && pointHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu historial de puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Otorgado por</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointHistory.map((pt) => (
                  <TableRow key={pt.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(pt.createdAt).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>{pt.reason}</TableCell>
                    <TableCell className="text-sm">{pt.awardedBy.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        +{pt.points}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
