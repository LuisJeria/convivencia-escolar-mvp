import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getDemoUser } from "@/lib/auth"
import { DenounceReportsSection } from "@/components/denounce-reports-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DenunciasPage() {
  const user = await getDemoUser()
  if (!user) redirect("/login")

  const isEncargado = ["ADMIN", "DIRECTOR", "ENCARGADO_CONVIVENCIA"].includes(user.role)

  if (!isEncargado) {
    redirect("/dashboard/denuncias/nueva")
  }

  const pendingReports = await db.denounceReport.findMany({
    where: { status: "PENDIENTE" },
    include: {
      reporter: { select: { name: true, email: true, role: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const reviewedReports = await db.denounceReport.findMany({
    where: { status: { in: ["APROBADO", "RECHAZADO"] } },
    include: {
      reporter: { select: { name: true, email: true, role: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { reviewedAt: "desc" },
    take: 10,
  })

  const pendingReportsFormatted = pendingReports.map((r) => ({
    id: r.id,
    status: r.status,
    description: r.description,
    incidentType: r.type,
    reporterIsVictim: r.reporterIsVictim,
    createdAt: r.createdAt,
    reporter: r.reporter,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Denuncias</h1>
          <p className="text-muted-foreground">
            Revisa las denuncias enviadas por estudiantes y apoderados
          </p>
        </div>
        <Link href="/dashboard/denuncias/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva denuncia
          </Button>
        </Link>
      </div>

      <DenounceReportsSection pendingReports={pendingReportsFormatted} />

      {reviewedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Denuncias procesadas recientemente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Por {report.reporter.name} •{" "}
                      {report.reviewedBy
                        ? `Revisado por ${report.reviewedBy.name}`
                        : "Pendiente"}
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      report.status === "APROBADO"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {report.status === "APROBADO" ? "Aprobado" : "Rechazado"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
