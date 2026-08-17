// ── Auth & session (API-backed) ────────────────────────────────────────────────
// Login/session now live on the Laravel backend (Sanctum). This module keeps the
// client-side pieces the UI needs: the page catalogue, the access guard, and a
// thin session wrapper stored in localStorage (the token is held by ./api).

import * as api from './api'

// ── Page keys ───────────────────────────────────────────────────────────────────
export type PageKey =
  | 'dsr-list'
  | 'dsr-form'
  | 'backup-list'
  | 'backup-form'
  | 'clients'

export interface PageDef {
  key: PageKey
  label: string
  desc: string
  group: string
  /** Pages that must also be enabled when this one is enabled */
  requires?: PageKey
}

export const PAGE_DEFS: PageDef[] = [
  { key: 'dsr-list',    label: 'Daily DSR — View',            desc: 'View all DSR records and history',              group: 'Daily DSR' },
  { key: 'dsr-form',    label: 'Daily DSR — Create / Edit',   desc: 'Create, submit, approve Daily Status Reports',  group: 'Daily DSR',    requires: 'dsr-list' },
  { key: 'backup-list', label: 'Backup Tests — View',         desc: 'View monthly backup test records',              group: 'Backup Tests' },
  { key: 'backup-form', label: 'Backup Tests — Create / Edit',desc: 'Create, edit and approve monthly backup tests', group: 'Backup Tests', requires: 'backup-list' },
  { key: 'clients',     label: 'Client Management',           desc: 'Add, edit and manage backup-test clients',      group: 'Admin' },
]

// ── Auth session shape returned by the API ───────────────────────────────────────
export interface AuthSession {
  id: string
  username: string
  displayName: string
  roleName: string
  isAdmin: boolean
  pages: PageKey[]
}

// ── Storage key for the in-memory session (token is in ./api) ────────────────────
const SESSION_KEY = 'srs_auth_v2'

// ── Session helpers ───────────────────────────────────────────────────────────────
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function setStoredSession(session: AuthSession | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

// ── Auth operations ───────────────────────────────────────────────────────────────
export async function login(username: string, password: string): Promise<AuthSession> {
  const { token, user } = await api.login(username.trim(), password)
  api.setToken(token)
  setStoredSession(user)
  return user
}

/**
 * Rehydrate the session at app boot. If a token is present we ask the API for
 * the current user (so an expired/revoked token bounces the user to login).
 */
export async function restoreSession(): Promise<AuthSession | null> {
  if (!api.getToken()) return null
  try {
    const user = await api.me()
    setStoredSession(user)
    return user
  } catch {
    api.clearToken()
    setStoredSession(null)
    return null
  }
}

export async function logout(): Promise<void> {
  await api.logout()
  api.clearToken()
  setStoredSession(null)
}

// ── Access control (client-side UX guard; the server also enforces it) ───────────
export function canAccess(session: AuthSession, page: PageKey): boolean {
  if (session.isAdmin) return true
  return session.pages.includes(page)
}
