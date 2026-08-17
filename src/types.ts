export type DSRStatus = 'OK' | 'FAULT' | 'DEGRADED' | 'MAINTENANCE' | 'N/A'
export type DSRState  = 'Draft' | 'Submitted' | 'Approved'
export type BackupState = 'Pending' | 'Completed' | 'Failed' | 'Approved'
export type TestStatus  = 'OK' | 'FAILED' | 'PENDING' | 'N/A'

export interface StatusField {
  status: DSRStatus
  value: string | null
  remarks: string | null
}

export interface DSR {
  id: string
  date: string
  name: string
  signature: string
  state: DSRState
  createdAt: string
  updatedAt: string

  /** Uplinks — BDIX (10 Gbps) · SIL Internet */
  uplinks: {
    bdix: StatusField
    silInternet: StatusField
  }

  /** P2P Data Connectivity — F@H (Dark Fiber) · Summit (Capacity Link) */
  p2p: {
    fah: StatusField
    summit: StatusField
  }

  /** Firewall Status */
  firewall: {
    sessionCount: StatusField     // last 24h highest
    compromisedHosts: StatusField
    bandwidthCheck: StatusField   // last 24h highest
  }

  /** KB Status */
  kb: {
    nutanix: StatusField
    proxmox: StatusField
    vmware: StatusField
    veeam: StatusField
    networkingDevices: StatusField
  }

  /** CHQ Status */
  chq: {
    nutanix: StatusField
    proxmox: StatusField
    networkingDevices: StatusField
  }

  /** UPS Status */
  ups: {
    ups1: StatusField   // 40 KVA UPS1
    ups2: StatusField   // 10 KVA UPS2
  }

  /** Cooling Status */
  cooling: {
    ac1: StatusField
    ac2: StatusField
    ac3: StatusField
    ac4: StatusField
  }

  generalRemarks: string
}

export interface Client {
  id: string
  name: string
  active: boolean
  createdAt: string
}

export interface BackupEntry {
  clientId: string
  clientName: string
  logsStatus: string | null
  testStatus: TestStatus
  remarks: string | null
}

export interface BackupTest {
  id: string
  year: number
  month: number
  state: BackupState
  responsibleName: string
  responsibleDesignation: string
  date: string
  signature: string
  entries: BackupEntry[]
  createdAt: string
  updatedAt: string
}

/** A user managed via the admin User Management screen (no password in the list). */
export interface ManagedUser {
  id: string
  username: string
  displayName: string
  roleName: string
  pages: string[]
  active: boolean
  createdAt: string
}
