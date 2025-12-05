import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""
  // Parsear manualmente el string YYYY-MM-DD para evitar problemas de zona horaria
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return dateString
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getSpanishDayName(date: Date): string {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][date.getDay()]
}
