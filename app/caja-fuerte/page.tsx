"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CajaFuerteRecord {
  id: string
  date: string
  day_name: string
  created_at: string
  cargos_comisiones: number
  monto_recaudado: number
  total_ventas: number
  caja_fuerte: number
  deposito: number
}

export default function CajaFuertePage() {
  const [records, setRecords] = useState<CajaFuerteRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<CajaFuerteRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

  // Totales
  const [totals, setTotals] = useState({
    cargos_comisiones: 0,
    monto_recaudado: 0,
    total_ventas: 0,
    caja_fuerte: 0,
    deposito: 0,
  })

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [records, filterStartDate, filterEndDate])

  const loadRecords = async () => {
    const supabase = createClient()

    try {
      // Get all daily records
      const { data: recordsData, error: recordsError } = await supabase
        .from("daily_records")
        .select("*")
        .order("date", { ascending: false })

      if (recordsError) throw recordsError

      if (!recordsData || recordsData.length === 0) {
        setRecords([])
        setLoading(false)
        return
      }

      // Get all record IDs
      const recordIds = recordsData.map((r) => r.id)

      // Bulk fetch sales data
      const { data: allSales } = await supabase.from("sales_data").select("*").in("record_id", recordIds)

      // Bulk fetch summary data
      const { data: allSummary } = await supabase.from("summary_data").select("*").in("record_id", recordIds)

      // Process data
      const processedRecords: CajaFuerteRecord[] = recordsData.map((record) => {
        const sales = allSales?.filter((s) => s.record_id === record.id) || []
        const summary = allSummary?.filter((s) => s.record_id === record.id) || []

        const cargosComisiones = sales.find((s) => s.category === "CARGOS Y COMISIONES")?.amount || 0
        const montoRecaudado = sales.find((s) => s.category === "MONTO RECAUDADO")?.amount || 0
        const totalVentas = summary.find((s) => s.label === "TOTAL VENTAS")?.amount || 0
        const balance = summary.find((s) => s.label === "BALANCE" || s.label === "CAJA FUERTE")?.amount || 0
        const deposito = summary.find((s) => s.label === "DEPOSITO")?.amount || 0

        return {
          id: record.id,
          date: record.date,
          day_name: record.day_name,
          created_at: record.created_at,
          cargos_comisiones: cargosComisiones,
          monto_recaudado: montoRecaudado,
          total_ventas: totalVentas,
          caja_fuerte: balance,
          deposito: deposito,
        }
      })

      setRecords(processedRecords)
    } catch (error) {
      console.error("CajaFuerte: Error loading records:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...records]

    // Filtrar por fecha inicial
    if (filterStartDate) {
      filtered = filtered.filter((row) => row.date >= filterStartDate)
    }

    // Filtrar por fecha final
    if (filterEndDate) {
      filtered = filtered.filter((row) => row.date <= filterEndDate)
    }

    setFilteredRecords(filtered)

    // Calcular totales
    const newTotals = {
      cargos_comisiones: filtered.reduce((sum, r) => sum + r.cargos_comisiones, 0),
      monto_recaudado: filtered.reduce((sum, r) => sum + r.monto_recaudado, 0),
      total_ventas: filtered.reduce((sum, r) => sum + r.total_ventas, 0),
      caja_fuerte: filtered.reduce((sum, r) => sum + r.caja_fuerte, 0),
      deposito: filtered.reduce((sum, r) => sum + r.deposito, 0),
    }

    setTotals(newTotals)
  }

  const clearFilters = () => {
    setFilterStartDate("")
    setFilterEndDate("")
  }

  // Función para formatear fechas del filtro
  const formatFilterDate = (dateString: string): string => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Formatear fecha del registro sin problemas de zona horaria
  const formatRecordDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleDelete = async (recordId: string, recordDate: string, dayName: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el registro del ${dayName}, ${formatRecordDate(recordDate)}?\n\nEsta acción eliminará:\n- El registro principal\n- Todos los datos de ventas\n- Todos los métodos de pago\n- Todo el resumen\n- Todo el historial de cambios\n\n⚠️ Esta acción NO se puede deshacer.`
    )

    if (!confirmed) return

    try {
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
              date: recordDate,
              day_name: dayName,
            },
          },
        })
      } catch (auditErr) {
        // Ignorar errores de auditoría (tabla puede no existir)
        console.warn("CajaFuerte: Could not create audit log:", auditErr)
      }

      // Eliminar el registro (CASCADE eliminará automáticamente los datos relacionados)
      const { error: deleteError } = await supabase.from("daily_records").delete().eq("id", recordId)

      if (deleteError) throw deleteError

      // Recargar registros
      await loadRecords()
      alert("✅ Registro eliminado correctamente")
    } catch (err) {
      console.error("CajaFuerte: Error deleting record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el registro"
      alert(`❌ ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">💰 Registros Caja Fuerte</h1>
            <p className="text-lg text-gray-600">Consulta y gestiona los registros de caja fuerte</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold">🔍 Filtrar por Fecha</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:bg-gray-100"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {/* Indicador de filtros activos */}
            {(filterStartDate || filterEndDate) && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
                📅 Mostrando registros
                {filterStartDate && ` desde ${formatFilterDate(filterStartDate)}`}
                {filterEndDate && ` hasta ${formatFilterDate(filterEndDate)}`}
                {" • "}
                <span className="font-semibold">{filteredRecords.length} registro(s)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarjetas de Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
              <p className="text-xs font-semibold uppercase">Cargos y Comisiones</p>
            </div>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-orange-600">${totals.cargos_comisiones.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-3">
              <p className="text-xs font-semibold uppercase">Monto Recaudado</p>
            </div>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-600">${totals.monto_recaudado.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3">
              <p className="text-xs font-semibold uppercase">Total Ventas</p>
            </div>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-600">${totals.total_ventas.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
              <p className="text-xs font-semibold uppercase">Revisión de balance</p>
            </div>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">${totals.caja_fuerte.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-3">
              <p className="text-xs font-semibold uppercase">Depósito</p>
            </div>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-indigo-600">${totals.deposito.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Registros */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">📋 Registros</h2>
          </div>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-gray-600 text-center py-8">Cargando...</p>
            ) : records.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay registros aún. ¡Crea el primero desde el inicio!</p>
            ) : filteredRecords.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay registros que coincidan con los filtros seleccionados
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Día</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cargos/Comis.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monto Rec.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Ventas</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revisión de balance</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Depósito</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, idx) => (
                      <tr
                        key={record.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-indigo-50 transition"}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">{formatRecordDate(record.date)}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{record.day_name}</td>
                        <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                          ${record.cargos_comisiones.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                          ${record.monto_recaudado.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-600 font-semibold">
                          ${record.total_ventas.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600 font-bold">
                          ${record.caja_fuerte.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-semibold">
                          ${record.deposito.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Link href={`/record/${record.id}`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                👁️ Ver
                              </Button>
                            </Link>
                            <Link href={`/record/${record.id}/edit`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                                ✏️ Editar
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(record.id, record.date, record.day_name)}
                              className="text-xs"
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

