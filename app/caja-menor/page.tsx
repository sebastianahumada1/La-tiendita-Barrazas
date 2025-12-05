"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { getUserName } from "@/lib/user"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CajaMenorRecord {
  id: string
  date: string
  category: string
  name: string
  value: number
  created_at: string
}

export default function CajaMenorPage() {
  const [records, setRecords] = useState<CajaMenorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    category: "",
    name: "",
    value: "",
  })
  const [error, setError] = useState("")

  // Filtros
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterCategory, setFilterCategory] = useState("__all__")

  // Cargar categorías guardadas desde localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem("caja_menor_categories")
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories)
      setCategories(parsed)
    } else {
      // Categoría inicial: Payroll
      const initialCategories = ["Payroll"]
      setCategories(initialCategories)
      localStorage.setItem("caja_menor_categories", JSON.stringify(initialCategories))
    }
  }, [])

  useEffect(() => {
    loadRecords()
  }, [])


  const loadRecords = async () => {
    const supabase = createClient()

    try {
      const { data, error: fetchError } = await supabase
        .from("caja_menor_records")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Debug: verificar las fechas que vienen de la BD
      if (data && data.length > 0) {
        console.log("CajaMenor: Fechas recuperadas de BD:", data.map((r) => ({ id: r.id, date: r.date })))
      }

      setRecords(data || [])
    } catch (err) {
      console.error("CajaMenor: Error loading records:", err)
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este registro?")

    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from("caja_menor_records").delete().eq("id", id)

      if (deleteError) throw deleteError

      await loadRecords()
    } catch (err) {
      console.error("CajaMenor: Error deleting record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el registro"
      alert(errorMessage)
    }
  }

  const handleEdit = (record: CajaMenorRecord) => {
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      category: record.category,
      name: record.name,
      value: record.value.toString(),
    })
    setError("")
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    const valueNum = Number.parseFloat(editForm.value)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError("El valor debe ser un número mayor a 0")
      return
    }

    if (!editForm.date || !editForm.category || !editForm.name) {
      setError("Por favor completa todos los campos")
      return
    }

    try {
      setError("")
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("caja_menor_records")
        .update({
          date: editForm.date,
          category: editForm.category,
          name: editForm.name,
          value: valueNum,
        })
        .eq("id", editingId)

      if (updateError) throw updateError

      await loadRecords()
      setEditingId(null)
      setEditForm({ date: "", category: "", name: "", value: "" })
    } catch (err) {
      console.error("CajaMenor: Error updating record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar el registro"
      setError(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ date: "", category: "", name: "", value: "" })
    setError("")
  }

  // Filtrar registros
  const getFilteredRecords = () => {
    let filtered = [...records]

    // Filtrar por fecha inicial
    if (filterStartDate) {
      filtered = filtered.filter((record) => record.date >= filterStartDate)
    }

    // Filtrar por fecha final
    if (filterEndDate) {
      filtered = filtered.filter((record) => record.date <= filterEndDate)
    }

    // Filtrar por categoría
    if (filterCategory && filterCategory !== "__all__") {
      filtered = filtered.filter((record) => record.category === filterCategory)
    }

    return filtered
  }

  const filteredRecords = getFilteredRecords()

  // Ordenar registros por fecha (más reciente primero) y luego por created_at
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date) // Fecha descendente
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // Más reciente primero
  })

  // Calcular total general (de registros filtrados)
  const totalGeneral = filteredRecords.reduce((sum, record) => sum + record.value, 0)

  const clearFilters = () => {
    setFilterStartDate("")
    setFilterEndDate("")
    setFilterCategory("__all__")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">📝 Registros Caja Menor</h1>
              <p className="text-lg text-gray-600">Consulta y gestiona los registros de caja menor</p>
            </div>
            <Link href="/caja-menor/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                ➕ Nuevo Registro
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold">🔍 Filtrar Registros</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full border-2 border-gray-200 focus:border-emerald-500">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
            {(filterStartDate || filterEndDate || (filterCategory && filterCategory !== "__all__")) && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
                📅 Mostrando registros
                {filterStartDate && ` desde ${formatFilterDate(filterStartDate)}`}
                {filterEndDate && ` hasta ${formatFilterDate(filterEndDate)}`}
                {filterCategory && filterCategory !== "__all__" && ` • Categoría: ${filterCategory}`}
                {" • "}
                <span className="font-semibold">{filteredRecords.length} registro(s)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Registros */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">📋 Registros Guardados</h2>
              <div className="text-xl font-bold">
                Total General: <span className="text-emerald-100">${totalGeneral.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {loading ? (
              <p className="text-gray-600 text-center py-8">Cargando...</p>
            ) : records.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay registros aún. ¡Crea el primero desde el botón "Nuevo Registro"!</p>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, idx) => {
                      // Formatear fecha directamente desde el string YYYY-MM-DD sin conversión de zona horaria
                      const formatRecordDate = (dateString: string): string => {
                        const [year, month, day] = dateString.split("-")
                        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
                        return date.toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }

                      if (editingId === record.id) {
                        return (
                          <tr key={record.id} className="bg-yellow-50">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="space-y-4">
                                {error && (
                                  <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-2 rounded-lg text-sm font-semibold">
                                    ✗ {error}
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha</label>
                                    <input
                                      type="date"
                                      value={editForm.date}
                                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                                    <Select
                                      value={editForm.category}
                                      onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                                    >
                                      <SelectTrigger className="w-full border-2 border-emerald-500 text-sm py-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((cat) => (
                                          <SelectItem key={cat} value={cat}>
                                            {cat}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Valor</label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2 text-sm text-gray-400">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.value}
                                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                                        className="w-full pl-6 pr-3 py-2 text-sm border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveEdit}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2"
                                  >
                                    ✓ Guardar
                                  </Button>
                                  <Button
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    className="border-2 border-gray-300 text-sm px-4 py-2"
                                  >
                                    ✕ Cancelar
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      }
                      
                      return (
                        <tr
                          key={record.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-emerald-50 transition"}
                        >
                          <td className="px-4 py-3 text-gray-900 font-medium">{formatRecordDate(record.date)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{record.category}</td>
                        <td className="px-4 py-3 text-gray-700">{record.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          ${record.value.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(record.id)}
                              className="text-xs px-3 py-1"
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
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

