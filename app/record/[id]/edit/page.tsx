"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserName } from "@/lib/user"

export default function EditRecordPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [selectedDate, setSelectedDate] = useState("")
  const [dayName, setDayName] = useState("")

  // Original values for comparison
  const [originalData, setOriginalData] = useState<any>(null)

  // Ventas
  const [ventasBrutas, setVentasBrutas] = useState("0.00")
  const [cargosComisiones, setCargosComisiones] = useState("0.00")
  const [ventasNetas, setVentasNetas] = useState("0.00")

  // Métodos de pago
  const [cash, setCash] = useState("0.00")
  const [ath, setAth] = useState("0.00")
  const [debitCard, setDebitCard] = useState("0.00")
  const [creditCard, setCreditCard] = useState("0.00")

  // Resumen
  const [registradora, setRegistradora] = useState("147.50") // Valor fijo
  const [gastosMenores, setGastosMenores] = useState(0) // Calculado automáticamente
  const [deposito, setDeposito] = useState("0.00")
  const [totalVentas, setTotalVentas] = useState(0)
  const [balance, setBalance] = useState(0)
  const [loadingGastosMenores, setLoadingGastosMenores] = useState(false)

  const calculos = useCallback(() => {
    const cash_ = Number.parseFloat(cash) || 0
    const ath_ = Number.parseFloat(ath) || 0
    const debit = Number.parseFloat(debitCard) || 0
    const credit = Number.parseFloat(creditCard) || 0

    const totalVentasCalc = cash_ + ath_ + debit + credit
    setTotalVentas(totalVentasCalc)

    const deposito_ = Number.parseFloat(deposito) || 0
    const registradora_ = Number.parseFloat(registradora) || 0
    // Balance = Cash - Gastos Menores - Registradora - Depósito
    let balanceCalc = cash_ - gastosMenores - registradora_ - deposito_
    // Normalizar -0.00 a 0.00 para evitar mostrar "-0.00"
    if (Math.abs(balanceCalc) < 0.01) {
      balanceCalc = 0
    }
    setBalance(balanceCalc)
  }, [cash, ath, debitCard, creditCard, gastosMenores, deposito, registradora])

  useEffect(() => {
    calculos()
  }, [cash, ath, debitCard, creditCard, gastosMenores, deposito, registradora, calculos])

  useEffect(() => {
    loadRecordData()
  }, [recordId])

  // Cargar gastos menores de caja menor para la fecha del registro
  useEffect(() => {
    if (selectedDate) {
      loadGastosMenores()
    }
  }, [selectedDate])

  const loadGastosMenores = async () => {
    if (!selectedDate) return
    setLoadingGastosMenores(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("caja_menor_records")
        .select("value")
        .eq("date", selectedDate)

      if (error) {
        if (error.code !== "42P01") {
          console.error("EditRecord: Error loading gastos menores:", error)
        }
        setGastosMenores(0)
        return
      }

      const total = data?.reduce((sum, record) => sum + (record.value || 0), 0) || 0
      setGastosMenores(total)
    } catch (err) {
      console.error("EditRecord: Error loading gastos menores:", err)
      setGastosMenores(0)
    } finally {
      setLoadingGastosMenores(false)
    }
  }

  const loadRecordData = async () => {
    const supabase = createClient()

    try {
      // Load record
      const { data: recordData, error: recordError } = await supabase
        .from("daily_records")
        .select("*")
        .eq("id", recordId)
        .single()

      if (recordError) throw recordError

      setSelectedDate(recordData.date)
      setDayName(recordData.day_name)

      // Load sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales_data")
        .select("*")
        .eq("record_id", recordId)

      if (salesError) throw salesError

      const ventasBrutasData = salesData?.find((s) => s.category === "VENTAS BRUTAS")
      const cargosData = salesData?.find((s) => s.category === "CARGOS Y COMISIONES")
      const ventasNetasData = salesData?.find((s) => s.category === "VENTAS NETAS")

      setVentasBrutas(ventasBrutasData?.amount.toFixed(2) || "0.00")
      setCargosComisiones(cargosData?.amount.toFixed(2) || "0.00")
      setVentasNetas(ventasNetasData?.amount.toFixed(2) || "0.00")

      // Load payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("record_id", recordId)

      if (paymentError) throw paymentError

      const cashData = paymentData?.find((p) => p.method === "CASH")
      const athData = paymentData?.find((p) => p.method === "ATH")
      const debitData = paymentData?.find((p) => p.method === "DEBIT CARD (DC)")
      const creditData = paymentData?.find((p) => p.method === "CREDIT CARD (CC)")

      setCash(cashData?.amount.toFixed(2) || "0.00")
      setAth(athData?.amount.toFixed(2) || "0.00")
      setDebitCard(debitData?.amount.toFixed(2) || "0.00")
      setCreditCard(creditData?.amount.toFixed(2) || "0.00")

      // Load summary data
      const { data: summaryData, error: summaryError } = await supabase
        .from("summary_data")
        .select("*")
        .eq("record_id", recordId)

      if (summaryError) throw summaryError

      const gastosMenoresData = summaryData?.find((s) => s.label === "GASTOS MENORES")
      const depositoData = summaryData?.find((s) => s.label === "DEPOSITO")
      const registradoraData = summaryData?.find((s) => s.label === "REGISTRADORA")

      // Cargar gastos menores desde caja_menor_records (se calculará automáticamente)
      // Por ahora usar el valor guardado si existe, pero se actualizará con loadGastosMenores
      setGastosMenores(gastosMenoresData?.amount || 0)
      setDeposito(depositoData?.amount.toFixed(2) || "0.00")
      setRegistradora(registradoraData?.amount.toFixed(2) || "147.50")

      // Store original data for change tracking
      setOriginalData({
        date: recordData.date,
        ventasBrutas: ventasBrutasData?.amount.toFixed(2) || "0.00",
        cargosComisiones: cargosData?.amount.toFixed(2) || "0.00",
        ventasNetas: ventasNetasData?.amount.toFixed(2) || "0.00",
        cash: cashData?.amount.toFixed(2) || "0.00",
        ath: athData?.amount.toFixed(2) || "0.00",
        debitCard: debitData?.amount.toFixed(2) || "0.00",
        creditCard: creditData?.amount.toFixed(2) || "0.00",
        gastosMenores: gastosMenoresData?.amount || 0,
        registradora: registradoraData?.amount.toFixed(2) || "147.50",
        deposito: depositoData?.amount.toFixed(2) || "0.00",
      })
    } catch (err) {
      console.error("EditRecord: Error loading record data:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar el registro"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getChanges = () => {
    if (!originalData) return {}

    const changes: any = {}
    const current = {
      ventasBrutas,
      cargosComisiones,
      ventasNetas,
      cash,
      ath,
      debitCard,
      creditCard,
      gastosMenores,
      registradora,
      deposito,
    }

    Object.keys(current).forEach((key) => {
      if (current[key as keyof typeof current] !== originalData[key]) {
        changes[key] = {
          old: originalData[key],
          new: current[key as keyof typeof current],
        }
      }
    })

    // Agregar cambio de fecha si existe
    if (selectedDate !== originalData.date) {
      changes.date = {
        old: originalData.date,
        new: selectedDate,
      }
    }

    return changes
  }

  const handleSave = async () => {
    try {
      setError("")
      setSaving(true)

      // Validación básica
      if (!ventasBrutas || !ventasNetas) {
        setError("Por favor completa las ventas brutas y ventas netas")
        setSaving(false)
        return
      }

      // Get changes
      const changes = getChanges()

      // Verificar si la fecha cambió
      const dateChanged = selectedDate !== originalData?.date

      if (Object.keys(changes).length === 0 && !dateChanged) {
        setError("No se detectaron cambios")
        setSaving(false)
        return
      }

      // Confirm changes
      const confirmed = window.confirm(
        `¿Estás seguro de guardar los cambios?\n\nSe modificaron ${Object.keys(changes).length + (dateChanged ? 1 : 0)} campo(s).`
      )

      if (!confirmed) {
        setSaving(false)
        return
      }

      const supabase = createClient()
      const userName = getUserName()

      // Actualizar fecha y día si cambió
      if (dateChanged) {
        // Obtener el nombre del día parseando manualmente la fecha
        const [year, month, day] = selectedDate.split("-")
        const fechaDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        const newDayName = fechaDate.toLocaleDateString("es-ES", { weekday: "long" })

        const { error: dateError } = await supabase
          .from("daily_records")
          .update({
            date: selectedDate,
            day_name: newDayName,
          })
          .eq("id", recordId)

        if (dateError) throw dateError

        // Actualizar el estado local
        setDayName(newDayName)
      }

      // Update sales data
      const salesUpdates = [
        { category: "VENTAS BRUTAS", amount: Number.parseFloat(ventasBrutas) },
        { category: "CARGOS Y COMISIONES", amount: Number.parseFloat(cargosComisiones) || 0 },
        { category: "VENTAS NETAS", amount: Number.parseFloat(ventasNetas) },
        {
          category: "MONTO RECAUDADO",
          amount: (Number.parseFloat(ventasNetas) || 0) + (Number.parseFloat(cargosComisiones) || 0),
        },
      ]

      for (const update of salesUpdates) {
        const { error: updateError } = await supabase
          .from("sales_data")
          .update({ amount: update.amount })
          .eq("record_id", recordId)
          .eq("category", update.category)

        if (updateError) throw updateError
      }

      // Update payment methods
      const paymentUpdates = [
        { method: "CASH", amount: Number.parseFloat(cash) || 0 },
        { method: "ATH", amount: Number.parseFloat(ath) || 0 },
        { method: "DEBIT CARD (DC)", amount: Number.parseFloat(debitCard) || 0 },
        { method: "CREDIT CARD (CC)", amount: Number.parseFloat(creditCard) || 0 },
      ]

      for (const update of paymentUpdates) {
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({ amount: update.amount })
          .eq("record_id", recordId)
          .eq("method", update.method)

        if (updateError) throw updateError
      }

      // Update summary data
      const summaryUpdates = [
        { label: "TOTAL VENTAS", amount: totalVentas, is_calculated: true },
        { label: "GASTOS MENORES", amount: gastosMenores, is_calculated: true },
        { label: "BALANCE", amount: balance, is_calculated: true },
        { label: "DEPOSITO", amount: Number.parseFloat(deposito) || 0, is_calculated: false },
        { label: "REGISTRADORA", amount: Number.parseFloat(registradora) || 0, is_calculated: false },
      ]

      for (const update of summaryUpdates) {
        const { error: updateError } = await supabase
          .from("summary_data")
          .update({ amount: update.amount })
          .eq("record_id", recordId)
          .eq("label", update.label)

        if (updateError) throw updateError
      }

      // Agregar cambio de fecha al log de auditoría si existe
      const finalChanges = { ...changes }
      if (dateChanged) {
        finalChanges.date = {
          old: originalData.date,
          new: selectedDate,
        }
      }

      // Create audit log
      const { error: auditError } = await supabase.from("audit_log").insert({
        record_id: recordId,
        user_name: userName,
        action: "UPDATE",
        changes: finalChanges,
      })

      if (auditError && auditError.code !== "42P01") {
        // Log but don't fail if audit_log table doesn't exist yet
        console.error("EditRecord: Error creating audit log:", auditError)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/record/${recordId}`)
      }, 1500)
    } catch (err) {
      console.error("EditRecord: Error saving changes:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar los cambios"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const getFormattedDate = (dateString: string) => {
    if (!dateString) return ""
    // Parsear manualmente el string YYYY-MM-DD para evitar problemas de zona horaria
    const [year, month, day] = dateString.split("-")
    if (!year || !month || !day) return dateString
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/record/${recordId}`}
            className="text-indigo-600 hover:text-indigo-800 mb-6 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al detalle
          </Link>

          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-1">Editar Registro</h1>
            
            {/* Selector de fecha editable */}
            <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha del registro:</label>
              <div className="flex gap-4 items-end">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    // Actualizar el nombre del día cuando cambie la fecha
                    const [year, month, day] = e.target.value.split("-")
                    if (year && month && day) {
                      const fechaDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
                      setDayName(fechaDate.toLocaleDateString("es-ES", { weekday: "long" }))
                    }
                  }}
                  className="px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-semibold"
                />
                <div className="text-lg font-semibold text-gray-700">
                  {dayName && getFormattedDate(selectedDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-xl mb-6 font-semibold">
            ✓ Cambios guardados correctamente
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 font-semibold">
            ✗ {error}
          </div>
        )}

        <form className="space-y-6">
          {/* Sección 1: Ventas */}
          <div className="bg-white rounded-xl p-7 shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                1
              </span>
              Ventas
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ventas Brutas</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={ventasBrutas}
                    onChange={(e) => setVentasBrutas(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cargos y Comisiones (Impuestos)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cargosComisiones}
                    onChange={(e) => setCargosComisiones(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ventas Netas</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={ventasNetas}
                    onChange={(e) => setVentasNetas(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Recaudado</label>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-lg border-2 border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Ventas Netas + Cargos y Comisiones</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    ${((Number.parseFloat(ventasNetas) || 0) + (Number.parseFloat(cargosComisiones) || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Métodos de Pago */}
          <div className="bg-white rounded-xl p-7 shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                2
              </span>
              Métodos de Pago
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Cash", value: cash, setValue: setCash },
                { label: "ATH", value: ath, setValue: setAth },
                { label: "Debit Card (DC)", value: debitCard, setValue: setDebitCard },
                { label: "Credit Card (CC)", value: creditCard, setValue: setCreditCard },
              ].map((method) => (
                <div key={method.label}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{method.label}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={method.value}
                      onChange={(e) => method.setValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">Total de ventas (suma de métodos)</p>
              <p className="text-3xl font-bold text-purple-600">${totalVentas.toFixed(2)}</p>
            </div>
          </div>

          {/* Sección 3: Resumen */}
          <div className="bg-white rounded-xl p-7 shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                3
              </span>
              Resumen
            </h2>

            <div className="space-y-5">
              {/* Gastos Menores (Calculado automáticamente) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gastos Menores</label>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    Suma de registros de Caja Menor para {getFormattedDate(selectedDate)}
                    {loadingGastosMenores && " (cargando...)"}
                  </p>
                  <p className="text-3xl font-bold text-purple-600">${gastosMenores.toFixed(2)}</p>
                  {gastosMenores > 0 && (
                    <Link
                      href={`/caja-menor?date=${selectedDate}`}
                      className="text-xs text-purple-600 hover:text-purple-800 underline mt-2 inline-block"
                    >
                      Ver registros de caja menor →
                    </Link>
                  )}
                </div>
              </div>

              {/* Registradora (Valor fijo) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Registradora</label>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-5 rounded-lg border-2 border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Valor fijo</p>
                  <p className="text-3xl font-bold text-gray-700">${registradora}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Depósito</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={deposito}
                    onChange={(e) => setDeposito(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>

              {/* Revisión de balance (Calculado) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Revisión de balance</label>
                <div
                  className={`p-5 rounded-lg border-2 ${
                    Math.abs(balance) < 0.01
                      ? "bg-gradient-to-br from-green-200 to-emerald-200 border-green-400"
                      : "bg-gradient-to-br from-red-200 to-rose-200 border-red-400"
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${Math.abs(balance) < 0.01 ? "text-green-800" : "text-red-800"}`}>
                    Cash - Gastos menores - Registradora - Depósito
                  </p>
                  <p
                    className={`text-3xl font-bold ${Math.abs(balance) < 0.01 ? "text-green-800" : "text-red-800"}`}
                  >
                    ${balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {saving ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
            <Link
              href={`/record/${recordId}`}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-lg text-lg text-center transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

