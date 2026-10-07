'use client'

// ============================================================
// SIAP-Pro: Audit Log Page
// Dewan Ekonomi Nasional Republik Indonesia
// Rekam Jejak Aktivitas Operasional dan Keamanan Sistem
// ============================================================

import { useState } from 'react'
import { Search, ScrollText, ChevronDown, Clock, User2 } from 'lucide-react'
import { useUserRole } from '@/store/auth-store'
import { UserRole, AuditAksi } from '@/types'
import { MOCK_AUDIT_LOG, MOCK_USERS } from '@/lib/mock-data'
import { formatDatetime, relativeTime, cn } from '@/lib/utils'

// ------------------------------------------------------------------
const ACTION_LABELS: Record<AuditAksi, string> = {
  LOGIN: 'Autentikasi Masuk',
  LOGOUT: 'Autentikasi Keluar',
  CREATE_KEGIATAN: 'Jadwalkan Agenda',
  UPDATE_KEGIATAN: 'Perbarui Agenda',
  DELETE_KEGIATAN: 'Batalkan Agenda',
  UPDATE_PENUGASAN: 'Disposisi Personel',
  SIMPAN_LAPORAN: 'Finalisasi Checklist',
  SIMPAN_DRAF: 'Simpan Draf Laporan',
  UPLOAD_FOTO: 'Unggah Foto Bukti',
  HAPUS_FOTO: 'Hapus Foto Bukti',
  SIMPAN_SIDANG: 'Simpan Dokumen Sidang',
  SIMPAN_DOKUMENTASI: 'Arsipkan Media',
  CREATE_USER: 'Terbitkan Akun',
  UPDATE_USER: 'Perbarui Akun',
  RESET_PASSWORD: 'Reset Kata Sandi',
  UPDATE_TEMPLATE: 'Perbarui Template',
}

// ------------------------------------------------------------------
export default function AuditLogPage() {
  const role = useUserRole()
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<AuditAksi | 'ALL'>('ALL')

  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="audit-unauth card">
        <ScrollText size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} aria-hidden="true" />
        <p className="audit-unauth-title">Akses Khusus Terbatas</p>
        <p className="audit-unauth-desc">Log audit sistem hanya dapat diakses oleh Administrator Sistem.</p>
      </div>
    )
  }

  const logs = MOCK_AUDIT_LOG
    .filter(l => {
      const user = MOCK_USERS.find(u => u.id === l.userId)
      const matchSearch = !search || user?.nama.toLowerCase().includes(search.toLowerCase()) ||
        ACTION_LABELS[l.aksi]?.toLowerCase().includes(search.toLowerCase())
      const matchAction = filterAction === 'ALL' || l.aksi === filterAction
      return matchSearch && matchAction
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="audit-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Log Audit Sistem</h1>
          <p className="page-desc">Rekam jejak komprehensif seluruh aktivitas kedinasan aparatur protokol DEN RI</p>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="audit-filters">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <Search size={14} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="form-input search-input"
            placeholder="Cari aparatur, jenis aksi, atau detail kegiatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrapper" style={{ minWidth: 200 }}>
          <select
            className="form-select"
            value={filterAction}
            onChange={e => setFilterAction(e.target.value as AuditAksi | 'ALL')}
            aria-label="Filter berdasarkan jenis aksi"
          >
            <option value="ALL">Semua Jenis Aksi</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" aria-hidden="true" />
        </div>
      </div>

      {/* Count Indicator */}
      <div className="audit-meta-row">
        <span className="audit-count num-tabular">{logs.length} entri riwayat tercatat</span>
      </div>

      {/* Timeline */}
      <section className="audit-timeline" aria-label="Garis Waktu Audit">
        {logs.map(log => {
          const user = MOCK_USERS.find(u => u.id === log.userId)

          return (
            <article key={log.id} className="audit-entry">
              {/* Hairline timeline track */}
              <div className="audit-line" aria-hidden="true" />

              {/* Status node */}
              <div className="audit-dot" aria-hidden="true" />

              {/* Log Card */}
              <div className="audit-content card">
                <div className="audit-content-header">
                  <span className="audit-action-badge">
                    {ACTION_LABELS[log.aksi] ?? log.aksi}
                  </span>
                  <div className="audit-time num-tabular">
                    <Clock size={11} aria-hidden="true" />
                    <span title={formatDatetime(log.createdAt)}>
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="audit-user">
                  <User2 size={13} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  <span className="audit-user-name">{user?.nama ?? log.userId}</span>
                  <span className="audit-user-role">({user?.role ?? '-'})</span>
                </div>

                {Object.keys(log.detail).length > 0 && (
                  <div className="audit-detail">
                    {Object.entries(log.detail).map(([k, v]) => (
                      <span key={k} className="audit-detail-item">
                        <span className="audit-detail-key">{k}:</span>{' '}
                        <span className="audit-detail-val">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}

        {logs.length === 0 && (
          <div className="audit-empty card">
            <p>Tidak ditemukan rekaman log yang cocok dengan kriteria filter.</p>
          </div>
        )}
      </section>

      <style>{auditStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive State Protocol Standard
// ------------------------------------------------------------------
const auditStyles = `
  .audit-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 900px;
  }

  .audit-unauth {
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    text-align: center;
  }
  .audit-unauth-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .audit-unauth-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .page-header {
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

  .audit-filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
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

  .audit-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .audit-count {
    font-size: 0.775rem;
    color: var(--text-muted);
  }

  /* Timeline */
  .audit-timeline {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-left: 1.5rem;
  }

  .audit-entry {
    position: relative;
    padding: 0 0 1rem 1rem;
  }
  .audit-entry:last-child {
    padding-bottom: 0;
  }

  .audit-line {
    position: absolute;
    left: 4px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border-subtle);
  }
  .audit-entry:last-child .audit-line {
    display: none;
  }

  .audit-dot {
    position: absolute;
    left: 0;
    top: 1rem;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--surface-card);
    border: 2px solid var(--gold-500);
    transform: translateX(-50%);
    flex-shrink: 0;
  }

  .audit-content {
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .audit-content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .audit-action-badge {
    display: inline-flex;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-xs);
    background: #fef3c7;
    border: 1px solid #fde68a;
    font-size: 0.725rem;
    font-weight: 600;
    color: var(--gold-500);
  }
  .audit-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.725rem;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .audit-user {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--text-primary);
  }
  .audit-user-name {
    font-weight: 600;
  }
  .audit-user-role {
    font-size: 0.725rem;
    color: var(--text-muted);
  }

  .audit-detail {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.45rem 0.65rem;
    background: var(--surface-canvas);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
    margin-top: 0.25rem;
  }
  .audit-detail-item {
    font-size: 0.725rem;
    color: var(--text-secondary);
  }
  .audit-detail-key {
    color: var(--text-muted);
  }
  .audit-detail-val {
    color: var(--text-primary);
  }

  .audit-empty {
    padding: 2.5rem 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
`
