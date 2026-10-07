'use client'

// ============================================================
// SIAP-Pro: Manajemen Pengguna
// Dewan Ekonomi Nasional Republik Indonesia
// Pengelolaan Hak Akses dan Akun Kedinasan Protokol
// ============================================================

import { useState } from 'react'
import {
  UserPlus, Pencil, X, Check, Loader2, AlertCircle,
  ShieldCheck, Eye, EyeOff, Search, ChevronDown,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useUserRole } from '@/store/auth-store'
import { UserRole, User } from '@/types'
import { MOCK_USERS } from '@/lib/mock-data'
import { getRoleLabel, initials, cn } from '@/lib/utils'

// ------------------------------------------------------------------
interface UserForm {
  nama: string
  username: string
  password: string
  role: UserRole | ''
}
const EMPTY_FORM: UserForm = { nama: '', username: '', password: '', role: '' }

// ------------------------------------------------------------------
export default function UsersPage() {
  const role = useUserRole()
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserForm, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="users-unauth card">
        <ShieldCheck size={36} style={{ color: 'var(--status-red)' }} aria-hidden="true" />
        <p className="unauth-title">Akses Khusus Terbatas</p>
        <p className="unauth-desc">Halaman manajemen pengguna ini memerlukan otorisasi tingkat Administrator Sistem.</p>
      </div>
    )
  }

  const filtered = users.filter(u => {
    const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'ALL' || u.role === filterRole
    return matchSearch && matchRole
  })

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setEditingUser(null)
    setShowPassword(false)
    setShowForm(true)
  }

  const openEdit = (u: User) => {
    setForm({ nama: u.nama, username: u.username, password: '', role: u.role })
    setFormErrors({})
    setEditingUser(u)
    setShowPassword(false)
    setShowForm(true)
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof UserForm, string>> = {}
    if (!form.nama.trim()) errs.nama = 'Nama lengkap dinas wajib diisi.'
    if (!form.username.trim()) errs.username = 'Nama pengguna wajib diisi.'
    if (!editingUser && !form.password) errs.password = 'Kata sandi wajib diisi untuk akun baru.'
    if (!form.role) errs.role = 'Peran jabatan wajib ditentukan.'
    const duplicate = users.find(u => u.username === form.username.trim() && u.id !== editingUser?.id)
    if (duplicate) errs.username = 'Nama pengguna ini sudah digunakan akun lain.'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 600))

    if (editingUser) {
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, nama: form.nama, username: form.username, role: form.role as UserRole, updatedAt: new Date().toISOString() }
          : u
      ))
      setToast(`Data pengguna ${form.nama} berhasil diperbarui.`)
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        nama: form.nama,
        username: form.username,
        role: form.role as UserRole,
        aktif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setUsers(prev => [newUser, ...prev])
      setToast(`Akun kedinasan baru untuk ${form.nama} berhasil dibuat.`)
    }

    setIsSaving(false)
    setShowForm(false)
    setTimeout(() => setToast(null), 3000)
  }

  const toggleAktif = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const newAktif = !u.aktif
      setToast(`Status akun ${u.nama} diubah menjadi ${newAktif ? 'Aktif' : 'Nonaktif'}.`)
      setTimeout(() => setToast(null), 3000)
      return { ...u, aktif: newAktif }
    }))
  }

  const activeCount = users.filter(u => u.aktif).length

  return (
    <div className="users-page">
      {/* Toast Notification */}
      {toast && (
        <div className="users-toast" role="status">
          <Check size={15} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Kelola Pengguna Sistem</h1>
          <p className="page-desc">Pengaturan akun kedinasan dan hak otorisasi aparatur protokol DEN RI</p>
        </div>
        <button
          id="btn-tambah-user"
          className="btn btn-primary"
          onClick={openAdd}
        >
          <UserPlus size={16} />
          <span>Tambah Pengguna</span>
        </button>
      </header>

      {/* Stats Summary */}
      <section className="users-stats card" aria-label="Statistik Pengguna">
        <div className="users-stat">
          <span className="users-stat-num num-tabular">{users.length}</span>
          <span className="users-stat-label">Total Akun Terdaftar</span>
        </div>
        <div className="users-stat-sep" aria-hidden="true">|</div>
        <div className="users-stat">
          <span className="users-stat-num text-green num-tabular">{activeCount}</span>
          <span className="users-stat-label">Akun Aktif</span>
        </div>
        <div className="users-stat-sep" aria-hidden="true">|</div>
        <div className="users-stat">
          <span className="users-stat-num text-red num-tabular">{users.length - activeCount}</span>
          <span className="users-stat-label">Akun Dinonaktifkan</span>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="users-filters">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="form-input search-input"
            placeholder="Cari berdasarkan nama atau username dinas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrapper role-filter">
          <select
            className="form-select"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as UserRole | 'ALL')}
            aria-label="Filter berdasarkan jabatan"
          >
            <option value="ALL">Semua Jabatan</option>
            {Object.values(UserRole).map(r => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" aria-hidden="true" />
        </div>
      </div>

      {/* User Table / List */}
      <section className="users-list" aria-label="Daftar Pengguna Kedinasan">
        {filtered.map(u => (
          <article
            key={u.id}
            className={cn('user-card card', !u.aktif && 'user-card-inactive')}
          >
            <div className="user-avatar" aria-hidden="true">
              {initials(u.nama)}
            </div>

            <div className="user-info">
              <div className="user-name-row">
                <span className="user-name">{u.nama}</span>
                <span className="user-role-badge">
                  {getRoleLabel(u.role)}
                </span>
                {!u.aktif && (
                  <span className="badge badge-red">Nonaktif</span>
                )}
              </div>
              <span className="user-username num-tabular">@{u.username}</span>
            </div>

            <div className="user-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => openEdit(u)}
                aria-label={`Sunting akun ${u.nama}`}
                title="Sunting data pengguna"
              >
                <Pencil size={13} />
                <span>Sunting</span>
              </button>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => toggleAktif(u.id)}
                title={u.aktif ? 'Nonaktifkan akun ini' : 'Aktifkan kembali akun ini'}
                aria-label={u.aktif ? `Nonaktifkan ${u.nama}` : `Aktifkan ${u.nama}`}
              >
                {u.aktif ? (
                  <ToggleRight size={20} style={{ color: 'var(--status-green)' }} />
                ) : (
                  <ToggleLeft size={20} style={{ color: '#f87171' }} />
                )}
              </button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="users-empty card">
            <p>Tidak ditemukan data pengguna yang cocok dengan kriteria pencarian.</p>
          </div>
        )}
      </section>

      {/* Modal Drawer: Tambah / Edit Pengguna */}
      {showForm && (
        <div className="drawer-overlay" onClick={() => setShowForm(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-user-title">
            <div className="drawer-header">
              <h2 id="modal-user-title" className="drawer-title">
                {editingUser ? 'Sunting Data Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowForm(false)}
                aria-label="Tutup form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="drawer-form" noValidate>
              <div className="form-group">
                <label htmlFor="uf-nama" className="form-label">Nama Lengkap & Gelar</label>
                <input
                  id="uf-nama"
                  type="text"
                  className={cn('form-input', formErrors.nama && 'error')}
                  placeholder="Contoh: Budi Santoso, S.STP"
                  value={form.nama}
                  onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                />
                {formErrors.nama && <span className="form-error"><AlertCircle size={12}/>{formErrors.nama}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="uf-username" className="form-label">Nama Pengguna (Username Login)</label>
                <input
                  id="uf-username"
                  type="text"
                  className={cn('form-input', formErrors.username && 'error')}
                  placeholder="Contoh: budi.protokol"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  autoCapitalize="none"
                />
                {formErrors.username && <span className="form-error"><AlertCircle size={12}/>{formErrors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="uf-password" className="form-label">
                  Kata Sandi Akses {editingUser && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(kosongkan bila tidak diubah)</span>}
                </label>
                <div className="input-wrapper">
                  <input
                    id="uf-password"
                    type={showPassword ? 'text' : 'password'}
                    className={cn('form-input input-with-icon-right', formErrors.password && 'error')}
                    placeholder={editingUser ? 'Masukkan kata sandi baru untuk mereset' : 'Tentukan kata sandi awal'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="input-eye-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Tampilkan / sembunyikan kata sandi"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {formErrors.password && <span className="form-error"><AlertCircle size={12}/>{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="uf-role" className="form-label">Peran Kedinasan</label>
                <div className="select-wrapper">
                  <select
                    id="uf-role"
                    className={cn('form-select', formErrors.role && 'error')}
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  >
                    <option value="">Pilih Jabatan Kedinasan</option>
                    {Object.values(UserRole).map(r => (
                      <option key={r} value={r}>{getRoleLabel(r)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-icon" aria-hidden="true" />
                </div>
                {formErrors.role && <span className="form-error"><AlertCircle size={12}/>{formErrors.role}</span>}
              </div>

              <div className="drawer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Batalkan
                </button>
                <button
                  id="btn-simpan-user"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan Pengguna...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>{editingUser ? 'Simpan Perubahan' : 'Terbitkan Akun'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{usersStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive State Protocol Standard
// ------------------------------------------------------------------
const usersStyles = `
  .users-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 1000px;
  }

  .users-unauth {
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    text-align: center;
  }
  .unauth-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .unauth-desc {
    font-size: 0.825rem;
    color: var(--text-muted);
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 1.15rem;
  }
  .page-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .page-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.2rem;
  }

  .users-toast {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    background: var(--status-green-bg);
    border: 1px solid var(--status-green-border);
    border-radius: var(--radius-md);
    color: var(--status-green);
    font-size: 0.825rem;
    font-weight: 600;
  }

  /* Stats */
  .users-stats {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 1.25rem;
    flex-wrap: wrap;
  }
  .users-stat {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }
  .users-stat-num {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .users-stat-label {
    font-size: 0.775rem;
    color: var(--text-muted);
  }
  .users-stat-sep {
    color: var(--border-distinct);
  }

  /* Filters */
  .users-filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .search-wrapper {
    flex: 1;
    min-width: 220px;
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 0.875rem;
    color: var(--text-muted);
    pointer-events: none;
  }
  .search-input {
    padding-left: 2.35rem !important;
  }
  .role-filter {
    min-width: 180px;
  }

  /* List */
  .users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .user-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 1.15rem;
  }
  .user-card-inactive {
    opacity: 0.6;
    background: var(--surface-muted);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--gold-500);
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .user-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .user-username {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .user-role-badge {
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-xs);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .users-empty {
    padding: 2.5rem 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  /* Drawer */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  @media (min-width: 768px) {
    .drawer-overlay {
      align-items: center;
    }
  }
  .drawer {
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    width: 100%;
    max-width: 580px;
    max-height: 90dvh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
  @media (min-width: 768px) {
    .drawer {
      border-radius: var(--radius-lg);
      max-height: 85dvh;
    }
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.5rem;
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    background: var(--surface-card);
    z-index: 1;
  }
  .drawer-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .drawer-form {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .drawer-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }
`
