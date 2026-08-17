import { useState } from 'react'
import { getStoredSession, logout as authLogout, canAccess } from './auth'
import type { AuthSession } from './auth'
import Login from './views/Login'
import DSRList from './views/DSRList'
import DSRForm from './views/DSRForm'
import BackupList from './views/BackupList'
import BackupForm from './views/BackupForm'
import ClientMgmt from './views/ClientMgmt'
import UserMgmt from './views/UserMgmt'
import logoSrc from '@/imports/logocloud_upscaled.png'

export type Route =
  | { page: 'dsr-list' }
  | { page: 'dsr-form'; id?: string }
  | { page: 'backup-list' }
  | { page: 'backup-form'; id?: string }
  | { page: 'clients' }
  | { page: 'users' }

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Icon = {
  list: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="2" y="3.5" width="13" height="1.5" rx=".75" fill="currentColor" />
      <rect x="2" y="7.75" width="13" height="1.5" rx=".75" fill="currentColor" />
      <rect x="2" y="12" width="13" height="1.5" rx=".75" fill="currentColor" />
    </svg>
  ),
  plus: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  box: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="2.5" y="2.5" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 6.5h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 2.5v4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  users: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="6.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 14.5c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 6.5a2 2 0 0 1 0-4M15.5 14.5c0-2.072-1.343-3.84-3.25-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  userKey: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 14c0-2.485 2.015-4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 13.5L9 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11.2 14.3l.8-.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  logout: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 11L14 8l-3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  shield: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1L2 2.5v3.5c0 2.5 1.8 4.5 4 5 2.2-.5 4-2.5 4-5V2.5L6 1z" fill="currentColor" />
    </svg>
  ),
  eye: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  chevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2.5L4.5 7 9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

// ── Nav primitives ────────────────────────────────────────────────────────────
function NavGroup({ label, open }: { label: string; open: boolean }) {
  if (!open) {
    return (
      <div className="mx-3 my-3" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)' }} />
    )
  }
  return (
    <div className="flex items-center gap-2 px-4 pt-5 pb-1.5">
      <span
        className="text-[9px] font-extrabold tracking-[0.18em] uppercase"
        style={{ color: 'rgba(148,163,184,0.6)', fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

function NavItem({
  label, icon, active, open, onClick, isNew,
}: {
  label: string; icon: React.ReactNode; active: boolean
  open: boolean; onClick: () => void; isNew?: boolean
}) {
  return (
    <div className="px-2">
      <button
        onClick={onClick}
        title={!open ? label : undefined}
        className="w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-150 relative group"
        style={{
          padding: open ? '9px 12px' : '9px',
          justifyContent: open ? 'flex-start' : 'center',
          color: active ? '#fff' : 'rgba(148,163,184,0.85)',
          backgroundColor: active ? 'rgba(56,189,248,0.18)' : 'transparent',
          borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.06)'
          if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(226,232,240,0.95)'
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.85)'
        }}
      >
        <span className="flex-shrink-0 opacity-90">{icon}</span>
        {open && <span className="flex-1 truncate">{label}</span>}
        {open && isNew && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(56,189,248,0.2)', color: '#38bdf8' }}>
            NEW
          </span>
        )}
        {!open && (
          <div
            className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
            style={{ backgroundColor: '#1e293b', color: '#f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            {label}
          </div>
        )}
      </button>
    </div>
  )
}

// ── Page titles ───────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  'dsr-list':    { title: 'Daily Status Reports',    subtitle: 'All DSR records and history' },
  'dsr-form':    { title: 'DSR Entry',               subtitle: 'Create or update a Daily Status Report' },
  'backup-list': { title: 'Monthly Backup Tests',    subtitle: 'Client backup verification records' },
  'backup-form': { title: 'Backup Test Entry',       subtitle: 'Monthly backup test record' },
  clients:       { title: 'Client Management',       subtitle: 'Manage clients for backup tests' },
  users:         { title: 'User Management',         subtitle: 'Create users and assign page access' },
}

// ── Access-denied placeholder ─────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#d97706' }}>
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 8v5M12 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Access restricted</p>
      <p className="text-xs" style={{ color: '#94a3b8' }}>You do not have permission to view this page.</p>
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const [route, setRoute] = useState<Route>({ page: 'dsr-list' })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!session) {
    return <Login onLogin={s => setSession(s)} />
  }

  const isAdmin = session.isAdmin

  const nav = (r: Route) => {
    // Page-level access guard
    const page = r.page
    if (page === 'users') {
      if (!isAdmin) return
    } else if (!canAccess(session, page as Parameters<typeof canAccess>[1])) {
      return
    }
    setRoute(r)
  }

  const handleLogout = () => {
    authLogout()
    setSession(null)
    setRoute({ page: 'dsr-list' })
  }

  const currentPage = PAGE_TITLES[route.page] || { title: '', subtitle: '' }
  const isId = (page: string) => route.page === page && !!(route as { page: string; id?: string }).id
  const initials = session.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // First accessible page as default landing
  const firstNav = () => {
    if (canAccess(session, 'dsr-list')) return nav({ page: 'dsr-list' })
    if (canAccess(session, 'backup-list')) return nav({ page: 'backup-list' })
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f4f8' }}>
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 no-print overflow-hidden"
        style={{
          width: sidebarOpen ? '240px' : '64px',
          background: 'linear-gradient(180deg, #0c1929 0%, #0f2236 50%, #0f172a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div
          className="flex-shrink-0 flex items-center px-3 transition-all duration-300"
          style={{
            height: '80px',
            background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(3,105,161,0.08) 100%)',
            borderBottom: '1px solid rgba(56,189,248,0.12)',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
        >
          <img
            src={logoSrc}
            alt="Square VM Cloud"
            className="object-contain flex-shrink-0"
            style={{ height: sidebarOpen ? '54px' : '40px', width: 'auto', transition: 'height 0.3s' }}
          />
          {sidebarOpen && (
            <div className="ml-2 overflow-hidden">
              <p className="text-sm font-extrabold leading-tight whitespace-nowrap" style={{ color: '#f0f9ff' }}>
                Square VM Cloud
              </p>
              <p className="text-[10px] whitespace-nowrap mt-0.5" style={{ color: 'rgba(148,163,184,0.7)', fontFamily: "'DM Mono', monospace" }}>
                DSR System
              </p>
            </div>
          )}
        </div>

        {/* User card */}
        {sidebarOpen ? (
          <div
            className="mx-3 my-3 rounded-xl flex items-center gap-2.5 px-3 py-2.5 flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                  : 'linear-gradient(135deg, #475569, #64748b)',
                color: '#fff',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: '#e2e8f0' }}>
                {session.displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ color: isAdmin ? '#38bdf8' : '#94a3b8' }}>
                  {isAdmin ? <Icon.shield /> : <Icon.eye />}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: isAdmin ? '#38bdf8' : '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
                  {session.roleName}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center my-3 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold"
              title={`${session.displayName} (${session.roleName})`}
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                  : 'linear-gradient(135deg, #475569, #64748b)',
                color: '#fff',
              }}
            >
              {initials}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
          {(isAdmin || canAccess(session, 'dsr-list')) && (
            <>
              <NavGroup label="Daily DSR" open={sidebarOpen} />
              {canAccess(session, 'dsr-list') && (
                <NavItem label="All DSRs" icon={<Icon.list />} active={route.page === 'dsr-list'} open={sidebarOpen} onClick={() => nav({ page: 'dsr-list' })} />
              )}
              {canAccess(session, 'dsr-form') && (
                <NavItem label="New DSR" icon={<Icon.plus />} active={route.page === 'dsr-form' && !isId('dsr-form')} open={sidebarOpen} onClick={() => nav({ page: 'dsr-form' })} isNew />
              )}
            </>
          )}

          {(isAdmin || canAccess(session, 'backup-list')) && (
            <>
              <NavGroup label="Backup Tests" open={sidebarOpen} />
              {canAccess(session, 'backup-list') && (
                <NavItem label="All Tests" icon={<Icon.box />} active={route.page === 'backup-list'} open={sidebarOpen} onClick={() => nav({ page: 'backup-list' })} />
              )}
              {canAccess(session, 'backup-form') && (
                <NavItem label="New Test" icon={<Icon.plus />} active={route.page === 'backup-form' && !isId('backup-form')} open={sidebarOpen} onClick={() => nav({ page: 'backup-form' })} isNew />
              )}
            </>
          )}

          {isAdmin && (
            <>
              <NavGroup label="Admin" open={sidebarOpen} />
              <NavItem label="Clients" icon={<Icon.users />} active={route.page === 'clients'} open={sidebarOpen} onClick={() => nav({ page: 'clients' })} />
              <NavItem label="Users" icon={<Icon.userKey />} active={route.page === 'users'} open={sidebarOpen} onClick={() => nav({ page: 'users' })} />
            </>
          )}
        </nav>

        {/* Bottom bar */}
        <div className="flex-shrink-0 px-2 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all px-3 py-2.5 group relative"
            style={{ color: 'rgba(248,113,113,0.85)', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
          >
            <Icon.logout />
            {sidebarOpen && <span>Sign Out</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ backgroundColor: '#1e293b', color: '#f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                Sign Out
              </div>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center rounded-xl py-2 transition-all"
            style={{ color: 'rgba(100,116,139,0.6)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.9)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(100,116,139,0.6)')}
          >
            {sidebarOpen ? <Icon.chevronLeft /> : <Icon.chevronRight />}
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between flex-shrink-0 no-print"
          style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div>
            <h1 className="text-base font-extrabold leading-tight" style={{ color: '#0f172a' }}>
              {currentPage.title}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{currentPage.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={isAdmin
                ? { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                : { backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }
              }
            >
              <span>{isAdmin ? <Icon.shield /> : <Icon.eye />}</span>
              <span className="uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px' }}>
                {session.roleName}
              </span>
            </div>
            <span className="text-xs font-medium hidden sm:block" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold cursor-default"
              title={`${session.displayName} · ${session.roleName}`}
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                  : 'linear-gradient(135deg, #475569, #64748b)',
                color: '#fff',
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto" onClick={() => {
          // Auto-navigate to first accessible page if current page is blocked
          if (!isAdmin && route.page === 'dsr-list' && !canAccess(session, 'dsr-list')) {
            firstNav()
          }
        }}>
          {route.page === 'dsr-list' && (
            canAccess(session, 'dsr-list')
              ? <DSRList onNavigate={nav} isAdmin={isAdmin && canAccess(session, 'dsr-form')} />
              : <AccessDenied />
          )}
          {route.page === 'dsr-form' && (
            canAccess(session, 'dsr-list')
              ? <DSRForm id={(route as Extract<Route, { page: 'dsr-form' }>).id} onNavigate={nav} isAdmin={isAdmin} />
              : <AccessDenied />
          )}
          {route.page === 'backup-list' && (
            canAccess(session, 'backup-list')
              ? <BackupList onNavigate={nav} isAdmin={isAdmin && canAccess(session, 'backup-form')} />
              : <AccessDenied />
          )}
          {route.page === 'backup-form' && (
            canAccess(session, 'backup-list')
              ? <BackupForm id={(route as Extract<Route, { page: 'backup-form' }>).id} onNavigate={nav} isAdmin={isAdmin} />
              : <AccessDenied />
          )}
          {route.page === 'clients' && (
            isAdmin ? <ClientMgmt /> : <AccessDenied />
          )}
          {route.page === 'users' && (
            isAdmin ? <UserMgmt /> : <AccessDenied />
          )}
        </main>
      </div>
    </div>
  )
}
