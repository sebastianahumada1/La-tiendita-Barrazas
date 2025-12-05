"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

interface DailyRecord {
  id: string
  date: string
  day_name: string
}

export default function HomePage() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .order("date", { ascending: false })
        .limit(7)

      if (error) {
        throw error
      }

      setRecords(data || [])
      // Check if today has a record
      const today = new Date().toISOString().split("T")[0]
      const today_record = data?.find((r) => r.date === today)
      setTodayRecord(today_record || null)
    } catch (error) {
      console.error("HomePage: Error loading records:", error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">La tiendita Barrazas</h1>
          <p className="text-lg text-gray-600">Control de ventas diarias</p>
        </div>

        {/* Main Action Buttons */}
        <div className="mb-8 space-y-4">
          <Link href="/caja-menor/new" className="w-full block">
            <Button className="w-full h-16 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg">
              📝 Nuevo Registro Caja Menor
            </Button>
          </Link>
          <Link href="/daily" className="w-full block">
            <Button className="w-full h-16 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg">
              {todayRecord ? "✓ Caja Fuerte registrada" : "💰 Nuevo Registro Caja Fuerte"}
            </Button>
          </Link>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Últimos registros</h2>

          {loading ? (
            <p className="text-gray-600">Cargando...</p>
          ) : records.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No hay registros aún. ¡Comienza registrando hoy!</p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Link key={record.id} href={`/record/${record.id}`} className="block">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-blue-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{record.day_name}</p>
                        <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                      </div>
                      <div className="text-indigo-600 font-semibold">Ver →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/caja-fuerte" className="block h-full">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-0 h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col flex-1">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-gray-900">Registros Caja Fuerte</h3>
                <p className="text-sm text-gray-600 mt-1">Ver y editar registros</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/caja-menor" className="block h-full">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-0 h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col flex-1">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-900">Registros Caja Menor</h3>
                <p className="text-sm text-gray-600 mt-1">Gestionar caja menor</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports" className="block h-full">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-0 h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col flex-1">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900">Reportes</h3>
                <p className="text-sm text-gray-600 mt-1">Ver todos los registros</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/empleados" className="block h-full">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white border-0 h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col flex-1">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-900">Empleados</h3>
                <p className="text-sm text-gray-600 mt-1">Gestionar empleados y pagos</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}
