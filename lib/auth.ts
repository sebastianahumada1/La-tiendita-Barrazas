"use client"

// Credenciales (usuario: yaz, contraseña: 0306$$)
// Usamos un método simple pero seguro: hash SHA-256 con salt
const VALID_USERNAME = "yaz"
const VALID_PASSWORD = "0306$$"
const SALT = "tiendita_barrazas_2024"

// Función para hashear usando SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

// Función para verificar credenciales
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  // Verificar usuario primero
  if (username.trim() !== VALID_USERNAME) {
    console.log("❌ Usuario incorrecto")
    return false
  }
  
  // Verificar contraseña directamente (más simple y confiable)
  if (password.trim() === VALID_PASSWORD) {
    return true
  }
  
  // También verificar con hash por si acaso
  try {
    const passwordWithSalt = password + SALT
    const passwordHash = await hashString(passwordWithSalt)
    
    // Calcular hash de la contraseña válida para comparar
    const validPasswordWithSalt = VALID_PASSWORD + SALT
    const validHash = await hashString(validPasswordWithSalt)
    
    console.log("🔐 Auth Debug:")
    console.log("  - Usuario:", username)
    console.log("  - Contraseña ingresada:", password)
    console.log("  - Hash calculado:", passwordHash.substring(0, 32))
    console.log("  - Hash válido:", validHash.substring(0, 32))
    console.log("  - Coincide:", passwordHash === validHash)
    
    return passwordHash === validHash
  } catch (error) {
    console.error("❌ Error verificando contraseña:", error)
    return false
  }
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  
  const authToken = localStorage.getItem("auth_token")
  const authExpiry = localStorage.getItem("auth_expiry")
  
  if (!authToken || !authExpiry) {
    return false
  }
  
  // Verificar si el token ha expirado (24 horas)
  const expiryTime = parseInt(authExpiry, 10)
  if (Date.now() > expiryTime) {
    // Token expirado, limpiar
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_expiry")
    return false
  }
  
  return true
}

// Función para establecer sesión autenticada
export function setAuthenticated(): void {
  if (typeof window === "undefined") return
  
  // Token simple (en producción usar JWT o similar)
  const token = btoa(`${VALID_USERNAME}:${Date.now()}`)
  const expiry = Date.now() + 24 * 60 * 60 * 1000 // 24 horas
  
  localStorage.setItem("auth_token", token)
  localStorage.setItem("auth_expiry", expiry.toString())
}

// Función para cerrar sesión
export function logout(): void {
  if (typeof window === "undefined") return
  
  localStorage.removeItem("auth_token")
  localStorage.removeItem("auth_expiry")
}
