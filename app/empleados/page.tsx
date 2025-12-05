"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Employee {
  id: string
  name: string
  created_at: string
}

interface EmployeePayment {
  id: string
  employee_id: string
  date: string
  payment_type: "cash" | "transferencia"
  amount: number
  created_at: string
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payments, setPayments] = useState<EmployeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Formulario de empleado
  const [newEmployeeName, setNewEmployeeName] = useState("")

  // Formulario de pago
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentType, setPaymentType] = useState<"cash" | "transferencia">("cash")
  const [paymentAmount, setPaymentAmount] = useState("")

  // Filtros
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterEmployeeId, setFilterEmployeeId] = useState("__all__")

  // Función helper para obtener la fecha local en formato YYYY-MM-DD
  const getLocalDateString = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    setPaymentDate(getLocalDateString())
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    try {
      // Cargar empleados
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .order("name", { ascending: true })

      if (employeesError) throw employeesError

      setEmployees(employeesData || [])

      // Cargar pagos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("employee_payments")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (paymentsError) throw paymentsError

      setPayments(paymentsData || [])
    } catch (err) {
      console.error("Empleados: Error loading data:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al cargar datos"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmployeeName.trim()) {
      setError("Por favor ingresa el nombre del empleado")
      return
    }

    try {
      setError("")
      setSaving(true)

      const supabase = createClient()
      const { error: insertError } = await supabase.from("employees").insert({
        name: newEmployeeName.trim(),
      })

      if (insertError) throw insertError

      setNewEmployeeName("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)

      await loadData()
    } catch (err) {
      console.error("Empleados: Error adding employee:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al agregar empleado"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployeeId || !paymentDate || !paymentAmount) {
      setError("Por favor completa todos los campos")
      return
    }

    const amountNum = Number.parseFloat(paymentAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser un número mayor a 0")
      return
    }

    try {
      setError("")
      setSaving(true)

      const supabase = createClient()
      const { error: insertError } = await supabase.from("employee_payments").insert({
        employee_id: selectedEmployeeId,
        date: paymentDate.trim(),
        payment_type: paymentType,
        amount: amountNum,
      })

      if (insertError) throw insertError

      // Limpiar formulario
      setPaymentAmount("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)

      await loadData()
    } catch (err) {
      console.error("Empleados: Error adding payment:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al agregar pago"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este pago?")
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from("employee_payments").delete().eq("id", id)

      if (deleteError) throw deleteError

      await loadData()
    } catch (err) {
      console.error("Empleados: Error deleting payment:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar pago"
      alert(errorMessage)
    }
  }

  // Filtrar pagos
  const getFilteredPayments = () => {
    let filtered = [...payments]

    if (filterStartDate) {
      filtered = filtered.filter((p) => p.date >= filterStartDate)
    }

    if (filterEndDate) {
      filtered = filtered.filter((p) => p.date <= filterEndDate)
    }

    if (filterEmployeeId && filterEmployeeId !== "__all__") {
      filtered = filtered.filter((p) => p.employee_id === filterEmployeeId)
    }

    return filtered
  }

  const filteredPayments = getFilteredPayments()

  // Calcular totales por empleado
  const getEmployeeTotals = (employeeId: string) => {
    const employeePayments = filteredPayments.filter((p) => p.employee_id === employeeId)
    const totalCash = employeePayments
      .filter((p) => p.payment_type === "cash")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalTransferencia = employeePayments
      .filter((p) => p.payment_type === "transferencia")
      .reduce((sum, p) => sum + p.amount, 0)
    const total = totalCash + totalTransferencia

    return { totalCash, totalTransferencia, total }
  }

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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

  const clearFilters = () => {
    setFilterStartDate("")
    setFilterEndDate("")
    setFilterEmployeeId("__all__")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">👥 Gestión de Empleados</h1>
            <p className="text-lg text-gray-600">Registra empleados y sus pagos</p>
          </div>
        </div>

        {/* Formulario de Empleado */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">➕ Agregar Empleado</h2>
          </div>
          <CardContent className="p-6">
            {success && (
              <div className="bg-green-50 border-2 border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4 font-semibold">
                ✓ Empleado agregado correctamente
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 font-semibold">
                ✗ {error}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="flex gap-4">
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Nombre del empleado"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Agregar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Formulario de Pago */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">💰 Registrar Pago</h2>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Empleado</label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} required>
                    <SelectTrigger className="w-full border-2 border-gray-200 focus:border-indigo-500">
                      <SelectValue placeholder="Selecciona un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pago</label>
                  <Select
                    value={paymentType}
                    onValueChange={(value) => setPaymentType(value as "cash" | "transferencia")}
                    required
                  >
                    <SelectTrigger className="w-full border-2 border-gray-200 focus:border-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                {saving ? "Guardando..." : "💾 Guardar Pago"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold">🔍 Filtrar Pagos</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Empleado</label>
                <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                  <SelectTrigger className="w-full border-2 border-gray-200 focus:border-indigo-500">
                    <SelectValue placeholder="Todos los empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los empleados</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {(filterStartDate || filterEndDate || (filterEmployeeId && filterEmployeeId !== "__all__")) && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
                📅 Mostrando pagos
                {filterStartDate && ` desde ${formatFilterDate(filterStartDate)}`}
                {filterEndDate && ` hasta ${formatFilterDate(filterEndDate)}`}
                {filterEmployeeId && filterEmployeeId !== "__all__" && ` • Empleado: ${employees.find((e) => e.id === filterEmployeeId)?.name}`}
                {" • "}
                <span className="font-semibold">{filteredPayments.length} pago(s)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Empleados con Pagos */}
        {loading ? (
          <p className="text-gray-600 text-center py-8">Cargando...</p>
        ) : employees.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No hay empleados registrados. ¡Agrega el primero arriba!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {employees.map((employee) => {
              const employeePayments = filteredPayments.filter((p) => p.employee_id === employee.id)
              const totals = getEmployeeTotals(employee.id)

              if (filterEmployeeId !== "__all__" && filterEmployeeId !== employee.id) {
                return null
              }

              return (
                <Card key={employee.id} className="shadow-lg border-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">{employee.name}</h2>
                      <div className="text-right">
                        <div className="text-sm opacity-90">Total Cash: ${totals.totalCash.toFixed(2)}</div>
                        <div className="text-sm opacity-90">Total Transferencia: ${totals.totalTransferencia.toFixed(2)}</div>
                        <div className="text-xl font-bold mt-1">Total: ${totals.total.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {employeePayments.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No hay pagos registrados para este empleado</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monto</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeePayments.map((payment, idx) => (
                              <tr
                                key={payment.id}
                                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-blue-50 transition"}
                              >
                                <td className="px-4 py-3 text-gray-900 font-medium">{formatDate(payment.date)}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      payment.payment_type === "cash"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {payment.payment_type === "cash" ? "Cash" : "Transferencia"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                  ${payment.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="text-xs"
                                  >
                                    🗑️ Eliminar
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

