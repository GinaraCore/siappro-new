'use client'

// ============================================================
// SIAP-Pro: Login Page
// Dewan Ekonomi Nasional Republik Indonesia
// Autentikasi Pengguna & Akses Kedinasan
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError, user } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ username: false, password: false })

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ username: true, password: true })

    if (!username.trim() || !password) return

    const success = await login(username, password)
    if (success) {
      router.replace('/dashboard')
    }
  }

  const fillCredentials = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    clearError()
    setTouched({ username: true, password: true })
  }

  const usernameError = touched.username && !username.trim() ? 'Nama pengguna wajib diisi.' : null
  const passwordError = touched.password && !password ? 'Kata sandi wajib diisi.' : null

  return (
    <div className="login-page">
      <main className="login-container">
        {/* Institutional Agency Header */}
        <header className="login-header">
          <div className="login-logo-wrap">
            <img
              src="/logo-den.svg"
              alt="Dewan Ekonomi Nasional RI"
              className="login-logo-img"
            />
          </div>

          <div className="login-title-group">
            <h1 className="login-app-title">SIAP-Pro</h1>
            <p className="login-app-desc">Sistem Informasi & Aplikasi Protokoler</p>
            <p className="login-agency">Dewan Ekonomi Nasional Republik Indonesia</p>
          </div>
        </header>

        {/* Secure Access Card */}
        <section className="login-card" aria-labelledby="login-form-title">
          <div className="login-card-header">
            <h2 id="login-form-title" className="login-card-title">Masuk ke Sistem Kedinasan</h2>
            <p className="login-card-desc">Gunakan identitas dinas yang terdaftar pada sistem keamanan.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Global Error Notice */}
            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button
                  type="button"
                  className="login-error-close"
                  onClick={clearError}
                  aria-label="Tutup notifikasi kendala"
                >
                  ×
                </button>
              </div>
            )}

            {/* Username Input */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nama Pengguna
              </label>
              <div className="input-wrapper">
                <User size={15} className="input-icon" aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  className={cn('form-input input-with-icon', usernameError && 'error')}
                  placeholder="Contoh: kabag / protokol1"
                  value={username}
                  onChange={e => { setUsername(e.target.value); clearError() }}
                  onBlur={() => setTouched(t => ({ ...t, username: true }))}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isLoading}
                  aria-describedby={usernameError ? 'username-error' : undefined}
                  aria-invalid={!!usernameError}
                />
              </div>
              {usernameError && (
                <span id="username-error" className="form-error">
                  <AlertCircle size={12} /> {usernameError}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Kata Sandi
              </label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={cn('form-input input-with-icon input-with-icon-right', passwordError && 'error')}
                  placeholder="Masukkan kata sandi dinas"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError() }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  className="input-eye-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordError && (
                <span id="password-error" className="form-error">
                  <AlertCircle size={12} /> {passwordError}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memverifikasi Otorisasi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Masuk ke SIAP-Pro</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="login-quick-section">
            <span className="login-quick-label">Akses Cepat Pengujian:</span>
            <div className="login-quick-buttons">
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => fillCredentials('kabag', 'kabag123')}
              >
                Kepala Bagian
              </button>
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => fillCredentials('protokol1', 'proto123')}
              >
                Staf Protokol
              </button>
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => fillCredentials('persidangan1', 'sidang123')}
              >
                Persidangan
              </button>
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => fillCredentials('humas1', 'humas123')}
              >
                Humas
              </button>
            </div>
          </div>
        </section>

        {/* Official Footer */}
        <footer className="login-footer">
          <p>© {new Date().getFullYear()} Dewan Ekonomi Nasional Republik Indonesia</p>
          <p className="login-security-tag">Akses Khusus Aparatur dan Petugas Berwenang</p>
        </footer>
      </main>

      <style>{loginStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles (Zero glow, solid surfaces, crisp hairlines)
// ------------------------------------------------------------------
const loginStyles = `
  .login-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1rem;
    background: var(--surface-canvas);
  }

  .login-container {
    width: 100%;
    max-width: 410px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  /* Header */
  .login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.85rem;
  }

  .login-logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .login-logo-img {
    height: 52px;
    width: auto;
    max-width: 240px;
    object-fit: contain;
  }

  .login-title-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .login-app-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }
  .login-app-desc {
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .login-agency {
    font-size: 0.725rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  /* Card */
  .login-card {
    width: 100%;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }

  .login-card-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 0.85rem;
  }
  .login-card-title {
    font-size: 0.975rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .login-card-desc {
    font-size: 0.775rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Form */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-icon {
    position: absolute;
    left: 0.875rem;
    color: var(--text-muted);
    pointer-events: none;
  }
  .input-with-icon {
    padding-left: 2.35rem;
  }
  .input-with-icon-right {
    padding-right: 2.35rem;
  }

  .input-eye-toggle {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
  }
  .input-eye-toggle:hover {
    color: var(--text-primary);
  }

  .login-submit {
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875rem;
  }

  /* Error Alert */
  .login-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    background: var(--status-red-bg);
    border: 1px solid var(--status-red-border);
    border-radius: var(--radius-md);
    color: #f87171;
    font-size: 0.8rem;
  }
  .login-error span { flex: 1; }
  .login-error-close {
    background: none;
    border: none;
    color: #f87171;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0 0.25rem;
  }

  /* Quick Demo Access Bar */
  .login-quick-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-subtle);
  }
  .login-quick-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .login-quick-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }
  .login-quick-btn {
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
  }
  .login-quick-btn:hover {
    background: var(--surface-hover);
    color: var(--gold-500);
    border-color: var(--gold-500);
  }

  /* Footer */
  .login-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    text-align: center;
    font-size: 0.725rem;
    color: var(--text-muted);
  }
  .login-security-tag {
    font-size: 0.675rem;
    color: #475569;
  }
`
