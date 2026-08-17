import { useState, useMemo } from 'react'
import { getAppUsers, upsertAppUser, deleteAppUser, PAGE_DEFS } from '../auth'
import type { AppUser, PageKey } from '../auth'

// ── helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function avatarGradient(username: string) {
  const palettes = [
    ['#7c3aed','#a855f7'], ['#0369a1','#0ea5e9'], ['#065f46','#10b981'],
    ['#92400e','#f59e0b'], ['#9f1239','#f43f5e'], ['#1e3a5f','#3b82f6'],
  ]
  const idx = username.charCodeAt(0) % palettes.length
  return `linear-gradient(135deg, ${palettes[idx][0]}, ${palettes[idx][1]})`
}

// ── Page checkbox with dependency logic ───────────────────────────────────────
function PageCheckbox({
  def,
  checked,
  disabled,
  onChange,
}: {
  def: typeof PAGE_DEFS[number]
  checked: boolean
  disabled: boolean
  onChange: (key: PageKey, val: boolean) => void
}) {
  return (
    <label
      className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-colors"
      style={{
        backgroundColor: checked ? '#eff6ff' : '#f8fafc',
        border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(def.key, e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
      />
      <div>
        <p className="text-sm font-semibold" style={{ color: checked ? '#1e40af' : '#0f172a' }}>
          {def.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{def.desc}</p>
        {def.requires && (
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
            requires: {PAGE_DEFS.find(d => d.key === def.requires)?.label}
          </p>
        )}
      </div>
    </label>
  )
}

// ── User form modal ───────────────────────────────────────────────────────────
function UserModal({
  editing,
  onSave,
  onClose,
}: {
  editing: AppUser | null
  onSave: (user: AppUser) => void
  onClose: () => void
}) {
  const isNew = !editing

  const [username, setUsername]       = useState(editing?.username ?? '')
  const [displayName, setDisplayName] = useState(editing?.displayName ?? '')
  const [roleName, setRoleName]       = useState(editing?.roleName ?? '')
  const [password, setPassword]       = useState('')
  const [pages, setPages]             = useState<PageKey[]>(editing?.pages ?? [])
  const [active, setActive]           = useState(editing?.active ?? true)
  const [error, setError]             = useState('')

  // Group pages by group label
  const groups = useMemo(() => {
    const map = new Map<string, typeof PAGE_DEFS>()
    for (const d of PAGE_DEFS) {
      if (!map.has(d.group)) map.set(d.group, [])
      map.get(d.group)!.push(d)
    }
    return map
  }, [])

  const togglePage = (key: PageKey, val: boolean) => {
    const def = PAGE_DEFS.find(d => d.key === key)!
    setPages(prev => {
      let next = val ? [...prev, key] : prev.filter(p => p !== key)
      // If enabling and has a dependency, ensure dependency is also enabled
      if (val && def.requires && !next.includes(def.requires)) {
        next = [def.requires, ...next]
      }
      // If disabling a page that others depend on, remove dependents too
      if (!val) {
        const dependents = PAGE_DEFS.filter(d => d.requires === key).map(d => d.key)
        next = next.filter(p => !dependents.includes(p))
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim())     return setError('Username is required.')
    if (!displayName.trim())  return setError('Display name is required.')
    if (!roleName.trim())     return setError('Role name is required.')
    if (isNew && !password.trim()) return setError('Password is required for new users.')
    if (pages.length === 0)   return setError('Assign at least one page access.')

    // Check username uniqueness on create
    if (isNew) {
      const existing = getAppUsers().find(u => u.username.toLowerCase() === username.trim().toLowerCase())
      if (existing) return setError('Username already exists.')
    }

    const user: AppUser = {
      id:          editing?.id ?? crypto.randomUUID(),
      username:    username.trim().toLowerCase(),
      password:    password.trim() || editing?.password || '',
      displayName: displayName.trim(),
      roleName:    roleName.trim(),
      pages,
      active,
      createdAt:   editing?.createdAt ?? new Date().toISOString().split('T')[0],
    }
    onSave(user)
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
    >
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{
          width: '520px',
          backgroundColor: '#fff',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <div>
            <h2 className="text-base font-extrabold" style={{ color: '#0f172a' }}>
              {isNew ? 'Create New User' : `Edit — ${editing!.displayName}`}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {isNew ? 'Set credentials and assign page access' : 'Update role, password or page permissions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}>
              {error}
            </div>
          )}

          {/* Identity */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>Identity</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#475569' }}>
                  Username {isNew && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={!isNew}
                  placeholder="e.g. john.doe"
                  style={{ ...inputStyle, opacity: isNew ? 1 : 0.6 }}
                  onFocus={e => (e.target.style.borderColor = '#93c5fd')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#475569' }}>
                  Display Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#93c5fd')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#475569' }}>
                  Role Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="e.g. NOC Engineer, Manager, Viewer"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#93c5fd')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
              Password {!isNew && <span style={{ color: '#cbd5e1', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— leave blank to keep current</span>}
            </p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isNew ? 'Set a password' : 'New password (optional)'}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#93c5fd')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Page Access */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
                Page Access
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPages(PAGE_DEFS.map(d => d.key))}
                  className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPages([])}
                  className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}
                >
                  None
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {Array.from(groups.entries()).map(([group, defs]) => (
                <div key={group}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#0f172a' }}>{group}</p>
                  <div className="space-y-2">
                    {defs.map(def => (
                      <PageCheckbox
                        key={def.key}
                        def={def}
                        checked={pages.includes(def.key)}
                        disabled={false}
                        onChange={togglePage}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              {pages.length} page{pages.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Account Active</p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Inactive users cannot sign in</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0"
              style={{ backgroundColor: active ? '#2563eb' : '#cbd5e1' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: active ? '26px' : '2px' }}
              />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
          >
            {isNew ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function UserMgmt() {
  const [users, setUsers]         = useState<AppUser[]>(() => getAppUsers())
  const [modal, setModal]         = useState<'new' | AppUser | null>(null)
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch]       = useState('')

  const refresh = () => setUsers(getAppUsers())

  const handleSave = (user: AppUser) => {
    upsertAppUser(user)
    refresh()
    setModal(null)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    deleteAppUser(id)
    refresh()
  }

  const handleToggleActive = (user: AppUser) => {
    upsertAppUser({ ...user, active: !user.active })
    refresh()
  }

  const allRoles = useMemo(() => [...new Set(users.map(u => u.roleName).filter(Boolean))], [users])

  const filtered = useMemo(() =>
    users.filter(u => {
      if (filterRole && u.roleName !== filterRole) return false
      if (search && !u.displayName.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
    [users, filterRole, search],
  )

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.active).length,
    roles: allRoles.length,
  }), [users, allRoles])

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Modal */}
      {modal !== null && (
        <UserModal
          editing={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.total, accent: '#2563eb' },
          { label: 'Active',      value: stats.active, accent: '#16a34a' },
          { label: 'Roles',       value: stats.roles,  accent: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${s.accent}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
            <p className="text-3xl font-extrabold" style={{ color: '#0f172a', fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#94a3b8' }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'inherit' }}
            />
          </div>
          {/* Role filter */}
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            <option value="">All Roles</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-all flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['User', 'Role', 'Page Access', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm" style={{ color: '#cbd5e1' }}>
                  {users.length === 0 ? 'No users yet. Create the first one.' : 'No users match the filter.'}
                </td>
              </tr>
            ) : filtered.map((user, i) => (
              <tr
                key={user.id}
                className="transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: user.active ? 1 : 0.55 }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafbff')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* User */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: avatarGradient(user.username) }}
                    >
                      {initials(user.displayName)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>{user.displayName}</p>
                      <p className="text-xs" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{user.username}</p>
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td className="px-4 py-3.5">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#f5f3ff', color: '#5b21b6', border: '1px solid #ddd6fe' }}
                  >
                    {user.roleName}
                  </span>
                </td>
                {/* Pages */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {user.pages.length === PAGE_DEFS.length ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                        Full Access
                      </span>
                    ) : user.pages.slice(0, 3).map(p => {
                      const def = PAGE_DEFS.find(d => d.key === p)
                      return def ? (
                        <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                          {def.label.split(' — ')[0]}
                        </span>
                      ) : null
                    })}
                    {user.pages.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        +{user.pages.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={user.active
                      ? { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }
                      : { color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }
                    }
                  >
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {/* Created */}
                <td className="px-4 py-3.5 text-xs" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
                  {user.createdAt}
                </td>
                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal(user)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={user.active
                        ? { backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }
                        : { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }
                      }
                    >
                      {user.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.displayName)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin note */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" style={{ color: '#d97706' }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-xs" style={{ color: '#92400e' }}>
          The built-in <strong>admin</strong> account has full access and cannot be managed here.
          Users created here will only have access to the specific pages you assign.
        </p>
      </div>
    </div>
  )
}
