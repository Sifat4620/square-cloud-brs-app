import { useState } from 'react'
import { login } from '../auth'
import type { AuthSession } from '../auth'
import logoSrc from '@/imports/logocloud_upscaled.png'

interface Props {
  onLogin: (user: AuthSession) => void
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = login(username.trim(), password)
      if (user) {
        onLogin(user)
      } else {
        setError('Invalid username or password.')
        setLoading(false)
      }
    }, 400)
  }

  const fill = (u: string, p: string) => { setUsername(u); setPassword(p); setError('') }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #0c1f3f 0%, #0a4a7c 40%, #0e7bb5 75%, #29a8dc 100%)',
      }}
    >
      {/* Sky texture blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: '-200px', left: '-150px' }} />
        <div className="absolute" style={{ width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: '-100px', right: '-100px' }} />
        <div className="absolute" style={{ width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', top: '40%', right: '15%' }} />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Top banner */}
        <div
          className="px-8 pt-10 pb-6 flex flex-col items-center"
          style={{
            background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderBottom: '1px solid #bae6fd',
          }}
        >
          <img
            src={logoSrc}
            alt="Square VM Cloud"
            className="object-contain"
            style={{ height: '100px', width: 'auto', marginBottom: '12px' }}
          />
          <h1 className="text-xl font-extrabold text-center" style={{ color: '#0c1f3f' }}>
            DSR Management System
          </h1>
          <p className="text-sm text-center mt-1" style={{ color: '#0369a1' }}>
            Infrastructure Operations Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#475569', fontFamily: "'DM Mono', monospace" }}>
              Username
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = '#38bdf8')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#475569', fontFamily: "'DM Mono', monospace" }}>
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-xl pl-10 pr-11 py-3 text-sm font-medium focus:outline-none transition-all"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.target.style.borderColor = '#38bdf8')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: showPass ? '#0369a1' : '#94a3b8' }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{
              background: loading
                ? '#64748b'
                : 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(3, 105, 161, 0.4)',
              letterSpacing: '0.025em',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>

          {/* Demo credentials */}
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>
              Demo Accounts
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fill('admin', 'Admin@2025')}
                className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-50"
                style={{ border: '1px solid #bfdbfe' }}
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>A</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#1e40af' }}>admin</p>
                  <p className="text-[10px]" style={{ color: '#64748b', fontFamily: "'DM Mono', monospace" }}>Admin@2025</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fill('viewer', 'View@2025')}
                className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>V</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#334155' }}>viewer</p>
                  <p className="text-[10px]" style={{ color: '#64748b', fontFamily: "'DM Mono', monospace" }}>View@2025</p>
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            © 2025 Square VM Cloud · DSR Management System
          </p>
        </div>
      </div>
    </div>
  )
}
