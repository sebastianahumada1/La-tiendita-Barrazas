"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface SessionRecord {
  id: string
  date: string
  category: string
  name: string
  value: number
  created_at: string
}

export default function NewCajaMenorPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    category: "",
    name: "",
    value: "",
  })

  // Función helper para obtener la fecha local en formato YYYY-MM-DD sin problemas de zona horaria
  const getLocalDateString = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Form fields
  const [date, setDate] = useState(getLocalDateString())
  const [category, setCategory] = useState("")
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

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

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()]
      setCategories(updated)
      localStorage.setItem("caja_menor_categories", JSON.stringify(updated))
      setCategory(newCategory.trim())
      setNewCategory("")
      setShowNewCategoryInput(false)
    }
  }

  const handleDeleteSessionRecord = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este registro? Se eliminará también de la base de datos.")
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase.from("caja_menor_records").delete().eq("id", id)

      if (deleteError) throw deleteError

      // Eliminar de la lista de sesión
      setSessionRecords(sessionRecords.filter((r) => r.id !== id))
    } catch (err) {
      console.error("NewCajaMenor: Error deleting record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el registro"
      alert(errorMessage)
    }
  }

  const handleEditSessionRecord = (record: SessionRecord) => {
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      category: record.category,
      name: record.name,
      value: record.value.toString(),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    const valueNum = Number.parseFloat(editForm.value)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError("El valor debe ser un número mayor a 0")
      return
    }

    try {
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

      // Actualizar en la lista de sesión
      setSessionRecords(
        sessionRecords.map((r) =>
          r.id === editingId
            ? {
                ...r,
                date: editForm.date,
                category: editForm.category,
                name: editForm.name,
                value: valueNum,
              }
            : r
        )
      )

      setEditingId(null)
      setEditForm({ date: "", category: "", name: "", value: "" })
      setError("")
    } catch (err) {
      console.error("NewCajaMenor: Error updating record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar el registro"
      setError(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ date: "", category: "", name: "", value: "" })
    setError("")
  }

  const formatRecordDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const sessionTotal = sessionRecords.reduce((sum, record) => sum + record.value, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !category || category === "__new__" || !name || !value) {
      setError("Por favor completa todos los campos")
      return
    }

    if (showNewCategoryInput && !newCategory.trim()) {
      setError("Por favor completa el nombre de la nueva categoría o cancela")
      return
    }

    const valueNum = Number.parseFloat(value)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError("El valor debe ser un número mayor a 0")
      return
    }

    try {
      setError("")
      setSaving(true)

      const supabase = createClient()

      // Asegurar que la fecha se guarde correctamente sin problemas de zona horaria
      const dateToSave = date.trim()

      const { data: insertedData, error: insertError } = await supabase
        .from("caja_menor_records")
        .insert({
          date: dateToSave,
          category: category.trim(),
          name: name.trim(),
          value: valueNum,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Agregar el registro a la lista de sesión con el ID real de la base de datos
      if (insertedData) {
        const newRecord: SessionRecord = {
          id: insertedData.id,
          date: insertedData.date,
          category: insertedData.category,
          name: insertedData.name,
          value: insertedData.value,
          created_at: insertedData.created_at,
        }
        setSessionRecords([...sessionRecords, newRecord])
      }

      // Limpiar formulario (excepto categoría y fecha)
      setName("")
      setValue("")
      setSuccess(true)

      // Ocultar mensaje de éxito después de 2 segundos
      setTimeout(() => {
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error("NewCajaMenor: Error saving record:", err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el registro"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-6 inline-flex items-center gap-1 font-semibold text-sm transition"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-1">Nuevo Registro Caja Menor</h1>
            <p className="text-gray-500">Completa los datos del gasto de caja menor</p>
          </div>
        </div>

        {/* Formulario */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">➕ Agregar Nuevo Registro</h2>
          </div>
          <CardContent className="p-7">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                  {!showNewCategoryInput ? (
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setShowNewCategoryInput(true)
                        } else {
                          setCategory(value)
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="w-full border-2 border-gray-200 focus:border-emerald-500 text-lg py-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="text-emerald-600 font-semibold">
                          ➕ Crear nueva categoría
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nombre de la nueva categoría"
                        className="flex-1 px-4 py-3 text-lg border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addNewCategory()
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={addNewCategory}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                        disabled={!newCategory.trim()}
                      >
                        ✓
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false)
                          setNewCategory("")
                          setCategory("")
                        }}
                        variant="outline"
                        className="border-2 border-gray-300 px-4"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre/Descripción</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Compra de materiales, Pago a proveedor..."
                    required
                    className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  {saving ? "Guardando..." : "💾 Guardar Registro"}
                </Button>
                <Link
                  href="/caja-menor"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-lg text-lg text-center transition flex items-center justify-center"
                >
                  Ver Registros
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Registros de la Sesión */}
        {sessionRecords.length > 0 && (
          <Card className="mt-8 shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📋 Registros de esta Sesión</h2>
                <div className="text-xl font-bold">
                  Total: <span className="text-emerald-100">${sessionTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
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
                    {sessionRecords.map((record, idx) => {
                      if (editingId === record.id) {
                        return (
                          <tr key={record.id} className="bg-yellow-50">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="space-y-4">
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
                                onClick={() => handleEditSessionRecord(record)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                              >
                                ✏️ Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSessionRecord(record.id)}
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

