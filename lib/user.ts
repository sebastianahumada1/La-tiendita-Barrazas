// User management for audit tracking
// Simple localStorage-based system since there's no auth

const USER_KEY = "tiendita_user_name"

export function getUserName(): string {
  if (typeof window === "undefined") return "Sistema"
  
  const stored = localStorage.getItem(USER_KEY)
  if (stored) return stored
  
  // First time - prompt for name
  const name = window.prompt("¿Cuál es tu nombre? (Para el historial de cambios)")
  if (name && name.trim()) {
    localStorage.setItem(USER_KEY, name.trim())
    return name.trim()
  }
  
  return "Usuario Anónimo"
}

export function setUserName(name: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_KEY, name.trim())
}

export function clearUserName(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(USER_KEY)
}

