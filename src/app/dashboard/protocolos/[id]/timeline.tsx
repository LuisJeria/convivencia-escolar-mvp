"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeStep, resolveIncident, closeIncident } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"
import { cn, differenceInBusinessDays } from "@/lib/utils"
import { toast } from "sonner"
import { format, isAfter, isBefore, addDays } from "date-fns"

type Step = {
  id: string
  order: number
  name: string
  description: string | null
  status: string
  businessDaysDeadline: number
  deadlineDate: Date | null
  completedAt: Date | null
}

type DeadlineStatus = "ok" | "upcoming" | "overdue" | "completed"

function getDeadlineStatus(step: Step): DeadlineStatus {
  if (step.status === "COMPLETADO") return "completed"
  if (!step.deadlineDate) return "ok"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(step.deadlineDate)
  deadline.setHours(0, 0, 0, 0)

  if (isBefore(deadline, today)) return "overdue"
  if (isBefore(deadline, addDays(today, 3))) return "upcoming"
  return "ok"
}

function getDaysRemaining(step: Step): number | null {
  if (step.status === "COMPLETADO") return null
  if (!step.deadlineDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(step.deadlineDate)
  deadline.setHours(0, 0, 0, 0)

  const days = differenceInBusinessDays(deadline, today)
  return days
}

function DeadlineBadge({ step }: { step: Step }) {
  const status = getDeadlineStatus(step)
  const daysRemaining = getDaysRemaining(step)

  if (status === "completed") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="h-3 w-3" />
        Completado
      </Badge>
    )
  }

  if (status === "overdue") {
    return (
      <Badge variant="destructive" className="gap-1 animate-pulse">
        <XCircle className="h-3 w-3" />
        Vencido {Math.abs(daysRemaining || 0)} días
      </Badge>
    )
  }

  if (status === "upcoming") {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Vence en {daysRemaining} días
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 gap-1">
      <Clock className="h-3 w-3" />
      {daysRemaining} días
    </Badge>
  )
}

export function IncidentTimeline({
  incidentId,
  steps,
  incidentStatus,
  canEdit,
}: {
  incidentId: string
  steps: Step[]
  incidentStatus: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [completingStep, setCompletingStep] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCompleteStep(stepId: string) {
    setCompletingStep(stepId)
    try {
      await completeStep(stepId)
      toast.success("Paso completado")
      router.refresh()
    } catch {
      toast.error("Error al completar el paso")
    } finally {
      setCompletingStep(null)
    }
  }

  async function handleResolve() {
    setError(null)
    const overdueSteps = steps.filter(
      (s) => s.status !== "COMPLETADO" && getDeadlineStatus(s) === "overdue"
    )
    if (overdueSteps.length > 0) {
      setError(`No se puede resolver: hay ${overdueSteps.length} paso(s) vencido(s). Completa los pasos vencidos primero.`)
      return
    }
    setResolving(true)
    try {
      await resolveIncident(incidentId)
      toast.success("Caso resuelto")
      router.refresh()
    } catch {
      toast.error("Error al resolver el caso")
    } finally {
      setResolving(false)
    }
  }

  async function handleClose() {
    setError(null)
    const overdueSteps = steps.filter(
      (s) => s.status !== "COMPLETADO" && getDeadlineStatus(s) === "overdue"
    )
    if (overdueSteps.length > 0) {
      setError(`No se puede cerrar: hay ${overdueSteps.length} paso(s) vencido(s). Completa los pasos vencidos primero.`)
      return
    }
    setResolving(true)
    try {
      await closeIncident(incidentId)
      toast.success("Caso cerrado")
      router.refresh()
    } catch {
      toast.error("Error al cerrar el caso")
    } finally {
      setResolving(false)
    }
  }

  const allCompleted = steps.every((s) => s.status === "COMPLETADO")
  const hasOverdueSteps = steps.some(
    (s) => s.status !== "COMPLETADO" && getDeadlineStatus(s) === "overdue"
  )

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = step.status === "COMPLETADO"
        const isLast = index === steps.length - 1
        const isCurrent =
          !isCompleted &&
          (index === 0 || steps[index - 1]?.status === "COMPLETADO")

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{step.order + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 h-full min-h-[40px]",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>

            <div className={cn("pb-8 flex-1", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCompleted
                          ? "text-green-700"
                          : isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </p>
                    <DeadlineBadge step={step} />
                  </div>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1">
                    {step.deadlineDate && (
                      <p className="text-xs text-muted-foreground">
                        Vence: {format(new Date(step.deadlineDate), "dd/MM/yyyy")}
                      </p>
                    )}
                    {step.businessDaysDeadline > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Plazo: {step.businessDaysDeadline} días hábiles
                      </p>
                    )}
                  </div>
                  {isCompleted && step.completedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Completado el{" "}
                      {format(new Date(step.completedAt), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>

                {canEdit && isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteStep(step.id)}
                    disabled={completingStep === step.id}
                  >
                    {completingStep === step.id ? (
                      "Completando..."
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Completar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {canEdit && allCompleted && incidentStatus !== "RESUELTO" && incidentStatus !== "CERRADO" && (
        <div className="flex flex-col gap-2 pt-4 border-t">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleResolve} disabled={resolving || hasOverdueSteps} className="w-full">
              {resolving ? "Resolviendo..." : "Resolver caso"}
            </Button>
            <Button
              onClick={handleClose}
              disabled={resolving || hasOverdueSteps}
              variant="outline"
              className="w-full"
            >
              Cerrar caso
            </Button>
          </div>
        </div>
      )}

      {incidentStatus === "RESUELTO" && canEdit && (
        <div className="flex flex-col gap-2 pt-4 border-t">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
            disabled={hasOverdueSteps}
          >
            Cerrar caso definitivamente
          </Button>
        </div>
      )}
    </div>
  )
}
