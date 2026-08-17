// ── Typed HTTP client for the Square Cloud BRS Laravel API ─────────────────────
// The Laravel backend (square-laravel/brs-api) is the single source of truth.
// This module owns the auth token (kept in localStorage) and all network calls.
// Views/store never touch fetch directly — they go through here.

import type { AuthSession } from './auth'
import type {
  DSR, DSRState, BackupTest, BackupEntry, Client,
} from './types'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

const TOKEN_KEY = 'srs_token_v1'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Thrown on a 401 so the UI can bounce the user back to the login screen. */
export class UnauthorizedError extends ApiError {
  constructor() {
    super('Your session has expired. Please sign in again.', 401)
    this.name = 'UnauthorizedError'
  }
}

interface ApiOptions {
  method?: string
  body?: unknown
  auth?: boolean
}

async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new ApiError('Could not reach the server. Is the API running?', 0)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      throw new UnauthorizedError()
    }
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }

  return data as T
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string
  user: AuthSession
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/login', {
    method: 'POST',
    auth: false,
    body: { username, password },
  })
}

export async function me(): Promise<AuthSession> {
  return apiFetch<AuthSession>('/me')
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/logout', { method: 'POST' }).catch(() => {})
}

// ── DSRs ────────────────────────────────────────────────────────────────────────
export interface DsrListParams {
  year?: string | number
  month?: string | number
  state?: DSRState
}

export async function listDsrs(params: DsrListParams = {}): Promise<DSR[]> {
  const qs = new URLSearchParams()
  if (params.year != null) qs.set('year', String(params.year))
  if (params.month != null) qs.set('month', String(params.month))
  if (params.state) qs.set('state', params.state)
  const q = qs.toString()
  return apiFetch<DSR[]>(`/dsrs${q ? `?${q}` : ''}`)
}

export async function getDsr(id: string): Promise<DSR> {
  return apiFetch<DSR>(`/dsrs/${id}`)
}

export async function createDsr(payload: DSR): Promise<DSR> {
  return apiFetch<DSR>('/dsrs', { method: 'POST', body: payload })
}

export async function updateDsr(id: string, payload: DSR): Promise<DSR> {
  return apiFetch<DSR>(`/dsrs/${id}`, { method: 'PUT', body: payload })
}

export async function deleteDsr(id: string): Promise<void> {
  return apiFetch<void>(`/dsrs/${id}`, { method: 'DELETE' })
}

// ── Backups ──────────────────────────────────────────────────────────────────────
export interface BackupListParams {
  year?: string | number
  state?: string
}

export type NewBackupTest = Omit<BackupTest, 'id' | 'createdAt' | 'updatedAt'>

export async function listBackups(params: BackupListParams = {}): Promise<BackupTest[]> {
  const qs = new URLSearchParams()
  if (params.year != null) qs.set('year', String(params.year))
  if (params.state) qs.set('state', params.state)
  const q = qs.toString()
  return apiFetch<BackupTest[]>(`/backups${q ? `?${q}` : ''}`)
}

export async function getBackup(id: string): Promise<BackupTest> {
  return apiFetch<BackupTest>(`/backups/${id}`)
}

export async function createBackup(payload: NewBackupTest): Promise<BackupTest> {
  return apiFetch<BackupTest>('/backups', { method: 'POST', body: payload })
}

export async function updateBackup(id: string, payload: BackupTest): Promise<BackupTest> {
  return apiFetch<BackupTest>(`/backups/${id}`, { method: 'PUT', body: payload })
}

export async function deleteBackup(id: string): Promise<void> {
  return apiFetch<void>(`/backups/${id}`, { method: 'DELETE' })
}

/**
 * Build a draft monthly backup test for the given year/month: one entry per
 * active client (mirrors the old localStorage `newBackupTest`). Returns the
 * server-created record, ready to edit.
 */
export async function createBackupTest(year: number, month: number): Promise<BackupTest> {
  const clients = await listClients()
  const entries: BackupEntry[] = clients
    .filter(c => c.active)
    .map(c => ({
      clientId: c.id,
      clientName: c.name,
      logsStatus: 'OK',
      testStatus: 'OK',
      remarks: '',
    }))
  const draft: NewBackupTest = {
    year,
    month,
    state: 'Pending',
    responsibleName: '',
    responsibleDesignation: '',
    date: '',
    signature: '',
    entries,
  }
  return createBackup(draft)
}

// ── Clients ──────────────────────────────────────────────────────────────────────
export async function listClients(): Promise<Client[]> {
  return apiFetch<Client[]>('/clients')
}

export async function createClient(payload: { name: string; active?: boolean }): Promise<Client> {
  return apiFetch<Client>('/clients', { method: 'POST', body: payload })
}

export async function updateClient(
  id: string,
  payload: { name?: string; active?: boolean },
): Promise<Client> {
  return apiFetch<Client>(`/clients/${id}`, { method: 'PUT', body: payload })
}

// ── Users (admin) ───────────────────────────────────────────────────────────────
export interface NewUserPayload {
  username: string
  displayName: string
  roleName: string
  password: string
  pages: string[]
  active?: boolean
}

export interface UpdateUserPayload {
  displayName?: string
  roleName?: string
  password?: string
  pages?: string[]
  active?: boolean
}

export async function listUsers(): Promise<import('./types').ManagedUser[]> {
  return apiFetch<import('./types').ManagedUser[]>('/users')
}

export async function createUser(payload: NewUserPayload): Promise<import('./types').ManagedUser> {
  return apiFetch<import('./types').ManagedUser>('/users', { method: 'POST', body: payload })
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<import('./types').ManagedUser> {
  return apiFetch<import('./types').ManagedUser>(`/users/${id}`, { method: 'PUT', body: payload })
}

export async function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: 'DELETE' })
}
