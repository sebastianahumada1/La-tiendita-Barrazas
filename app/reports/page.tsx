"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

type ReportType = "impuestos_neto"

interface ImpuestosNetoData {
  id: string
  date: string
  day_name: string
  cargos_comisiones: number
  gastos_menores: number
  total_ventas: number
  monto_recaudado: number
  deposito: number
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("impuestos_neto")
  const [impuestosNetoData, setImpuestosNetoData] = useState<ImpuestosNetoData[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros de fecha
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    const supabase = createClient()

    try {
      // Get all daily records
      const { data: records, error: recordsError } = await supabase
        .from("daily_records")
        .select("*")
        .order("date", { ascending: false })

      if (recordsError) throw recordsError

      if (!records || records.length === 0) {
        setImpuestosNetoData([])
        setLoading(false)
        return
      }

      // Get all record IDs
      const recordIds = records.map((r) => r.id)

      // Bulk fetch sales data (para Cargos y Comisiones)
      const { data: allSales } = await supabase
        .from("sales_data")
        .select("*")
        .in("record_id", recordIds)

      // Bulk fetch summary data
      const { data: allSummary } = await supabase.from("summary_data").select("*").in("record_id", recordIds)

      // Process data for Impuestos y Neto report
      const impuestosNetoReport: ImpuestosNetoData[] = records.map((record) => {
        const cargosComisiones =
          allSales?.find((s) => s.record_id === record.id && s.category === "CARGOS Y COMISIONES")?.amount || 0
        const montoRecaudado =
          allSales?.find((s) => s.record_id === record.id && s.category === "MONTO RECAUDADO")?.amount || 0
        const gastosMenores = allSummary?.find((s) => s.record_id === record.id && s.label === "GASTOS MENORES")?.amount || 0
        const totalVentas = allSummary?.find((s) => s.record_id === record.id && s.label === "TOTAL VENTAS")?.amount || 0
        const deposito = allSummary?.find((s) => s.record_id === record.id && s.label === "DEPOSITO")?.amount || 0

        return {
          id: record.id,
          date: record.date,
          day_name: record.day_name,
          cargos_comisiones: cargosComisiones,
          gastos_menores: gastosMenores,
          total_ventas: totalVentas,
          monto_recaudado: montoRecaudado,
          deposito: deposito,
        }
      })

      setImpuestosNetoData(impuestosNetoReport)
    } catch (error) {
      console.error("Reports: Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar datos según tipo de reporte y rango de fechas
  const getFilteredData = () => {
    const data = impuestosNetoData

    let filtered = [...data]

    // Filtrar por fecha de inicio
    if (startDate) {
      filtered = filtered.filter((row) => row.date >= startDate)
    }

    // Filtrar por fecha de fin
    if (endDate) {
      filtered = filtered.filter((row) => row.date <= endDate)
    }

    return filtered
  }

  const filteredData = getFilteredData()

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  // Calcular sumatorias según tipo de reporte
  const getTotals = () => {
    const data = filteredData as ImpuestosNetoData[]
    return {
      totalCargosComisiones: data.reduce((sum, row) => sum + row.cargos_comisiones, 0),
      totalGastosMenores: data.reduce((sum, row) => sum + row.gastos_menores, 0),
      totalVentas: data.reduce((sum, row) => sum + row.total_ventas, 0),
      totalMontoRecaudado: data.reduce((sum, row) => sum + row.monto_recaudado, 0),
      totalDeposito: data.reduce((sum, row) => sum + row.deposito, 0),
    }
  }

  const totals = getTotals()

  const downloadCSV = () => {
    const data = filteredData as ImpuestosNetoData[]
    const headers = ["Fecha", "Día", "Cargos y Comisiones", "Gastos Menores", "Total Ventas", "Monto Recaudado", "Depósito"]
    const rows = data.map((row) => [
      row.date,
      row.day_name,
      row.cargos_comisiones.toFixed(2),
      row.gastos_menores.toFixed(2),
      row.total_ventas.toFixed(2),
      row.monto_recaudado.toFixed(2),
      row.deposito.toFixed(2),
    ])
    rows.push([
      "",
      "TOTAL",
      totals.totalCargosComisiones!.toFixed(2),
      totals.totalGastosMenores!.toFixed(2),
      totals.totalVentas!.toFixed(2),
      totals.totalMontoRecaudado!.toFixed(2),
      totals.totalDeposito!.toFixed(2),
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const dateRange = startDate && endDate ? `_${startDate}_a_${endDate}` : ""
    a.download = `reporte-impuestos-neto${dateRange}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }


  // Función para formatear fechas del filtro (YYYY-MM-DD) sin problemas de zona horaria
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-indigo-600 font-semibold hover:text-indigo-700 mb-4 block">
          ← Volver
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reportes</h1>
          <p className="text-gray-600">Consulta el histórico de ventas por fecha</p>
        </div>


        {/* Filtros de Fecha */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Filtrar por Fecha</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
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
          {(startDate || endDate) && (
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
              📅 Mostrando registros
              {startDate && ` desde ${formatFilterDate(startDate)}`}
              {endDate && ` hasta ${formatFilterDate(endDate)}`}
              {" • "}
              <span className="font-semibold">{filteredData.length} registro(s)</span>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">
              {impuestosNetoData.length === 0
                ? "No hay datos para mostrar"
                : "No hay registros en el rango de fechas seleccionado"}
            </p>
          </div>
        ) : (
          <>
            {/* Tabla de reporte */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                      <th className="px-6 py-4 text-left font-semibold">Día</th>
                      <th className="px-6 py-4 text-right font-semibold">Cargos y Comisiones</th>
                      <th className="px-6 py-4 text-right font-semibold">Gastos Menores</th>
                      <th className="px-6 py-4 text-right font-semibold">Total Ventas</th>
                      <th className="px-6 py-4 text-right font-semibold">Monto Recaudado</th>
                      <th className="px-6 py-4 text-right font-semibold">Depósito</th>
                      <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData as ImpuestosNetoData[]).map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-gray-900 font-medium">{formatDate(row.date)}</td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{row.day_name}</td>
                        <td className="px-6 py-4 text-right font-bold text-orange-600 text-lg">
                          ${row.cargos_comisiones.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-purple-600 text-lg">
                          ${row.gastos_menores.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                          ${row.total_ventas.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 text-lg">
                          ${row.monto_recaudado.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600 text-lg">
                          ${row.deposito.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/record/${row.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              Ver Detalle
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {/* Fila de Total */}
                    <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 border-t-4 border-blue-500">
                      <td className="px-6 py-4 font-bold text-gray-900" colSpan={2}>
                        TOTAL
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-orange-600 text-xl">
                        ${totals.totalCargosComisiones!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-purple-600 text-xl">
                        ${totals.totalGastosMenores!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 text-xl">
                        ${totals.totalVentas!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-xl">
                        ${totals.totalMontoRecaudado!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 text-xl">
                        ${totals.totalDeposito!.toFixed(2)}
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500">
                <p className="text-sm text-gray-600 mb-1">Total de Registros</p>
                <p className="text-3xl font-bold text-gray-900">{filteredData.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <p className="text-sm text-gray-600 mb-1">Total Cargos y Comisiones</p>
                <p className="text-3xl font-bold text-orange-600">${totals.totalCargosComisiones!.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <p className="text-sm text-gray-600 mb-1">Total Gastos Menores</p>
                <p className="text-3xl font-bold text-purple-600">${totals.totalGastosMenores!.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                <p className="text-3xl font-bold text-blue-600">${totals.totalVentas!.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
                <p className="text-sm text-gray-600 mb-1">Total Monto Recaudado</p>
                <p className="text-3xl font-bold text-emerald-600">${totals.totalMontoRecaudado!.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Total Depósito</p>
                <p className="text-3xl font-bold text-green-600">${totals.totalDeposito!.toFixed(2)}</p>
              </div>
            </div>

            <Button
              onClick={downloadCSV}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              📥 Descargar como CSV
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
