'use client'

// ============================================================
// SIAP-Pro: Dashboard Page
// Dewan Ekonomi Nasional Republik Indonesia
// Pusat Komando Protokoler & Ringkasan Operasional
// ============================================================

import { useMemo } from 'react'
import {
  CalendarDays,
  ClipboardList,
  Camera,
  FileText,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { useUser, useUserRole } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { UserRole, StatusLaporan } from '@/types'
import { formatTanggalLong, cn, getRoleLabel } from '@/lib/utils'

// ------------------------------------------------------------------
// High-Density Metric Card Component
// ------------------------------------------------------------------
interface MetricCardProps {
  label: string
  numerator: number
  denominator: number
  percentage: number
  isBottleneck?: boolean
  description: string
}

function MetricCard({
  label,
  numerator,
  denominator,
  percentage,
  isBottleneck,
  description,
}: MetricCardProps) {
  return (
    <div className={cn('metric-card', isBottleneck && 'metric-card-alert')}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
      </div>

      <div className="metric-values">
        <div className="metric-number-group">
          <span className="metric-current num-tabular">{numerator}</span>
          <span className="metric-total num-tabular">/ {denominator}</span>
        </div>
        <span className="metric-percentage num-tabular">{percentage}%</span>
      </div>

      {/* High-contrast linear bar */}
      <div className="metric-progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn('metric-progress-fill', isBottleneck ? 'fill-alert' : 'fill-primary')}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <span className="metric-caption">{description}</span>
    </div>
  )
}

// ------------------------------------------------------------------
// Quick Access Module Item Configuration
// ------------------------------------------------------------------
interface QuickModuleItem {
  href: string
  code: string
  label: string
  icon: React.ElementType
  description: string
  roles: UserRole[]
}

const QUICK_MODULES: QuickModuleItem[] = [
  {
    href: '/penugasan',
    code: 'MODUL 01',
    label: 'Penugasan Acara',
    icon: CalendarDays,
    description: 'Manajemen jadwal sidang, VVIP, dan disposisi tim lapangan',
    roles: [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/pelaporan',
    code: 'MODUL 02',
    label: 'Pelaporan Kegiatan',
    icon: ClipboardList,
    description: 'Checklist keprotokolan 3 fase dan verifikasi berita acara',
    roles: [UserRole.PROTOKOL, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/persidangan',
    code: 'MODUL 03',
    label: 'Persidangan',
    icon: FileText,
    description: 'Repositori notulensi, draf kebijakan, dan risalah rapat DEN',
    roles: [UserRole.PERSIDANGAN, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/dokumentasi',
    code: 'MODUL 04',
    label: 'Dokumentasi',
    icon: Camera,
    description: 'Arsip media, foto resmi kenegaraan, dan materi siaran pers',
    roles: [UserRole.HUMAS, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/admin/users',
    code: 'MODUL 05',
    label: 'Kelola Pengguna',
    icon: Users,
    description: 'Pengaturan akun dinas dan hak akses aparatur protokol',
    roles: [UserRole.SUPER_ADMIN],
  },
]

// ------------------------------------------------------------------
// Dashboard Page Component
// ------------------------------------------------------------------
export default function DashboardPage() {
  const user = useUser()
  const role = useUserRole()

  const today = new Date().toISOString().split('T')[0]
  const formattedToday = formatTanggalLong(today)

  const storeKegiatan = useDataStore(s => s.kegiatan)
  const storeLaporan = useDataStore(s => s.laporan)
  const storeDokumentasi = useDataStore(s => s.dokumentasi)
  const storeSidang = useDataStore(s => s.sidang)

  const activeKegiatan = storeKegiatan.filter(k => !k.softDeleted)
  const totalKegiatan = activeKegiatan.length

  // Terlaksana HANYA jika laporan telah disetujui (ACC / DISETUJUI) oleh Super Admin
  const terlaksanaCount = activeKegiatan.filter(k =>
    storeLaporan.some(l => l.kegiatanId === k.id && l.status === StatusLaporan.DISETUJUI)
  ).length

  const terEvaluasiCount = activeKegiatan.filter(k => {
    const lap = storeLaporan.find(l => l.kegiatanId === k.id)
    return lap && lap.status === StatusLaporan.DISETUJUI && lap.catatanPenutup.trim().length > 0
  }).length

  const terDokumentasiCount = activeKegiatan.filter(k =>
    storeDokumentasi.some(d => d.kegiatanId === k.id && d.status === 'SUDAH_DIDOKUMENTASI')
  ).length

  const terNotulensiCount = activeKegiatan.filter(k =>
    storeSidang.some(s => s.kegiatanId === k.id && s.status === 'SELESAI_DI_SIDANG')
  ).length

  const pctTerlaksana = totalKegiatan > 0 ? Math.round((terlaksanaCount / totalKegiatan) * 100) : 0
  const pctTerEvaluasi = terlaksanaCount > 0 ? Math.round((terEvaluasiCount / terlaksanaCount) * 100) : 0
  const pctTerDokumentasi = terlaksanaCount > 0 ? Math.round((terDokumentasiCount / terlaksanaCount) * 100) : 0
  const pctTerNotulensi = terlaksanaCount > 0 ? Math.round((terNotulensiCount / terlaksanaCount) * 100) : 0

  const stats = {
    totalKegiatan,
    terlaksana: terlaksanaCount,
    terEvaluasi: terEvaluasiCount,
    terDokumentasi: terDokumentasiCount,
    terNotulensi: terNotulensiCount,
    pctTerlaksana,
    pctTerEvaluasi,
    pctTerDokumentasi,
    pctTerNotulensi,
  }

  const visibleModules = QUICK_MODULES.filter(m => role && m.roles.includes(role))

  if (!user || !role) return null

  return (
    <div className="dashboard-view">
      {/* Official Executive Header */}
      <header className="dashboard-head">
        <div className="dashboard-titles">
          <div className="dashboard-badge-row">

            <span className="dashboard-date-str num-tabular">{formattedToday}</span>
          </div>
          <h1 className="dashboard-main-title">
            Halo, {user.nama}
          </h1>

        </div>


      </header>

      {/* Operational Metrics (Admin & Executive View) */}




      {/* Modul Operasional Protokol */}
      <section className="dashboard-section" aria-labelledby="section-modules-title">
        <div className="section-head">
          <div>
            <h2 id="section-modules-title" className="section-title">Modul Operasional</h2>

          </div>
        </div>

        <div className="modules-grid">
          {visibleModules.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="module-card card">
                <div className="module-head">
                  <div className="module-icon-box" aria-hidden="true">
                    <Icon size={18} />
                  </div>
                  <span className="module-code num-tabular">{item.code}</span>
                </div>
                <div className="module-body">
                  <h3 className="module-name">{item.label}</h3>
                  <p className="module-desc">{item.description}</p>
                </div>
                <div className="module-foot">
                  <span>Buka Modul</span>
                  <ChevronRight size={13} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <style>{dashboardStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive State Protocol Standard
// ------------------------------------------------------------------
const dashboardStyles = `
  .dashboard-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 1100px;
  }

  /* Header */
  .dashboard-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 1.25rem;
  }
  .dashboard-titles {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .dashboard-badge-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .dashboard-date-str {
    font-size: 0.775rem;
    color: var(--text-muted);
  }
  .dashboard-main-title {
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 0.2rem;
  }
  .dashboard-role-tag {
    font-size: 0.825rem;
    color: var(--text-secondary);
  }
  .dashboard-role-tag strong {
    color: var(--gold-400);
    font-weight: 600;
  }

  .dashboard-today-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--gold-500);
  }
  .today-badge-dot {
    width: 7px;
    height: 7px;
    background: var(--gold-500);
    border-radius: 50%;
  }

  /* Section Common */
  .dashboard-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }
  .section-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .section-subtitle {
    font-size: 0.775rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }
  .section-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--gold-400);
  }
  .section-link:hover {
    color: var(--gold-300);
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .metric-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .metric-card-alert {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .metric-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .metric-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .metric-status-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-xs);
  }
  .tag-ok {
    background: var(--status-green-bg);
    color: var(--status-green);
    border: 1px solid var(--status-green-border);
  }
  .tag-alert {
    background: var(--status-red-bg);
    color: #f87171;
    border: 1px solid var(--status-red-border);
  }

  .metric-values {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .metric-number-group {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }
  .metric-current {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .metric-total {
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .metric-percentage {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--gold-400);
  }

  .metric-progress-track {
    width: 100%;
    height: 5px;
    background: var(--surface-muted);
    border-radius: 2px;
    overflow: hidden;
  }
  .metric-progress-fill {
    height: 100%;
    transition: width var(--transition-base);
  }
  .fill-primary {
    background: var(--gold-500);
  }
  .fill-alert {
    background: #ef4444;
  }

  .metric-caption {
    font-size: 0.725rem;
    color: var(--text-muted);
  }

  /* Agenda List */
  .agenda-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .agenda-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1rem 1.15rem;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }
  .agenda-time-column {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--gold-400);
    min-width: 105px;
  }
  .time-icon {
    color: var(--text-muted);
  }
  .agenda-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .agenda-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .agenda-name {
    font-size: 0.925rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .agenda-meta-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.775rem;
    color: var(--text-secondary);
    flex-wrap: wrap;
  }
  .agenda-meta-loc {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--text-muted);
  }
  .agenda-meta-vvip {
    color: var(--text-secondary);
  }
  .agenda-action-col {
    flex-shrink: 0;
  }

  .empty-agenda {
    padding: 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
  }
  .empty-agenda-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .empty-agenda-desc {
    font-size: 0.775rem;
    color: var(--text-muted);
  }

  /* Modules Grid */
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }
  .module-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-decoration: none;
    transition: border-color var(--transition-fast), background-color var(--transition-fast);
  }
  .module-card:hover {
    border-color: var(--border-distinct);
    background: var(--surface-elevated);
  }
  .module-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .module-icon-box {
    width: 32px;
    height: 32px;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold-500);
  }
  .module-code {
    font-size: 0.675rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .module-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }
  .module-name {
    font-size: 0.925rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .module-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
  .module-foot {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gold-400);
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }

  @media (max-width: 640px) {
    .agenda-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .agenda-action-col {
      width: 100%;
    }
    .agenda-action-col .btn {
      width: 100%;
    }
  }
`
