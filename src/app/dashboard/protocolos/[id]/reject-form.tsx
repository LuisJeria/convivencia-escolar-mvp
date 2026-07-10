"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { rejectIncident } from "@/lib/actions"

export function RejectForm({ incidentId }: { incidentId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await rejectIncident({ incidentId, rejectionReason: reason })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setShowForm(true)}
      >
        <XCircle className="h-4 w-4" />
        Rechazar
      </Button>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <input
        type="text"
        placeholder="Razón del rechazo..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        onClick={handleReject}
        disabled={loading || !reason.trim()}
      >
        {loading ? "..." : "Confirmar"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => { setShowForm(false); setReason("") }}
      >
        Cancelar
      </Button>
    </div>
  )
}
