import { useState, useCallback } from 'react'
import { getDSRs, upsertDSR, emptyDSR, MONTHS } from '../store'
import type { Route } from '../App'
import type { DSR, StatusField, DSRStatus, DSRState } from '../types'

const STATUS_OPTIONS: DSRStatus[] = ['OK', 'FAULT', 'DEGRADED', 'MAINTENANCE', 'N/A']

const STATUS_STYLE: Record<DSRStatus, React.CSSProperties> = {
  OK:          { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  FAULT:       { color: '#991b1b', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' },
  DEGRADED:    { color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
  MAINTENANCE: { color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
  'N/A':       { color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
}

const SELECT_TEXT: Record<DSRStatus, string> = {
  OK: '#166534', FAULT: '#991b1b', DEGRADED: '#92400e', MAINTENANCE: '#1e40af', 'N/A': '#475569',
}

function setDeep(obj: DSR, path: string[], update: Partial<StatusField>): DSR {
  const next = structuredClone(obj)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = next
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
  cur[path[path.length - 1]] = { ...cur[path[path.length - 1]], ...update }
  return next
}

export function StatusPill({ status }: { status: DSRStatus }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={STATUS_STYLE[status]}>
      {status}
    </span>
  )
}

function StateBadge({ state }: { state: DSRState }) {
  const styles: Record<DSRState, React.CSSProperties> = {
    Draft:     { color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' },
    Submitted: { color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
    Approved:  { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold" style={styles[state]}>
      {state}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
      {children}
    </label>
  )
}

function inputStyle(readOnly: boolean): React.CSSProperties {
  return {
    backgroundColor: readOnly ? 'var(--surface2)' : '#fff',
    border: `1px solid ${readOnly ? 'var(--border)' : 'var(--border2)'}`,
    color: readOnly ? 'var(--text3)' : 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  }
}

function Btn({ children, onClick, disabled, primary, ghost }: {
  children: React.ReactNode; onClick: () => void
  disabled?: boolean; primary?: boolean; ghost?: boolean
}) {
  const style: React.CSSProperties = primary
    ? { backgroundColor: 'var(--primary)', color: '#fff', border: '1px solid transparent' }
    : ghost
    ? { backgroundColor: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }
    : { backgroundColor: '#fff', color: 'var(--text2)', border: '1px solid var(--border2)' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 hover:opacity-90"
      style={style}
    >
      {children}
    </button>
  )
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface2)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>{subtitle}</span>
      </div>
      {children}
    </div>
  )
}

interface FieldRowDef {
  label: string; path: string[]; field: StatusField; valuePlaceholder?: string
}

function FieldTable({ rows, readOnly, onUpdate, showValue }: {
  rows: FieldRowDef[]; readOnly: boolean
  onUpdate: (path: string[], update: Partial<StatusField>) => void; showValue: boolean
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '240px' }}>Component</th>
          <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '150px' }}>Status</th>
          {showValue && <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '170px' }}>Value</th>}
          <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ label, path, field, valuePlaceholder }, i) => (
          <tr key={path.join('.')} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace", fontSize: '12.5px' }}>
              {label}
            </td>
            <td className="px-5 py-3">
              {readOnly ? (
                <StatusPill status={field.status} />
              ) : (
                <select
                  value={field.status}
                  onChange={e => onUpdate(path, { status: e.target.value as DSRStatus })}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{
                    backgroundColor: STATUS_STYLE[field.status].backgroundColor,
                    border: STATUS_STYLE[field.status].border as string,
                    color: SELECT_TEXT[field.status],
                  }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </td>
            {showValue && (
              <td className="px-5 py-3">
                <input
                  type="text"
                  value={field.value}
                  disabled={readOnly}
                  onChange={e => onUpdate(path, { value: e.target.value })}
                  placeholder={valuePlaceholder}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ fontFamily: "'DM Mono', monospace", ...inputStyle(readOnly), padding: '6px 10px', fontSize: '12px' }}
                />
              </td>
            )}
            <td className="px-5 py-3">
              <input
                type="text"
                value={field.remarks}
                disabled={readOnly}
                onChange={e => onUpdate(path, { remarks: e.target.value })}
                placeholder={readOnly ? '' : 'Add notes...'}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ ...inputStyle(readOnly), padding: '6px 10px', fontSize: '12px' }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  id?: string; onNavigate: (route: Route) => void; isAdmin: boolean
}

export default function DSRForm({ id, onNavigate, isAdmin }: Props) {
  const [dsr, setDsr] = useState<DSR>(() => {
    if (id) {
      const found = getDSRs().find(d => d.id === id)
      if (found) return found
    }
    return emptyDSR(new Date().toISOString().split('T')[0])
  })

  const [saving, setSaving] = useState(false)
  const isReadOnly = dsr.state !== 'Draft' || !isAdmin

  const updateField = useCallback((path: string[], update: Partial<StatusField>) => {
    setDsr(prev => setDeep(prev, path, update))
  }, [])

  const handleSave = (newState?: DSRState) => {
    setSaving(true)
    const updated: DSR = { ...dsr, state: newState || dsr.state, updatedAt: new Date().toISOString() }
    upsertDSR(updated)
    setDsr(updated)
    setSaving(false)
    if (newState === 'Approved') onNavigate({ page: 'dsr-list' })
  }

  const monthLabel = MONTHS[parseInt(dsr.date.split('-')[1] || '1') - 1] || ''
  const yearLabel = dsr.date.split('-')[0]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 print-page">
      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate({ page: 'dsr-list' })}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          ← Back to DSRs
        </button>
        <div className="flex items-center gap-2">
          {isAdmin && dsr.state === 'Draft' && (
            <>
              <Btn onClick={() => handleSave()} disabled={saving} ghost>Save Draft</Btn>
              <Btn onClick={() => handleSave('Submitted')} disabled={saving} primary>Submit DSR</Btn>
            </>
          )}
          {isAdmin && dsr.state === 'Submitted' && (
            <Btn onClick={() => handleSave('Approved')} disabled={saving} primary>Approve</Btn>
          )}
          <Btn onClick={() => window.print()} ghost>Print</Btn>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-xl p-6 print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Daily Status Report</h2>
            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
              {monthLabel} {yearLabel}
            </p>
          </div>
          <StateBadge state={dsr.state} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'DATE', value: dsr.date, key: 'date', type: 'date' },
            { label: 'PREPARED BY', value: dsr.name, key: 'name', type: 'text', placeholder: 'Full name' },
            { label: 'SIGNATURE', value: dsr.signature, key: 'signature', type: 'text', placeholder: 'Signature / Initials' },
          ].map(f => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <input
                type={f.type}
                value={f.value}
                disabled={isReadOnly}
                onChange={e => setDsr(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={(f as { placeholder?: string }).placeholder}
                className="focus:ring-2 focus:ring-blue-200"
                style={inputStyle(isReadOnly)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 1 · Uplinks */}
      <SectionCard title="Uplinks" subtitle="Network connectivity">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: 'BDIX (10 Gbps)',  path: ['uplinks', 'bdix'],        field: dsr.uplinks.bdix },
          { label: 'SIL Internet',    path: ['uplinks', 'silInternet'], field: dsr.uplinks.silInternet },
        ]} />
      </SectionCard>

      {/* 2 · P2P Data Connectivity */}
      <SectionCard title="P2P Data Connectivity" subtitle="Point-to-point links">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: 'F@H (Dark Fiber)',        path: ['p2p', 'fah'],    field: dsr.p2p.fah },
          { label: 'Summit (Capacity Link)',  path: ['p2p', 'summit'], field: dsr.p2p.summit },
        ]} />
      </SectionCard>

      {/* 3 · Firewall */}
      <SectionCard title="Firewall Status" subtitle="24-hour metrics">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={true} rows={[
          { label: 'Session Count — last 24h highest',   path: ['firewall', 'sessionCount'],     field: dsr.firewall.sessionCount,     valuePlaceholder: 'e.g. 12,450' },
          { label: 'Compromised Hosts',                  path: ['firewall', 'compromisedHosts'], field: dsr.firewall.compromisedHosts, valuePlaceholder: 'e.g. 0' },
          { label: 'Bandwidth Check — last 24h highest', path: ['firewall', 'bandwidthCheck'],   field: dsr.firewall.bandwidthCheck,   valuePlaceholder: 'e.g. 4.2 Gbps' },
        ]} />
      </SectionCard>

      {/* 4 · KB Status */}
      <SectionCard title="KB Status" subtitle="Infrastructure — KB site">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: 'NutaniX',            path: ['kb', 'nutanix'],           field: dsr.kb.nutanix },
          { label: 'Proxmox',            path: ['kb', 'proxmox'],           field: dsr.kb.proxmox },
          { label: 'VMware',             path: ['kb', 'vmware'],            field: dsr.kb.vmware },
          { label: 'Veeam',              path: ['kb', 'veeam'],             field: dsr.kb.veeam },
          { label: 'Networking Devices', path: ['kb', 'networkingDevices'], field: dsr.kb.networkingDevices },
        ]} />
      </SectionCard>

      {/* 5 · CHQ Status */}
      <SectionCard title="CHQ Status" subtitle="Infrastructure — CHQ site">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: 'NutaniX',            path: ['chq', 'nutanix'],           field: dsr.chq.nutanix },
          { label: 'Proxmox',            path: ['chq', 'proxmox'],           field: dsr.chq.proxmox },
          { label: 'Networking Devices', path: ['chq', 'networkingDevices'], field: dsr.chq.networkingDevices },
        ]} />
      </SectionCard>

      {/* 6 · UPS */}
      <SectionCard title="UPS Status" subtitle="Uninterruptible power supply">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: '40 KVA UPS1', path: ['ups', 'ups1'], field: dsr.ups.ups1 },
          { label: '10 KVA UPS2', path: ['ups', 'ups2'], field: dsr.ups.ups2 },
        ]} />
      </SectionCard>

      {/* 7 · Cooling */}
      <SectionCard title="Cooling Status" subtitle="Air conditioning units">
        <FieldTable readOnly={isReadOnly} onUpdate={updateField} showValue={false} rows={[
          { label: 'AC1', path: ['cooling', 'ac1'], field: dsr.cooling.ac1 },
          { label: 'AC2', path: ['cooling', 'ac2'], field: dsr.cooling.ac2 },
          { label: 'AC3', path: ['cooling', 'ac3'], field: dsr.cooling.ac3 },
          { label: 'AC4', path: ['cooling', 'ac4'], field: dsr.cooling.ac4 },
        ]} />
      </SectionCard>

      {/* General Remarks */}
      <div className="rounded-xl p-5 print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Label>General Remarks</Label>
        <textarea
          value={dsr.generalRemarks}
          disabled={isReadOnly}
          onChange={e => setDsr(p => ({ ...p, generalRemarks: e.target.value }))}
          rows={4}
          placeholder="Additional notes or observations..."
          className="focus:ring-2 focus:ring-blue-200 resize-none"
          style={{ ...inputStyle(isReadOnly), resize: 'none' }}
        />
      </div>

      {isAdmin && dsr.state === 'Draft' && (
        <div className="flex justify-end gap-2 pb-6 no-print">
          <Btn onClick={() => handleSave()} disabled={saving} ghost>Save Draft</Btn>
          <Btn onClick={() => handleSave('Submitted')} disabled={saving} primary>Submit DSR</Btn>
        </div>
      )}
    </div>
  )
}
