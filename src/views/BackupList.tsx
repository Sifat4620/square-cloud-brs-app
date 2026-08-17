import { useState, useMemo, useEffect, useCallback } from 'react'
import { getBackups, deleteBackup, MONTHS, YEARS } from '../store'
import { ApiError } from '../api'
import type { Route } from '../App'
import type { BackupTest, BackupState, TestStatus } from '../types'

function StateBadge({ state }: { state: BackupState }) {
  const styles: Record<BackupState, React.CSSProperties> = {
    Pending:   { color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
    Completed: { color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
    Failed:    { color: '#991b1b', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' },
    Approved:  { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={styles[state]}>
      {state}
    </span>
  )
}

function TestStatusPill({ status }: { status: TestStatus }) {
  const styles: Record<TestStatus, React.CSSProperties> = {
    OK:      { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
    FAILED:  { color: '#991b1b', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' },
    PENDING: { color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' },
    'N/A':   { color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  }
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={styles[status]}>{status}</span>
}

// ── Report modal ──────────────────────────────────────────────────────────────
function ReportModal({ all, onClose }: { all: BackupTest[]; onClose: () => void }) {
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly')
  const [repYear, setRepYear] = useState(new Date().getFullYear())
  const [repMonth, setRepMonth] = useState(new Date().getMonth() + 1)

  const monthlyBt = useMemo(
    () => all.find(b => b.year === repYear && b.month === repMonth) || null,
    [all, repYear, repMonth],
  )

  const yearlyData = useMemo(() => {
    const months = []
    for (let m = 1; m <= 12; m++) {
      const bt = all.find(b => b.year === repYear && b.month === m)
      months.push({ month: m, bt })
    }
    return months
  }, [all, repYear])

  const yearlyStats = useMemo(() => {
    const covered = yearlyData.filter(d => d.bt)
    return {
      covered: covered.length,
      approved: covered.filter(d => d.bt?.state === 'Approved').length,
      totalClients: covered.reduce((s, d) => s + (d.bt?.entries.length || 0), 0),
      totalFailed:  covered.reduce((s, d) => s + (d.bt?.entries.filter(e => e.testStatus === 'FAILED').length || 0), 0),
    }
  }, [yearlyData])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}>
      <div
        className="w-full flex flex-col"
        style={{ maxWidth: '820px', maxHeight: '92vh', backgroundColor: 'var(--surface)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}
        >
          <div>
            <h2 className="text-base font-extrabold" style={{ color: '#0c1f3f' }}>Backup Test Reports</h2>
            <p className="text-xs mt-0.5" style={{ color: '#0369a1' }}>Monthly detail · Yearly summary · Print / Export</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors text-lg">✕</button>
        </div>

        {/* Tabs + filters */}
        <div
          className="flex items-center justify-between px-6 py-3 flex-shrink-0 flex-wrap gap-3"
          style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface2)' }}
        >
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--border)' }}>
            {(['monthly', 'yearly'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all"
                style={tab === t
                  ? { backgroundColor: 'white', color: '#1e40af', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                  : { color: 'var(--text3)' }
                }
              >
                {t === 'monthly' ? 'Monthly Report' : 'Yearly Summary'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={repYear}
              onChange={e => setRepYear(parseInt(e.target.value))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {tab === 'monthly' && (
              <select
                value={repMonth}
                onChange={e => setRepMonth(parseInt(e.target.value))}
                className="rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0369a1', color: 'white' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="4" width="10" height="6.5" rx="1.5" stroke="white" strokeWidth="1.3" />
                <path d="M4 4V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V4" stroke="white" strokeWidth="1.3" />
                <rect x="3.5" y="7" width="6" height="3" rx=".5" fill="white" />
              </svg>
              Print / Export
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Monthly */}
          {tab === 'monthly' && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between pb-4" style={{ borderBottom: '2px solid var(--border)' }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>Square VM Cloud</p>
                  <h3 className="text-xl font-extrabold" style={{ color: '#0f172a' }}>Monthly Backup Test Report</h3>
                  <p className="text-sm mt-0.5 font-semibold" style={{ color: '#0369a1', fontFamily: "'DM Mono', monospace" }}>
                    {MONTHS[repMonth - 1]} {repYear}
                  </p>
                </div>
                {monthlyBt && (
                  <div className="text-right">
                    <StateBadge state={monthlyBt.state} />
                    {monthlyBt.date && (
                      <p className="text-xs mt-2" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>Test date: {monthlyBt.date}</p>
                    )}
                  </div>
                )}
              </div>

              {!monthlyBt ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-sm font-semibold" style={{ color: '#94a3b8' }}>
                    No backup test recorded for {MONTHS[repMonth - 1]} {repYear}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total Clients', value: monthlyBt.entries.length, color: '#2563eb' },
                      { label: 'OK',     value: monthlyBt.entries.filter(e => e.testStatus === 'OK').length,      color: '#16a34a' },
                      { label: 'Failed', value: monthlyBt.entries.filter(e => e.testStatus === 'FAILED').length,  color: '#dc2626' },
                      { label: 'Pending',value: monthlyBt.entries.filter(e => e.testStatus === 'PENDING').length, color: '#d97706' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderTop: `3px solid ${s.color}` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
                        <p className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '32px' }}>#</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>Client Name</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '120px' }}>Logs / Status</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)', width: '110px' }}>Test Status</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyBt.entries.map((e, i) => (
                          <tr
                            key={e.clientId}
                            style={{
                              borderBottom: i < monthlyBt.entries.length - 1 ? '1px solid var(--border)' : 'none',
                              backgroundColor: e.testStatus === 'FAILED' ? '#fff8f8' : e.testStatus === 'PENDING' ? '#fffef5' : 'transparent',
                            }}
                          >
                            <td className="px-4 py-2.5 text-xs font-bold" style={{ color: 'var(--text4)', fontFamily: "'DM Mono', monospace" }}>{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-sm" style={{ color: 'var(--text)' }}>{e.clientName}</td>
                            <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace" }}>{e.logsStatus || '—'}</td>
                            <td className="px-4 py-2.5"><TestStatusPill status={e.testStatus} /></td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: e.remarks ? 'var(--text2)' : 'var(--text4)' }}>{e.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(monthlyBt.responsibleName || monthlyBt.responsibleDesignation) && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>Responsible Person</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        {[
                          { label: 'Name',        value: monthlyBt.responsibleName },
                          { label: 'Designation', value: monthlyBt.responsibleDesignation },
                          { label: 'Date',        value: monthlyBt.date },
                          { label: 'Signature',   value: monthlyBt.signature },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{f.label}</p>
                            <p className="font-semibold" style={{ color: f.value ? 'var(--text)' : 'var(--text4)' }}>{f.value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Yearly */}
          {tab === 'yearly' && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between pb-4" style={{ borderBottom: '2px solid var(--border)' }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>Square VM Cloud</p>
                  <h3 className="text-xl font-extrabold" style={{ color: '#0f172a' }}>Yearly Backup Test Summary</h3>
                  <p className="text-sm mt-0.5 font-semibold" style={{ color: '#0369a1', fontFamily: "'DM Mono', monospace" }}>
                    January — December {repYear}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Months Covered', value: yearlyStats.covered,      color: '#2563eb' },
                  { label: 'Approved',        value: yearlyStats.approved,     color: '#16a34a' },
                  { label: 'Total Tests',     value: yearlyStats.totalClients, color: '#7c3aed' },
                  { label: 'Total Failed',    value: yearlyStats.totalFailed,  color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderTop: `3px solid ${s.color}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
                    <p className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
                      {['Month', 'State', 'Clients', 'OK', 'Failed', 'Pending', 'Responsible', 'Test Date'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map(({ month, bt: rowBt }, i) => (
                      <tr
                        key={month}
                        className="transition-colors"
                        style={{ borderBottom: i < 11 ? '1px solid var(--border)' : 'none', opacity: rowBt ? 1 : 0.45 }}
                      >
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{MONTHS[month - 1]}</td>
                        <td className="px-4 py-3">
                          {rowBt ? <StateBadge state={rowBt.state} /> : <span className="text-xs" style={{ color: 'var(--text4)' }}>—</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm text-center" style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace" }}>{rowBt ? rowBt.entries.length : '—'}</td>
                        <td className="px-4 py-3 font-semibold text-sm" style={{ color: '#16a34a', fontFamily: "'DM Mono', monospace" }}>
                          {rowBt ? rowBt.entries.filter(e => e.testStatus === 'OK').length : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm" style={{ fontFamily: "'DM Mono', monospace", color: rowBt && rowBt.entries.some(e => e.testStatus === 'FAILED') ? '#dc2626' : '#94a3b8' }}>
                          {rowBt ? rowBt.entries.filter(e => e.testStatus === 'FAILED').length : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm" style={{ color: '#d97706', fontFamily: "'DM Mono', monospace" }}>
                          {rowBt ? rowBt.entries.filter(e => e.testStatus === 'PENDING').length : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text2)' }}>{rowBt?.responsibleName || <span style={{ color: 'var(--text4)' }}>—</span>}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{rowBt?.date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Failed incidents */}
              {(() => {
                const rows: { month: string; client: string; remarks: string }[] = []
                for (const { month, bt: rowBt } of yearlyData) {
                  if (!rowBt) continue
                  for (const e of rowBt.entries) {
                    if (e.testStatus === 'FAILED') rows.push({ month: MONTHS[month - 1], client: e.clientName, remarks: e.remarks })
                  }
                }
                if (!rows.length) return null
                return (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#dc2626', fontFamily: "'DM Mono', monospace" }}>
                      Failed Test Incidents — {repYear}
                    </p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #fecdd3' }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: '#fff1f2', borderBottom: '1px solid #fecdd3' }}>
                            <th className="px-4 py-2.5 text-left text-xs font-bold" style={{ color: '#991b1b' }}>Month</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold" style={{ color: '#991b1b' }}>Client</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold" style={{ color: '#991b1b' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #fecdd3' : 'none', backgroundColor: i % 2 === 0 ? '#fff8f8' : 'transparent' }}>
                              <td className="px-4 py-2.5 font-semibold" style={{ color: '#7f1d1d', fontFamily: "'DM Mono', monospace" }}>{r.month}</td>
                              <td className="px-4 py-2.5 font-medium" style={{ color: '#0f172a' }}>{r.client}</td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>{r.remarks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface2)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}
          >
            Print / Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${accent}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{label}</p>
      <p className="text-3xl font-extrabold" style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{value}</p>
    </div>
  )
}


interface Props {
  onNavigate: (route: Route) => void
  isAdmin: boolean
}

export default function BackupList({ onNavigate, isAdmin }: Props) {
  const [yearFilter, setYearFilter]   = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [showReport, setShowReport] = useState(false)
  const [tick, setTick] = useState(0)
  const [all, setAll] = useState<BackupTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    getBackups()
      .then(list => { setAll(list); setError('') })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to load backup tests.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh, tick])

  const filtered = useMemo(() =>
    all
      .filter(b => {
        if (yearFilter !== 'all' && b.year !== parseInt(yearFilter)) return false
        if (stateFilter !== 'all' && b.state !== stateFilter) return false
        return true
      })
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month),
    [all, yearFilter, stateFilter],
  )

  const stats = useMemo(() => ({
    total:    all.length,
    approved: all.filter(b => b.state === 'Approved').length,
    pending:  all.filter(b => b.state === 'Pending').length,
    failed:   all.filter(b => b.state === 'Failed').length,
  }), [all])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this backup test? This cannot be undone.')) return
    deleteBackup(id)
      .then(() => setTick(t => t + 1))
      .catch(err => alert(err instanceof ApiError ? err.message : 'Failed to delete backup test.'))
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
      {showReport && <ReportModal all={all} onClose={() => setShowReport(false)} />}

      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Total Tests" value={stats.total}    accent="#2563eb" />
        <StatTile label="Approved"    value={stats.approved} accent="#16a34a" />
        <StatTile label="Pending"     value={stats.pending}  accent="#d97706" />
        <StatTile label="Failed"      value={stats.failed}   accent="#dc2626" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <select className={selCls} style={selStyle} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="all">All Years</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select className={selCls} style={selStyle} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="all">All States</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Reports
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate({ page: 'backup-form' })}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
            >
              + New Backup Test
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
              {['Period', 'State', 'Clients', 'OK', 'Failed', 'Responsible', 'Last Updated', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-sm" style={{ color: 'var(--text4)' }}>
                  No backup tests found. Create the first one to get started.
                </td>
              </tr>
            ) : filtered.map((bt, i) => {
              const failed = bt.entries.filter(e => e.testStatus === 'FAILED').length
              const ok     = bt.entries.filter(e => e.testStatus === 'OK').length
              return (
                <tr
                  key={bt.id}
                  className="transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8faff')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3.5 font-bold" style={{ color: 'var(--text)', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                    {MONTHS[bt.month - 1]} {bt.year}
                  </td>
                  <td className="px-4 py-3.5"><StateBadge state={bt.state} /></td>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: 'var(--text2)', fontFamily: "'DM Mono', monospace" }}>
                    {bt.entries.length}
                  </td>
                  <td className="px-4 py-3.5 font-semibold" style={{ color: '#16a34a', fontFamily: "'DM Mono', monospace" }}>
                    {ok}
                  </td>
                  <td className="px-4 py-3.5">
                    {failed > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#dc2626' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        {failed}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-sm" style={{ color: 'var(--text2)' }}>
                    {bt.responsibleName || <span style={{ color: 'var(--text4)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                    {new Date(bt.updatedAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate({ page: 'backup-form', id: bt.id })}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }}
                      >
                        {isAdmin && bt.state === 'Pending' ? 'Edit' : 'View'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(bt.id)}
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
