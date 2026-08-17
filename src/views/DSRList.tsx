import { useState, useMemo } from 'react'
import { getDSRs, deleteDSR, MONTHS, YEARS } from '../store'
import type { Route } from '../App'
import type { DSR, DSRState } from '../types'

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

  const all = useMemo(() => getDSRs(), [tick])

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
    setTick(t => t + 1)
  }

  const selCls = 'rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors'
  const selStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }

  return (
    <div className="p-6 space-y-6">
      {showReport && <ReportModal dsrs={filtered} onClose={() => setShowReport(false)} />}

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
