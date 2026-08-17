// ── Page keys ─────────────────────────────────────────────────────────────────
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

// ── Dynamic user model (stored in localStorage) ───────────────────────────────
export interface AppUser {
  id: string
  username: string
  password: string
  displayName: string
  roleName: string   // e.g. "NOC Engineer", "Manager"
  pages: PageKey[]
  active: boolean
  createdAt: string
}

// ── Auth session (what is kept in memory / sessionStorage) ───────────────────
export interface AuthSession {
  id: string
  username: string
  displayName: string
  roleName: string
  isAdmin: boolean
  pages: PageKey[]
}

// ── Storage keys ──────────────────────────────────────────────────────────────
const SESSION_KEY = 'srs_auth_v2'
const USERS_KEY   = 'srs_users_v1'

// ── User CRUD ─────────────────────────────────────────────────────────────────
export function getAppUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as AppUser[]) : []
  } catch {
    return []
  }
}

export function saveAppUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function upsertAppUser(user: AppUser): void {
  const all = getAppUsers()
  const idx = all.findIndex(u => u.id === user.id)
  if (idx >= 0) all[idx] = user
  else all.push(user)
  saveAppUsers(all)
}

export function deleteAppUser(id: string): void {
  saveAppUsers(getAppUsers().filter(u => u.id !== id))
}

// ── Auth operations ───────────────────────────────────────────────────────────
const ADMIN_CREDENTIALS = { username: 'admin', password: 'Admin@2025' }

export function login(username: string, password: string): AuthSession | null {
  const u = username.trim().toLowerCase()
  const p = password

  // Built-in admin
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    const session: AuthSession = {
      id: 'admin',
      username: 'admin',
      displayName: 'Administrator',
      roleName: 'Admin',
      isAdmin: true,
      pages: PAGE_DEFS.map(d => d.key),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  // Dynamic users
  const match = getAppUsers().find(
    au => au.username.toLowerCase() === u && au.password === p && au.active,
  )
  if (!match) return null

  const session: AuthSession = {
    id: match.id,
    username: match.username,
    displayName: match.displayName,
    roleName: match.roleName,
    isAdmin: false,
    pages: match.pages,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

/** Helper: does this session have access to a given page? */
export function canAccess(session: AuthSession, page: PageKey): boolean {
  if (session.isAdmin) return true
  return session.pages.includes(page)
}
