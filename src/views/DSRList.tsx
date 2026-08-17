import { useState, useMemo, useEffect, useCallback } from 'react'
import { getDSRs, deleteDSR, MONTHS, YEARS } from '../store'
import { ApiError } from '../api'
import type { Route } from '../App'
import type { DSR, DSRState } from '../types'
import logoSrc from '@/imports/logocloud_upscaled.png'

// ── Helpers ───────────────────────────────────────────────────────────────────
function countFaults(dsr: DSR): number {
  let n = 0
  const sections = [dsr.uplinks, dsr.p2p, dsr.firewall, dsr.kb, dsr.chq, dsr.ups, dsr.cooling] as Record<
    string,
    { status: string }
  >[]
  for (const s of sections)
    for (const f of Object.values(s))
      if (f.status === 'FAULT' || f.status === 'DEGRADED') n++
  return n
}

// ── Components ────────────────────────────────────────────────────────────────
function StateBadge({ state }: { state: DSRState }) {
  const styles: Record<DSRState, React.CSSProperties> = {
    Draft: { color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' },
    Submitted: { color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
    Approved: { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={styles[state]}
    >
      {state}
    </span>
  )
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-extrabold"
        style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}
      >
        {value}
      </p>
    </div>
  )
}

function ReportModal({ dsrs, onClose }: { dsrs: DSR[]; onClose: () => void }) {
  const faults = useMemo(() => {
    const c = { Uplinks: 0, 'P2P Connectivity': 0, Firewall: 0, 'KB Status': 0, 'CHQ Status': 0, UPS: 0, Cooling: 0 }
    for (const d of dsrs) {
      for (const f of Object.values(d.uplinks)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c.Uplinks++
      for (const f of Object.values(d.p2p)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c['P2P Connectivity']++
      for (const f of Object.values(d.firewall)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c.Firewall++
      for (const f of Object.values(d.kb)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c['KB Status']++
      for (const f of Object.values(d.chq)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c['CHQ Status']++
      for (const f of Object.values(d.ups)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c.UPS++
      for (const f of Object.values(d.cooling)) if (f.status === 'FAULT' || f.status === 'DEGRADED') c.Cooling++
    }
    return c
  }, [dsrs])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.5)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Summary Report</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              {dsrs.length} DSR{dsrs.length !== 1 ? 's' : ''} in current filter
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: dsrs.length, accent: '#2563eb' },
              { label: 'Approved', value: dsrs.filter(d => d.state === 'Approved').length, accent: '#16a34a' },
              { label: 'With Faults', value: dsrs.filter(d => countFaults(d) > 0).length, accent: '#dc2626' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.accent, fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>Fault Incidents by Section</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text3)' }}>Section</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text3)' }}>Fault Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(faults).map(([section, count]) => (
                    <tr key={section} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>{section}</td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: count > 0 ? '#dc2626' : '#16a34a', fontFamily: "'DM Mono', monospace" }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              Print
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: 'var(--primary)' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Today's DSR panel ─────────────────────────────────────────────────────────
function TodayPanel({ dsr, onView, onNew, isAdmin }: {
  dsr: DSR | null
  onView: () => void
  onNew: () => void
  isAdmin: boolean
}) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hasFault = dsr ? countFaults(dsr) > 0 : false
  const allOk = dsr && !hasFault

  const sectionSummary = dsr ? [
    { label: 'Uplinks',     ok: Object.values(dsr.uplinks).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'P2P',         ok: Object.values(dsr.p2p).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'Firewall',    ok: Object.values(dsr.firewall).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'KB',          ok: Object.values(dsr.kb).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'CHQ',         ok: Object.values(dsr.chq).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'UPS',         ok: Object.values(dsr.ups).every(f => f.status === 'OK' || f.status === 'N/A') },
    { label: 'Cooling',     ok: Object.values(dsr.cooling).every(f => f.status === 'OK' || f.status === 'N/A') },
  ] : []

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: allOk
          ? 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)'
          : hasFault
          ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)'
          : 'linear-gradient(135deg, #0c1929 0%, #0f2236 50%, #1e3a5f 100%)',
        boxShadow: allOk
          ? '0 8px 32px rgba(22,101,52,0.35)'
          : hasFault
          ? '0 8px 32px rgba(153,27,27,0.35)'
          : '0 8px 32px rgba(15,23,42,0.25)',
      }}
    >
      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        {/* Left: status */}
        <div className="flex items-center gap-4">
          {/* Pulse dot */}
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: allOk ? 'rgba(74,222,128,0.18)' : hasFault ? 'rgba(248,113,113,0.18)' : 'rgba(148,163,184,0.12)',
                border: `2px solid ${allOk ? 'rgba(74,222,128,0.4)' : hasFault ? 'rgba(248,113,113,0.4)' : 'rgba(148,163,184,0.2)'}`,
              }}
            >
              {allOk ? (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l6 6 10-10" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : hasFault ? (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 9v6M14 18h.01" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="14" cy="14" r="11" stroke="#f87171" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 9v6M14 18h.01" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="14" cy="14" r="11" stroke="#94a3b8" strokeWidth="2" />
                </svg>
              )}
            </div>
            {allOk && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px #4ade80' }} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.7)', fontFamily: "'DM Mono', monospace" }}>
                Today's Report
              </p>
              {dsr && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: dsr.state === 'Approved' ? 'rgba(74,222,128,0.15)' : dsr.state === 'Submitted' ? 'rgba(147,197,253,0.15)' : 'rgba(253,224,71,0.15)',
                    color: dsr.state === 'Approved' ? '#4ade80' : dsr.state === 'Submitted' ? '#93c5fd' : '#fde047',
                    border: `1px solid ${dsr.state === 'Approved' ? 'rgba(74,222,128,0.3)' : dsr.state === 'Submitted' ? 'rgba(147,197,253,0.3)' : 'rgba(253,224,71,0.3)'}`,
                  }}
                >
                  {dsr.state}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-extrabold leading-tight" style={{ color: allOk ? '#bbf7d0' : hasFault ? '#fca5a5' : '#e2e8f0' }}>
              {!dsr ? 'No DSR Filed Yet' : allOk ? 'All Systems OK' : `${countFaults(dsr)} Fault${countFaults(dsr) !== 1 ? 's' : ''} Detected`}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.6)', fontFamily: "'DM Mono', monospace" }}>
              {today}
            </p>
          </div>
        </div>

        {/* Centre: section pills */}
        {dsr && (
          <div className="flex flex-wrap gap-1.5">
            {sectionSummary.map(s => (
              <span
                key={s.label}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{
                  backgroundColor: s.ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.15)',
                  border: `1px solid ${s.ok ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.3)'}`,
                  color: s.ok ? '#86efac' : '#fca5a5',
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Right: action */}
        <div className="flex-shrink-0">
          {dsr ? (
            <button
              onClick={onView}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#f1f5f9',
                backdropFilter: 'blur(8px)',
              }}
            >
              View Report
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : isAdmin ? (
            <button
              onClick={onNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#f1f5f9',
              }}
            >
              + Create Today's DSR
            </button>
          ) : null}
        </div>
      </div>

      {/* Prepared by strip */}
      {dsr?.name && (
        <div
          className="px-6 py-2.5 flex items-center gap-2"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'rgba(148,163,184,0.6)' }}>
            <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 11c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>
            Prepared by <strong style={{ color: 'rgba(226,232,240,0.8)' }}>{dsr.name}</strong>
            {dsr.signature && <span> · Signed: <strong style={{ color: 'rgba(226,232,240,0.8)' }}>{dsr.signature}</strong></span>}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (route: Route) => void
  isAdmin: boolean
}

export default function DSRList({ onNavigate, isAdmin }: Props) {
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [showReport, setShowReport] = useState(false)
  const [tick, setTick] = useState(0)
  const [all, setAll] = useState<DSR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    getDSRs()
      .then(list => { setAll(list); setError('') })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to load DSRs.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh, tick])

  const todayDsr = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return all.find(d => d.date === today) || null
  }, [all])

  const filtered = useMemo(
    () =>
      all
        .filter(d => {
          const parts = d.date.split('-')
          if (yearFilter !== 'all' && parts[0] !== yearFilter) return false
          if (monthFilter !== 'all' && parseInt(parts[1] || '0') !== parseInt(monthFilter)) return false
          if (stateFilter !== 'all' && d.state !== stateFilter) return false
          return true
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [all, yearFilter, monthFilter, stateFilter],
  )

  const stats = useMemo(() => ({
    total: all.length,
    approved: all.filter(d => d.state === 'Approved').length,
    submitted: all.filter(d => d.state === 'Submitted').length,
    drafts: all.filter(d => d.state === 'Draft').length,
  }), [all])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this DSR?')) return
    deleteDSR(id)
      .then(() => setTick(t => t + 1))
      .catch(err => alert(err instanceof ApiError ? err.message : 'Failed to delete DSR.'))
  }

  const selCls = 'rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors'
  const selStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626' }}>
          {error}
        </div>
      )}
      {showReport && <ReportModal dsrs={filtered} onClose={() => setShowReport(false)} />}

      {/* Today's report */}
      <TodayPanel
        dsr={todayDsr}
        onView={() => onNavigate({ page: 'dsr-form', id: todayDsr!.id })}
        onNew={() => onNavigate({ page: 'dsr-form' })}
        isAdmin={isAdmin}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Total DSRs" value={stats.total} accent="#2563eb" />
        <StatTile label="Approved" value={stats.approved} accent="#16a34a" />
        <StatTile label="Submitted" value={stats.submitted} accent="#7c3aed" />
        <StatTile label="Drafts" value={stats.drafts} accent="#d97706" />
      </div>

      {/* Filters + actions */}
      <div
        className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-4 py-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <select className={selCls} style={selStyle} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="all">All Years</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select className={selCls} style={selStyle} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
          <select className={selCls} style={selStyle} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="all">All States</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReport(true)}
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            Report
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate({ page: 'dsr-form' })}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              + New DSR
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
              {['Date', 'Prepared By', 'State', 'Status', 'Last Updated', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm" style={{ color: 'var(--text4)' }}>
                  No DSRs found. Create the first one.
                </td>
              </tr>
            ) : filtered.map((dsr, i) => {
              const faults = countFaults(dsr)
              return (
                <tr
                  key={dsr.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8faff')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                    {dsr.date}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>
                    {dsr.name || <span style={{ color: 'var(--text4)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3"><StateBadge state={dsr.state} /></td>
                  <td className="px-4 py-3">
                    {faults > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#dc2626' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        {faults} fault{faults !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#16a34a' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        All OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                    {new Date(dsr.updatedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate({ page: 'dsr-form', id: dsr.id })}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }}
                      >
                        {isAdmin && dsr.state === 'Draft' ? 'Edit' : 'View'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(dsr.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                          style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
