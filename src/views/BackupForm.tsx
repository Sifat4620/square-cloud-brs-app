import { useState, useMemo, useEffect } from 'react'
import { getBackup, getBackups, upsertBackup, newBackupTest, MONTHS, YEARS } from '../store'
import { ApiError } from '../api'
import type { Route } from '../App'
import type { BackupTest, BackupState, TestStatus, BackupEntry } from '../types'

const TEST_OPTIONS: TestStatus[] = ['OK', 'FAILED', 'PENDING', 'N/A']

const TEST_STYLE: Record<TestStatus, React.CSSProperties> = {
  OK:      { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  FAILED:  { color: '#991b1b', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' },
  PENDING: { color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
  'N/A':   { color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
}

const STATE_STYLE: Record<BackupState, React.CSSProperties> = {
  Pending:   { color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
  Completed: { color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
  Failed:    { color: '#991b1b', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' },
  Approved:  { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
}

function TestPill({ status }: { status: TestStatus }) {
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={TEST_STYLE[status]}>{status}</span>
}

function StateBadge({ state }: { state: BackupState }) {
  return <span className="px-3 py-1 rounded-full text-xs font-bold" style={STATE_STYLE[state]}>{state}</span>
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

function Btn({ children, onClick, primary, danger, ghost, disabled }: {
  children: React.ReactNode; onClick: () => void
  primary?: boolean; danger?: boolean; ghost?: boolean; disabled?: boolean
}) {
  const style: React.CSSProperties = primary
    ? { backgroundColor: 'var(--primary)', color: '#fff', border: '1px solid transparent' }
    : danger
    ? { backgroundColor: '#fff1f2', color: '#dc2626', border: '1px solid #fecdd3' }
    : ghost
    ? { backgroundColor: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }
    : { backgroundColor: '#fff', color: 'var(--text2)', border: '1px solid var(--border2)' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
      style={style}
    >
      {children}
    </button>
  )
}

interface Props {
  id?: string
  onNavigate: (route: Route) => void
  isAdmin: boolean
}

export default function BackupForm({ id, onNavigate, isAdmin }: Props) {
  const [newYear, setNewYear]   = useState(new Date().getFullYear())
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1)

  const [bt, setBt] = useState<BackupTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!id) { setLoading(false); return }
    setLoading(true)
    getBackup(id)
      .then(found => { if (active) { setBt(found); setError(found ? '' : 'Backup test not found.') } })
      .catch(err => { if (active) setError(err instanceof ApiError ? err.message : 'Failed to load backup test.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const isNew      = !id && !bt && isAdmin
  const isReadOnly = bt ? (bt.state !== 'Pending' || !isAdmin) : true

  const handleCreate = async () => {
    setLoading(true)
    try {
      const all = await getBackups()
      const existing = all.find(b => b.year === newYear && b.month === newMonth)
      if (existing) {
        alert(`A backup test for ${MONTHS[newMonth - 1]} ${newYear} already exists.`)
        return
      }
      const fresh = await newBackupTest(newYear, newMonth)
      setBt(fresh)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to create backup test.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (newState?: BackupState) => {
    if (!bt) return
    try {
      const updated: BackupTest = { ...bt, state: newState || bt.state, updatedAt: new Date().toISOString() }
      const saved = await upsertBackup(updated)
      setBt(saved)
      if (newState === 'Approved') onNavigate({ page: 'backup-list' })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save backup test.')
    }
  }

  const updateEntry = (idx: number, update: Partial<BackupEntry>) => {
    if (!bt) return
    const entries = [...bt.entries]
    entries[idx] = { ...entries[idx], ...update }
    setBt({ ...bt, entries })
  }

  const selStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid var(--border2)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  }

  const stats = useMemo(() => {
    if (!bt) return { ok: 0, failed: 0, pending: 0, na: 0 }
    return {
      ok:      bt.entries.filter(e => e.testStatus === 'OK').length,
      failed:  bt.entries.filter(e => e.testStatus === 'FAILED').length,
      pending: bt.entries.filter(e => e.testStatus === 'PENDING').length,
      na:      bt.entries.filter(e => e.testStatus === 'N/A').length,
    }
  }, [bt])

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="p-6 text-sm" style={{ color: 'var(--text3)' }}>Loading…</div>
  }

  // ── No record ────────────────────────────────────────────────────────────────
  if (!id && !bt && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm font-semibold" style={{ color: '#94a3b8' }}>No record selected.</p>
      </div>
    )
  }

  // ── Create new ───────────────────────────────────────────────────────────────
  if (isNew) {
    return (
      <div className="p-6 max-w-md">
        <button
          onClick={() => onNavigate({ page: 'backup-list' })}
          className="flex items-center gap-1.5 text-sm font-semibold mb-6 hover:opacity-70 transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          ← Back
        </button>
        <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>New Monthly Backup Test</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
              All active clients will be included automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Year</Label>
              <select value={newYear} onChange={e => setNewYear(parseInt(e.target.value))} style={selStyle}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <Label>Month</Label>
              <select value={newMonth} onChange={e => setNewMonth(parseInt(e.target.value))} style={selStyle}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Btn primary onClick={handleCreate}>Create Backup Test</Btn>
            <Btn ghost onClick={() => onNavigate({ page: 'backup-list' })}>Cancel</Btn>
          </div>
        </div>
      </div>
    )
  }

  if (!bt) {
    return <div className="p-6 text-sm" style={{ color: 'var(--text3)' }}>{error || 'Backup test not found.'}</div>
  }

  const passRate = bt.entries.length > 0 ? Math.round((stats.ok / bt.entries.length) * 100) : 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 print-page">

      {/* Print header (only shows when printing) */}
      <div className="hidden print-header" style={{ display: 'none' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '4px' }}>Monthly Backup Test Report</h1>
        <p style={{ fontSize: '11pt', color: '#475569' }}>{MONTHS[bt.month - 1]} {bt.year} — Square VM Cloud</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => onNavigate({ page: 'backup-list' })}
          className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          ← Back to Backup Tests
        </button>
        <div className="flex items-center gap-2">
          {isAdmin && bt.state === 'Pending' && (
            <>
              <Btn ghost onClick={() => handleSave()}>Save Draft</Btn>
              <Btn danger onClick={() => handleSave('Failed')}>Mark Failed</Btn>
              <Btn primary onClick={() => handleSave('Completed')}>Mark Completed</Btn>
            </>
          )}
          {isAdmin && bt.state === 'Completed' && (
            <>
              <Btn danger onClick={() => handleSave('Failed')}>Mark Failed</Btn>
              <Btn primary onClick={() => handleSave('Approved')}>Approve</Btn>
            </>
          )}
          <Btn ghost onClick={() => window.print()}>Print / Export</Btn>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-xl p-6 print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Monthly Backup Test</h2>
            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
              {MONTHS[bt.month - 1]} {bt.year}
            </p>
          </div>
          <StateBadge state={bt.state} />
        </div>

        {/* Summary stat row */}
        <div className="grid grid-cols-5 gap-3 mt-2">
          {[
            { label: 'Total Clients', value: bt.entries.length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Passed (OK)',   value: stats.ok,      color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Failed',        value: stats.failed,  color: '#991b1b', bg: '#fff1f2', border: '#fecdd3' },
            { label: 'Pending',       value: stats.pending, color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Pass Rate',     value: `${passRate}%`, color: passRate >= 80 ? '#166534' : passRate >= 60 ? '#92400e' : '#991b1b', bg: passRate >= 80 ? '#f0fdf4' : passRate >= 60 ? '#fffbeb' : '#fff1f2', border: passRate >= 80 ? '#bbf7d0' : passRate >= 60 ? '#fde68a' : '#fecdd3' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: s.color, fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>{s.label}</p>
              <p className="text-xl font-extrabold" style={{ color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Pass rate bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>Backup Success Rate</span>
            <span className="text-xs font-bold" style={{ color: passRate >= 80 ? '#166534' : '#dc2626', fontFamily: "'DM Mono', monospace" }}>{passRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${passRate}%`,
                backgroundColor: passRate >= 80 ? '#16a34a' : passRate >= 60 ? '#d97706' : '#dc2626',
              }}
            />
          </div>
        </div>
      </div>

      {/* Client backup status table */}
      <div className="rounded-xl overflow-hidden print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface2)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Client Backup Status</span>
          <span className="text-xs" style={{ color: 'var(--text3)' }}>
            {bt.entries.length} clients · {MONTHS[bt.month - 1]} {bt.year}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--surface2)' }}>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '40px' }}>#</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>Client Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '170px' }}>Logs / Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '155px' }}>Test Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {bt.entries.map((entry, idx) => (
              <tr
                key={entry.clientId}
                style={{
                  borderBottom: idx < bt.entries.length - 1 ? '1px solid var(--border)' : 'none',
                  backgroundColor: entry.testStatus === 'FAILED' ? '#fff8f8' : 'transparent',
                }}
              >
                <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--text4)', fontFamily: "'DM Mono', monospace" }}>{idx + 1}</td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-2">
                    {entry.testStatus === 'FAILED' && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#dc2626' }} />
                    )}
                    {entry.clientName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isReadOnly ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ color: '#166534', backgroundColor: '#f0fdf4', fontFamily: "'DM Mono', monospace" }}>
                      {entry.logsStatus || 'OK'}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={entry.logsStatus}
                      onChange={e => updateEntry(idx, { logsStatus: e.target.value })}
                      placeholder="OK"
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ backgroundColor: '#fff', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  {isReadOnly ? (
                    <TestPill status={entry.testStatus} />
                  ) : (
                    <select
                      value={entry.testStatus}
                      onChange={e => updateEntry(idx, { testStatus: e.target.value as TestStatus })}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ ...TEST_STYLE[entry.testStatus] }}
                    >
                      {TEST_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isReadOnly ? (
                    <span className="text-xs" style={{ color: entry.remarks ? 'var(--text2)' : 'var(--text4)' }}>
                      {entry.remarks || '—'}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={entry.remarks}
                      onChange={e => updateEntry(idx, { remarks: e.target.value })}
                      placeholder={entry.testStatus === 'FAILED' ? 'Describe the failure...' : 'Remarks (optional)'}
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{
                        backgroundColor: entry.testStatus === 'FAILED' ? '#fff8f8' : '#fff',
                        border: `1px solid ${entry.testStatus === 'FAILED' ? '#fecdd3' : 'var(--border2)'}`,
                        color: 'var(--text)',
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Failed summary row */}
        {stats.failed > 0 && (
          <div
            className="px-5 py-3 flex items-center gap-2 text-xs font-semibold"
            style={{ borderTop: '2px solid #fecdd3', backgroundColor: '#fff8f8', color: '#991b1b' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 4v3.5M7 9.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {stats.failed} client{stats.failed !== 1 ? 's' : ''} failed backup test — remarks required for audit trail.
          </div>
        )}
      </div>

      {/* Responsible person */}
      <div className="rounded-xl p-5 print-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Responsible Person</p>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Record the engineer who conducted this test</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'NAME',        key: 'responsibleName',        placeholder: 'Full name',  type: 'text' },
            { label: 'DESIGNATION', key: 'responsibleDesignation', placeholder: 'Job title',  type: 'text' },
            { label: 'DATE',        key: 'date',                   placeholder: '',           type: 'date' },
            { label: 'SIGNATURE',   key: 'signature',              placeholder: 'Initials',   type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <input
                type={f.type}
                value={(bt as unknown as Record<string, string>)[f.key]}
                disabled={isReadOnly}
                onChange={e => setBt({ ...bt, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="focus:ring-2 focus:ring-blue-200"
                style={inputStyle(isReadOnly)}
              />
            </div>
          ))}
        </div>

        {/* Signature line for print */}
        <div className="hidden print-sig mt-8 pt-4 grid grid-cols-2 gap-12" style={{ display: 'none', borderTop: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }} />
            <p style={{ fontSize: '10pt', color: '#64748b', marginTop: '4px' }}>
              Signature — {bt.responsibleName || '________________________'}
            </p>
            <p style={{ fontSize: '9pt', color: '#94a3b8' }}>{bt.responsibleDesignation}</p>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }} />
            <p style={{ fontSize: '10pt', color: '#64748b', marginTop: '4px' }}>Date — {bt.date || '________________________'}</p>
          </div>
        </div>
      </div>

      {/* State transition note */}
      {!isReadOnly && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 no-print"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: '#d97706' }}>
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7.5 4.5v3.5M7.5 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p className="text-xs" style={{ color: '#92400e' }}>
            Status is <strong>Pending</strong>. Update each client's Logs/Status and Test Status, then save and mark as <strong>Completed</strong>.
            After review, the record can be <strong>Approved</strong> to lock it permanently.
          </p>
        </div>
      )}

      {/* Bottom action bar */}
      {isAdmin && bt.state === 'Pending' && (
        <div className="flex justify-end gap-2 pb-6 no-print">
          <Btn ghost onClick={() => handleSave()}>Save Draft</Btn>
          <Btn danger onClick={() => handleSave('Failed')}>Mark Failed</Btn>
          <Btn primary onClick={() => handleSave('Completed')}>Mark Completed</Btn>
        </div>
      )}
      {isAdmin && bt.state === 'Completed' && (
        <div className="flex justify-end gap-2 pb-6 no-print">
          <Btn danger onClick={() => handleSave('Failed')}>Mark Failed</Btn>
          <Btn primary onClick={() => handleSave('Approved')}>Approve & Lock</Btn>
        </div>
      )}
    </div>
  )
}
