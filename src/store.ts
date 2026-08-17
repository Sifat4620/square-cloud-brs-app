import type { DSR, Client, BackupTest, BackupEntry, StatusField, DSRStatus, TestStatus } from './types'

// v2 key — new DSR structure; old v1 data is ignored
const KEYS = {
  dsrs:    'srs_dsrs_v2',
  backups: 'srs_backups_v1',
  clients: 'srs_clients_v1',
}

const DEFAULT_CLIENT_NAMES = [
  'Meghna Denim', 'NZ Group', 'DataSoft', 'Jovision', 'Mir Cloud',
  'Initvent Software', 'Databiz', 'Onnorokom', 'Sunlife Insurance',
  'STL', 'SFBL', 'SPL', 'UPHCS', 'Dept. Fisheries', 'Silicon ICT',
  'Saibonsoft', 'Dept. of Livestock',
]

const DEFAULT_CLIENTS: Client[] = DEFAULT_CLIENT_NAMES.map((name, i) => ({
  id: `default_${i.toString().padStart(2, '0')}`,
  name,
  active: true,
  createdAt: '2025-01-01',
}))

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function ef(): StatusField {
  return { status: 'OK' as DSRStatus, value: '', remarks: '' }
}

export function emptyDSR(date: string): DSR {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    date,
    name: '',
    signature: '',
    state: 'Draft',
    createdAt: now,
    updatedAt: now,
    uplinks: { bdix: ef(), silInternet: ef() },
    p2p: { fah: ef(), summit: ef() },
    firewall: { sessionCount: ef(), compromisedHosts: ef(), bandwidthCheck: ef() },
    kb: { nutanix: ef(), proxmox: ef(), vmware: ef(), veeam: ef(), networkingDevices: ef() },
    chq: { nutanix: ef(), proxmox: ef(), networkingDevices: ef() },
    ups: { ups1: ef(), ups2: ef() },
    cooling: { ac1: ef(), ac2: ef(), ac3: ef(), ac4: ef() },
    generalRemarks: '',
  }
}

// ── DSR CRUD ──────────────────────────────────────────────────────────────────
export function getDSRs(): DSR[] { return load<DSR[]>(KEYS.dsrs, []) }

export function upsertDSR(dsr: DSR): void {
  const all = getDSRs()
  const idx = all.findIndex(d => d.id === dsr.id)
  if (idx >= 0) all[idx] = dsr; else all.push(dsr)
  save(KEYS.dsrs, all)
}

export function deleteDSR(id: string): void {
  save(KEYS.dsrs, getDSRs().filter(d => d.id !== id))
}

// ── Client CRUD ───────────────────────────────────────────────────────────────
export function getClients(): Client[] {
  const stored = load<Client[] | null>(KEYS.clients, null)
  if (!stored) { save(KEYS.clients, DEFAULT_CLIENTS); return DEFAULT_CLIENTS }
  return stored
}

export function upsertClient(client: Client): void {
  const all = getClients()
  const idx = all.findIndex(c => c.id === client.id)
  if (idx >= 0) all[idx] = client; else all.push(client)
  save(KEYS.clients, all)
}

// ── Backup CRUD ───────────────────────────────────────────────────────────────
export function getBackups(): BackupTest[] { return load<BackupTest[]>(KEYS.backups, []) }

export function upsertBackup(bt: BackupTest): void {
  const all = getBackups()
  const idx = all.findIndex(b => b.id === bt.id)
  if (idx >= 0) all[idx] = bt; else all.push(bt)
  save(KEYS.backups, all)
}

export function deleteBackup(id: string): void {
  save(KEYS.backups, getBackups().filter(b => b.id !== id))
}

export function newBackupTest(year: number, month: number): BackupTest {
  const clients = getClients().filter(c => c.active)
  const now = new Date().toISOString()
  const entries: BackupEntry[] = clients.map(c => ({
    clientId: c.id,
    clientName: c.name,
    logsStatus: 'OK',
    testStatus: 'OK' as TestStatus,
    remarks: '',
  }))
  return {
    id: crypto.randomUUID(),
    year, month,
    state: 'Pending',
    responsibleName: '',
    responsibleDesignation: '',
    date: '',
    signature: '',
    entries,
    createdAt: now,
    updatedAt: now,
  }
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const YEARS = [2025, 2026, 2027, 2028, 2029]
