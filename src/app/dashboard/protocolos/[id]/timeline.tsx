"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeStep, resolveIncident, closeIncident } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Step = {
  id: string
  order: number
  name: string
  description: string | null
  status: string
  completedAt: Date | null
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

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = step.status === "COMPLETADO"
        const isLast = index === steps.length - 1
        const isCurrent = !isCompleted && (index === 0 || steps[index - 1]?.status === "COMPLETADO")

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
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-green-700" : isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                  {isCompleted && step.completedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Completado el {new Date(step.completedAt).toLocaleDateString("es-CL")}
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

      {canEdit && steps.every((s) => s.status === "COMPLETADO") && incidentStatus !== "RESUELTO" && incidentStatus !== "CERRADO" && (
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleResolve} disabled={resolving} className="w-full">
            {resolving ? "Resolviendo..." : "Resolver caso"}
          </Button>
          <Button onClick={handleClose} disabled={resolving} variant="outline" className="w-full">
            Cerrar caso
          </Button>
        </div>
      )}

      {incidentStatus === "RESUELTO" && canEdit && (
        <div className="pt-4 border-t">
          <Button onClick={handleClose} variant="outline" className="w-full">
            Cerrar caso definitivamente
          </Button>
        </div>
      )}
    </div>
  )
}
