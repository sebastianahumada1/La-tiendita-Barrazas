"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

interface RecordData {
  id: string
  date: string
  day_name: string
  created_at: string
}

interface SalesData {
  category: string
  amount: number
}

interface PaymentMethod {
  method: string
  amount: number
}

interface SummaryData {
  label: string
  amount: number
  is_calculated: boolean
}

interface AuditLog {
  id: string
  user_name: string
  action: string
  changes: any
  created_at: string
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<RecordData | null>(null)
  const [sales, setSales] = useState<SalesData[]>([])
  const [payments, setPayments] = useState<PaymentMethod[]>([])
  const [summary, setSummary] = useState<SummaryData[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    loadRecordDetails()
  }, [recordId])

  const loadRecordDetails = async () => {
    const supabase = createClient()

    try {
      // Load record
      const { data: recordData, error: recordError } = await supabase
        .from("daily_records")
        .select("*")
        .eq("id", recordId)
        .single()

      if (recordError) throw recordError
      setRecord(recordData)

      // Load sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales_data")
        .select("*")
        .eq("record_id", recordId)

      if (salesError) throw salesError
      setSales(salesData || [])

      // Load payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("record_id", recordId)

      if (paymentError) throw paymentError
      setPayments(paymentData || [])

      // Load summary data
      const { data: summaryData, error: summaryError } = await supabase
        .from("summary_data")
        .select("*")
        .eq("record_id", recordId)

      if (summaryError) throw summaryError
      setSummary(summaryData || [])

      // Load audit logs
      const { data: auditData, error: auditError } = await supabase
        .from("audit_log")
        .select("*")
        .eq("record_id", recordId)
        .order("created_at", { ascending: false })

      if (auditError && auditError.code !== "42P01") {
        // Ignore "table does not exist" error for backwards compatibility
        console.error("RecordDetail: Error loading audit logs:", auditError)
      } else {
        setAuditLogs(auditData || [])
      }
    } catch (err) {
      console.error("RecordDetail: Error loading record details:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar el registro"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!record) return

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el registro del ${record.day_name}, ${formatDate(record.date)}?\n\nEsta acción eliminará:\n- El registro principal\n- Todos los datos de ventas\n- Todos los métodos de pago\n- Todo el resumen\n- Todo el historial de cambios\n\n⚠️ Esta acción NO se puede deshacer.`
    )

    if (!confirmed) return

    try {
      setLoading(true)
      const supabase = createClient()
      const { getUserName } = await import("@/lib/user")
      const userName = getUserName()

      // Crear log de auditoría antes de eliminar (si la tabla existe)
      try {
        await supabase.from("audit_log").insert({
          record_id: recordId,
          user_name: userName,
          action: "DELETE",
          changes: {
            deleted_record: {
              date: record.date,
              day_name: record.day_name,
            },
          },
        })
      } catch (auditErr) {
        // Ignorar errores de auditoría (tabla puede no existir)
        console.warn("RecordDetail: Could not create audit log:", auditErr)
      }

      // Eliminar el registro (CASCADE eliminará automáticamente los datos relacionados)
      const { error: deleteError } = await supabase.from("daily_records").delete().eq("id", recordId)

      if (deleteError) throw deleteError

      alert("✅ Registro eliminado correctamente")
      router.push("/")
    } catch (err) {
      console.error("RecordDetail: Error deleting record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el registro"
      alert(`❌ ${errorMessage}`)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6">
            {error || "Registro no encontrado"}
          </div>
          <Link href="/">
            <Button>← Volver al inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1 font-semibold text-sm transition">
            ← Volver al inicio
          </Link>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Registro del Día</h1>
              <p className="text-2xl text-gray-700 font-semibold">{record.day_name}</p>
              <p className="text-gray-600">{formatDate(record.date)}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/record/${recordId}/edit`}>
                <Button className="bg-blue-600 hover:bg-blue-700">✏️ Editar</Button>
              </Link>
              <Button onClick={handleDelete} variant="destructive">
                🗑️ Eliminar
              </Button>
            </div>
          </div>
        </div>

        {/* Ventas */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold">💰 Ventas</h3>
          </div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {sales.map((sale, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="font-semibold text-gray-700">{sale.category}</span>
                  <span className="text-xl font-bold text-gray-900">${sale.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métodos de Pago */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold">💳 Métodos de Pago</h3>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {payments.map((payment, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">{payment.method}</p>
                  <p className="text-2xl font-bold text-purple-600">${payment.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4">
            <h3 className="text-xl font-bold">📊 Resumen</h3>
          </div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {summary.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-semibold text-gray-700">{item.label}</span>
                    {item.is_calculated && <span className="ml-2 text-xs text-gray-500">(Calculado)</span>}
                  </div>
                  <span className="text-xl font-bold text-gray-900">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Cambios */}
        {auditLogs.length > 0 && (
          <Card className="mb-6 shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-6 py-4">
              <h3 className="text-xl font-bold">📜 Historial de Cambios</h3>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-900">{log.user_name}</span>
                        <span className="ml-2 text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {log.action === "CREATE" ? "Creó" : log.action === "UPDATE" ? "Editó" : "Eliminó"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        <details className="cursor-pointer">
                          <summary className="font-semibold">Ver cambios</summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Registro creado el:{" "}
            {new Date(record.created_at).toLocaleString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

