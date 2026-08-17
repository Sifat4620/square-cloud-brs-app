// ── Data layer (API-backed) ─────────────────────────────────────────────────────
// All persistence now goes through the Laravel API (./api). This module exposes
// async CRUD helpers plus the pure UI helpers the forms still need. New records
// carry a temporary UUID id; once the server responds we adopt its numeric id.

import * as api from './api'
import type {
  DSR, Client, BackupTest, BackupEntry, StatusField, DSRStatus, TestStatus,
} from './types'

// ── Pure helpers used by the forms (not persisted) ───────────────────────────────
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

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const YEARS = [2025, 2026, 2027, 2028, 2029]

// ── DSR CRUD ──────────────────────────────────────────────────────────────────────
export async function getDSRs(params?: api.DsrListParams): Promise<DSR[]> {
  return api.listDsrs(params)
}

export async function getDSR(id: string): Promise<DSR | null> {
  try {
    return await api.getDsr(id)
  } catch {
    return null
  }
}

export async function upsertDSR(dsr: DSR): Promise<DSR> {
  // Local drafts use a UUID id; server records use numeric ids.
  const isNew = !/^\d+$/.test(dsr.id)
  return isNew ? api.createDsr(dsr) : api.updateDsr(dsr.id, dsr)
}

export async function deleteDSR(id: string): Promise<void> {
  return api.deleteDsr(id)
}

// ── Client CRUD ────────────────────────────────────────────────────────────────────
export async function getClients(): Promise<Client[]> {
  return api.listClients()
}

export async function upsertClient(client: Client): Promise<Client> {
  return /^\d+$/.test(client.id)
    ? api.updateClient(client.id, { name: client.name, active: client.active })
    : api.createClient({ name: client.name, active: client.active })
}

// ── Backup CRUD ────────────────────────────────────────────────────────────────────
export async function getBackups(params?: api.BackupListParams): Promise<BackupTest[]> {
  return api.listBackups(params)
}

export async function getBackup(id: string): Promise<BackupTest> {
  return api.getBackup(id)
}

export async function upsertBackup(bt: BackupTest): Promise<BackupTest> {
  return /^\d+$/.test(bt.id)
    ? api.updateBackup(bt.id, bt)
    : api.createBackup(bt)
}

export async function deleteBackup(id: string): Promise<void> {
  return api.deleteBackup(id)
}

/** Create a draft monthly backup test (one entry per active client) on the server. */
export async function newBackupTest(year: number, month: number): Promise<BackupTest> {
  return api.createBackupTest(year, month)
}

// Re-export so views keep importing TestStatus/BackupEntry types if needed.
export type { BackupEntry, TestStatus }
