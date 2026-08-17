import { useState, useMemo } from 'react'
import { getClients, upsertClient } from '../store'
import type { Client } from '../types'

export default function ClientMgmt() {
  const [clients, setClients] = useState<Client[]>(() => getClients())
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const activeCount = useMemo(() => clients.filter(c => c.active).length, [clients])
  const refresh = () => setClients(getClients())

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    upsertClient({ id: crypto.randomUUID(), name, active: true, createdAt: new Date().toISOString().split('T')[0] })
    refresh()
    setNewName('')
    setShowAdd(false)
  }

  const handleSaveEdit = (id: string) => {
    const name = editName.trim()
    if (!name) return
    const c = clients.find(c => c.id === id)
    if (!c) return
    upsertClient({ ...c, name })
    refresh()
    setEditId(null)
  }

  const handleToggle = (id: string) => {
    const c = clients.find(c => c.id === id)
    if (!c) return
    upsertClient({ ...c, active: !c.active })
    refresh()
  }

  const inputBase: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid var(--border2)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Client Management</h2>
          <p className="text-sm mt-0.5">
            <span className="font-bold" style={{ color: '#16a34a' }}>{activeCount}</span>
            <span style={{ color: 'var(--text3)' }}> active · </span>
            <span className="font-semibold" style={{ color: 'var(--text2)' }}>{clients.length}</span>
            <span style={{ color: 'var(--text3)' }}> total</span>
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          + Add Client
        </button>
      </div>

      {/* Add row */}
      {showAdd && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setShowAdd(false); setNewName('') }
            }}
            placeholder="Enter client name"
            autoFocus
            className="flex-1 focus:ring-2 focus:ring-blue-200"
            style={inputBase}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewName('') }}
            className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text3)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
              {['#', 'Client Name', 'Status', 'Added', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm" style={{ color: 'var(--text4)' }}>
                  No clients yet.
                </td>
              </tr>
            ) : clients.map((client, idx) => (
              <tr
                key={client.id}
                className="transition-colors"
                style={{
                  borderBottom: idx < clients.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: client.active ? 1 : 0.55,
                }}
                onMouseEnter={e => client.active && (e.currentTarget.style.backgroundColor = '#f8faff')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--text4)', fontFamily: "'DM Mono', monospace" }}>
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  {editId === client.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(client.id)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      autoFocus
                      className="rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-xs"
                      style={{ ...inputBase, padding: '5px 10px', fontSize: '13px', border: '1.5px solid #93c5fd' }}
                    />
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{client.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={client.active
                      ? { color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }
                      : { color: '#475569', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }
                    }
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>
                  {client.createdAt}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editId === client.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(client.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                          style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', color: 'var(--primary)' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100"
                          style={{ color: 'var(--text3)', border: '1px solid var(--border)' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditId(client.id); setEditName(client.name) }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                          style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(client.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                          style={client.active
                            ? { backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626' }
                            : { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }
                          }
                        >
                          {client.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs" style={{ color: 'var(--text4)', fontFamily: "'DM Mono', monospace" }}>
        Only active clients are included when creating new monthly backup tests.
      </p>
    </div>
  )
}
