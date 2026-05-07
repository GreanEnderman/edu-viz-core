import { DEFAULT_API_BASE } from '../constants/app'

export const API_BASE = import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE

function buildUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), init)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(buildUrl(path), init)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
}
