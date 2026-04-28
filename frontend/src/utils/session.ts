import { VISITED_SESSION_KEY } from '../constants/app'

export function hasVisitedSession(): boolean {
  return sessionStorage.getItem(VISITED_SESSION_KEY) === '1'
}

export function markVisitedSession(): void {
  sessionStorage.setItem(VISITED_SESSION_KEY, '1')
}
