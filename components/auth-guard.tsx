"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // No proteger la ruta de login
    if (pathname === "/login") {
      setIsChecking(false)
      return
    }

    // Verificar autenticación
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    setIsChecking(false)
  }, [pathname, router])

  // Mostrar loading mientras verifica
  if (isChecking && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

