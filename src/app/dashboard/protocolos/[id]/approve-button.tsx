"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { approveIncident } from "@/lib/actions"

export function ApproveButton({ incidentId }: { incidentId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    try {
      await approveIncident({ incidentId })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      className="gap-1 bg-green-600 hover:bg-green-700"
      onClick={handleApprove}
      disabled={loading}
    >
      <CheckCircle className="h-4 w-4" />
      {loading ? "Aprobando..." : "Aprobar"}
    </Button>
  )
}
