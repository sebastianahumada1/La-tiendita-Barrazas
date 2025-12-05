"use client"

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUserName } from "@/lib/user"

const DailyPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [dateExists, setDateExists] = useState(false)
  const [checkingDate, setCheckingDate] = useState(false)

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

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
  const [gastosMenores, setGastosMenores] = useState(0) // Calculado automáticamente desde caja menor
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

    return {
      ventasNetas: Number.parseFloat(ventasNetas) || 0,
      montoRecaudado: (Number.parseFloat(ventasNetas) || 0) + (Number.parseFloat(cargosComisiones) || 0),
      totalVentas: totalVentasCalc,
      balance: balanceCalc,
    }
  }, [ventasBrutas, cargosComisiones, cash, ath, debitCard, creditCard, gastosMenores, ventasNetas, deposito, registradora])

  useEffect(() => {
    calculos()
  }, [cash, ath, debitCard, creditCard, gastosMenores, deposito, registradora, calculos])

  // Cargar gastos menores de caja menor para la fecha seleccionada
  useEffect(() => {
    loadGastosMenores()
  }, [selectedDate])

  const loadGastosMenores = async () => {
    setLoadingGastosMenores(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("caja_menor_records")
        .select("value")
        .eq("date", selectedDate)

      if (error) {
        // Si la tabla no existe aún, no es error crítico
        if (error.code !== "42P01") {
          console.error("Daily: Error loading gastos menores:", error)
        }
        setGastosMenores(0)
        return
      }

      const total = data?.reduce((sum, record) => sum + (record.value || 0), 0) || 0
      setGastosMenores(total)
    } catch (err) {
      console.error("Daily: Error loading gastos menores:", err)
      setGastosMenores(0)
    } finally {
      setLoadingGastosMenores(false)
    }
  }

  useEffect(() => {
    checkDateExists()
  }, [selectedDate])

  const checkDateExists = async () => {
    setCheckingDate(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("daily_records").select("id").eq("date", selectedDate).single()

    if (error && error.code !== "PGRST116") {
      console.error("Daily: Error checking date:", error)
    }

    setDateExists(!!data)
    setCheckingDate(false)
  }

  const handleSave = async () => {
    try {
      setError("")
      setLoading(true)

      // Validación de campos requeridos
      if (!ventasBrutas || !ventasNetas) {
        setError("Por favor completa las ventas brutas y ventas netas")
        setLoading(false)
        return
      }

      // Validar que las sumas tengan sentido
      const ventasBrutasNum = Number.parseFloat(ventasBrutas) || 0
      const ventasNetasNum = Number.parseFloat(ventasNetas) || 0
      const cargosComisionesNum = Number.parseFloat(cargosComisiones) || 0

      if (ventasBrutasNum < 0 || ventasNetasNum < 0) {
        setError("Las cantidades no pueden ser negativas")
        setLoading(false)
        return
      }

      // Verificar que ventas netas no sea mayor que ventas brutas (alerta, no bloqueo)
      if (ventasNetasNum > ventasBrutasNum) {
        const confirmed = window.confirm(
          "Las ventas netas son mayores que las ventas brutas. ¿Deseas continuar de todos modos?"
        )
        if (!confirmed) {
          setLoading(false)
          return
        }
      }

      // Verificar que los métodos de pago sumen algo cercano a las ventas
      const totalPaymentMethods =
        (Number.parseFloat(cash) || 0) +
        (Number.parseFloat(ath) || 0) +
        (Number.parseFloat(debitCard) || 0) +
        (Number.parseFloat(creditCard) || 0)

      const montoRecaudado = ventasNetasNum + cargosComisionesNum

      const difference = Math.abs(totalPaymentMethods - montoRecaudado)
      const threshold = montoRecaudado * 0.01 // 1% de tolerancia

      if (difference > threshold && difference > 0.5) {
        const confirmed = window.confirm(
          `La suma de métodos de pago ($${totalPaymentMethods.toFixed(2)}) no coincide con el monto recaudado ($${montoRecaudado.toFixed(2)}). Diferencia: $${difference.toFixed(2)}. ¿Deseas continuar de todos modos?`
        )
        if (!confirmed) {
          setLoading(false)
          return
        }
      }

      // Verificar que Balance no sea negativa
      if (balance < 0) {
        const confirmed = window.confirm(
          `El Balance resultaría negativo ($${balance.toFixed(2)}). Esto puede indicar un error. ¿Deseas continuar de todos modos?`
        )
        if (!confirmed) {
          setLoading(false)
          return
        }
      }

      // Confirmación final
      const finalConfirm = window.confirm(
        `¿Estás seguro de guardar el registro del ${getFormattedDate(selectedDate)}?`
      )
      if (!finalConfirm) {
        setLoading(false)
        return
      }

      // Verificar si ya existe un registro para esta fecha
      if (dateExists) {
        const overwrite = window.confirm(
          "Ya existe un registro para esta fecha. ¿Deseas crear uno nuevo de todos modos? (Esto creará un duplicado)"
        )
        if (!overwrite) {
          setLoading(false)
          return
        }
      }

      const supabase = createClient()

      const fecha = selectedDate

      // Obtener el nombre del día parseando manualmente la fecha para evitar problemas de zona horaria
      const [year, month, day] = fecha.split("-")
      const fechaDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      const dayName = fechaDate.toLocaleDateString("es-ES", { weekday: "long" })

      // Crear registro diario
      const { data: recordData, error: recordError } = await supabase
        .from("daily_records")
        .insert({
          date: fecha,
          day_name: dayName,
        })
        .select()
        .single()

      if (recordError) throw recordError

      // Guardar datos de ventas
      const salesInserts = [
        { record_id: recordData.id, category: "VENTAS BRUTAS", amount: Number.parseFloat(ventasBrutas) },
        { record_id: recordData.id, category: "CARGOS Y COMISIONES", amount: Number.parseFloat(cargosComisiones) || 0 },
        { record_id: recordData.id, category: "VENTAS NETAS", amount: Number.parseFloat(ventasNetas) },
        {
          record_id: recordData.id,
          category: "MONTO RECAUDADO",
          amount: (Number.parseFloat(ventasNetas) || 0) + (Number.parseFloat(cargosComisiones) || 0),
        },
      ]

      const { error: salesError } = await supabase.from("sales_data").insert(salesInserts)
      if (salesError) throw salesError

      // Guardar métodos de pago
      const paymentInserts = [
        { record_id: recordData.id, method: "CASH", amount: Number.parseFloat(cash) || 0 },
        { record_id: recordData.id, method: "ATH", amount: Number.parseFloat(ath) || 0 },
        { record_id: recordData.id, method: "DEBIT CARD (DC)", amount: Number.parseFloat(debitCard) || 0 },
        { record_id: recordData.id, method: "CREDIT CARD (CC)", amount: Number.parseFloat(creditCard) || 0 },
      ]

      const { error: paymentError } = await supabase.from("payment_methods").insert(paymentInserts)
      if (paymentError) throw paymentError

      // Guardar resumen
      const summaryInserts = [
        { record_id: recordData.id, label: "TOTAL VENTAS", amount: totalVentas, is_calculated: true },
        {
          record_id: recordData.id,
          label: "GASTOS MENORES",
          amount: gastosMenores,
          is_calculated: true,
        },
        { record_id: recordData.id, label: "BALANCE", amount: balance, is_calculated: true },
        { record_id: recordData.id, label: "DEPOSITO", amount: Number.parseFloat(deposito) || 0, is_calculated: false },
        { record_id: recordData.id, label: "REGISTRADORA", amount: Number.parseFloat(registradora) || 0, is_calculated: false },
      ]

      const { error: summaryError } = await supabase.from("summary_data").insert(summaryInserts)
      if (summaryError) throw summaryError

      // Create audit log
      const userName = getUserName()
      const { error: auditError } = await supabase.from("audit_log").insert({
        record_id: recordData.id,
        user_name: userName,
        action: "CREATE",
        changes: {
          ventasBrutas: Number.parseFloat(ventasBrutas),
          cargosComisiones: Number.parseFloat(cargosComisiones) || 0,
          ventasNetas: Number.parseFloat(ventasNetas),
          cash: Number.parseFloat(cash) || 0,
          ath: Number.parseFloat(ath) || 0,
          debitCard: Number.parseFloat(debitCard) || 0,
          creditCard: Number.parseFloat(creditCard) || 0,
          gastosMenores: gastosMenores,
          registradora: Number.parseFloat(registradora) || 0,
          deposito: Number.parseFloat(deposito) || 0,
        },
      })

      if (auditError && auditError.code !== "42P01") {
        // Log but don't fail if audit_log table doesn't exist yet
        console.error("Daily: Error creating audit log:", auditError)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (err) {
      console.error("Daily: Error al guardar:", err)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al guardar el registro"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getFormattedDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header mejorado */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-6 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-1">Nuevo Registro Caja Fuerte</h1>
            <p className="text-gray-500">Completa los datos de ventas de tu negocio</p>
          </div>

          {/* Selector de fecha mejorado */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Seleccionar fecha:</label>
            <div className="flex gap-4 items-end">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-3 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-semibold"
              />
              <div className="text-lg font-semibold text-gray-700">{getFormattedDate(selectedDate)}</div>
            </div>
            {checkingDate ? (
              <p className="text-sm text-gray-500 mt-3">Verificando fecha...</p>
            ) : dateExists ? (
              <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg text-sm font-semibold">
                ⚠️ Ya existe un registro para esta fecha
              </div>
            ) : null}
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-xl mb-6 font-semibold">
            ✓ Registro guardado correctamente
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
              {/* Ventas Brutas */}
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

              {/* Cargos y Comisiones */}
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

              {/* Ventas Netas */}
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

              {/* Monto Recaudado (Calculado) */}
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

            {/* Total Ventas (Calculado) */}
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? "Guardando..." : "Guardar Registro"}
            </button>
            <Link
              href="/"
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

export default DailyPage
