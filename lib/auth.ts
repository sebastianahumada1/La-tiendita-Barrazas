"use client"

// Credenciales hasheadas (u
// El hash se genera con SHA-256 + salt para evitar tener la contraseña en texto plano
// Salt fijo para consistencia (en producción usar salt único por usuario)
const SALT = "tiendita_barrazas_2024"
const HASHED_PASSWORD = "407a4675f8855f5b5af882e0ee161304" // SHA-256 de "0306$$" + SALT (primeros 32 caracteres)
const VALID_USERNAME = "yaz"

// Función para hashear una contraseña usando SHA-256 con salt
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  // Combinar contraseña con salt
  const saltedPassword = password + SALT
  const data = encoder.encode(saltedPassword)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  // Usar solo los primeros 32 caracteres para el hash final (más seguro)
  return hashHex.substring(0, 32)
}

// Función para verificar credenciales
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (username !== VALID_USERNAME) {
    return false
  }
  
  try {
    const passwordHash = await hashPassword(password)
    // Debug: solo en desarrollo (remover en producción)
    if (process.env.NODE_ENV === "development") {
      console.log("Password hash:", passwordHash)
      console.log("Expected hash:", HASHED_PASSWORD)
      console.log("Match:", passwordHash === HASHED_PASSWORD)
    }
    return passwordHash === HASHED_PASSWORD
  } catch (error) {
    console.error("Error verifying password:", error)
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

