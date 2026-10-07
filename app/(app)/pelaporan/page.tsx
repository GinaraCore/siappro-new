'use client'

// ============================================================
// SIAP-Pro: Pelaporan Kegiatan
// Dewan Ekonomi Nasional Republik Indonesia
// Checklist Keprotokolan Lapangan & Verifikasi Berita Acara
// ============================================================

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Clock, MapPin, ClipboardCheck,
  ClipboardX, FileWarning, ChevronRight as ChevronR, Download, Loader2,
} from 'lucide-react'
import { useUser, useUserRole } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { StatusLaporan, Kegiatan } from '@/types'
import {
  MOCK_JENIS_ACARA,
  MOCK_USERS,
  getTemplate,
} from '@/lib/mock-data'
import { formatTanggalLong, getStatusLaporanLabel, getStatusLaporanBadge, cn } from '@/lib/utils'
import { downloadLaporanPdfDirectly } from '@/lib/pdf-generator'

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

// ------------------------------------------------------------------
// Main Pelaporan Page Component
// ------------------------------------------------------------------
export default function PelaporanPage() {
  const user = useUser()
  const role = useUserRole()
  const now = new Date()

  const { getKegiatanForUser: getKegStore } = useDataStore()
  const storeLaporan = useDataStore(s => s.laporan)

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const myKegiatan = useMemo(
    () => (user && role ? getKegStore(user.id, role).filter(k => !k.softDeleted) : []),
    [user, role, getKegStore],
  )

  const kegiatanByDate = useMemo(() => {
    const map: Record<string, Kegiatan[]> = {}
    myKegiatan.forEach(k => {
      if (!map[k.tanggal]) map[k.tanggal] = []
      map[k.tanggal].push(k)
    })
    return map
  }, [myKegiatan])

  if (!user || !role) return null

  const selectedKegiatan = kegiatanByDate[selectedDate] ?? []

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDay(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="pelaporan-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pelaporan Kegiatan Protokol</h1>

        </div>
      </div>

      <div className="pelaporan-layout">
        {/* Date Selector Mini Calendar */}
        <section className="mini-cal card" aria-label="Pemilih Tanggal Pelaporan">
          <div className="mini-cal-nav">
            <button className="btn btn-ghost btn-icon" onClick={prevMonth} aria-label="Bulan sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <span className="mini-cal-title">
              {MONTH_NAMES_FULL[viewMonth]} {viewYear}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth} aria-label="Bulan berikutnya">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mini-cal-grid-header">
            {DAY_SHORT.map(d => <span key={d} className="mini-cal-day-name">{d}</span>)}
          </div>

          <div className="mini-cal-grid">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="mini-cal-cell mini-cal-empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toISODate(viewYear, viewMonth, day)
              const hasEvents = !!kegiatanByDate[dateStr]?.length
              const isToday = dateStr === now.toISOString().split('T')[0]
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={day}
                  className={cn(
                    'mini-cal-cell',
                    isToday && 'mini-today',
                    isSelected && 'mini-selected',
                    hasEvents && 'mini-has-events',
                  )}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-label={`${day} ${MONTH_NAMES_FULL[viewMonth]}`}
                  aria-pressed={isSelected}
                >
                  <span className="num-tabular">{day}</span>
                  {hasEvents && <span className="mini-dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {/* Operational Legend */}
          <div className="mini-cal-legend">
            <div className="legend-item">
              <span className="legend-dot dot-red" aria-hidden="true" />
              <span>Belum Lapor</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-yellow" aria-hidden="true" />
              <span>Draf</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-green" aria-hidden="true" />
              <span>Selesai</span>
            </div>
          </div>
        </section>

        {/* Selected Date Activity List */}
        <section className="pelaporan-right" aria-labelledby="pelaporan-date-title">
          <div className="pelaporan-list-head">
            <h2 id="pelaporan-date-title" className="pelaporan-date-title">
              {formatTanggalLong(selectedDate)}
            </h2>
            <span className="pelaporan-count-tag num-tabular">
              {selectedKegiatan.length} Agenda
            </span>
          </div>

          {selectedKegiatan.length === 0 ? (
            <div className="pelaporan-empty card">
              <ClipboardX size={38} className="empty-pelaporan-icon" aria-hidden="true" />
              <p className="empty-pelaporan-title">Tidak ada agenda tugas pada tanggal ini.</p>
              <p className="empty-pelaporan-desc">Pilih tanggal bertanda titik emas pada kalender untuk memeriksa checklist acara lain.</p>
            </div>
          ) : (
            <div className="pelaporan-list">
              {selectedKegiatan.map(keg => (
                <PelaporanCard
                  key={keg.id}
                  kegiatan={keg}
                  onDownloadPdf={async (k) => {
                    setDownloadingId(k.id)
                    try {
                      const tpl = getTemplate(k.jenisAcaraId)
                      const lap = storeLaporan.find(l => l.kegiatanId === k.id)
                      const jwbMap: Record<string, { dicentang: boolean; keterangan: string; fotoUrls: string[] }> = {}
                      lap?.jawaban?.forEach(j => {
                        jwbMap[j.itemChecklistId] = {
                          dicentang: j.dicentang,
                          keterangan: j.keterangan,
                          fotoUrls: (j.fotoUrls && j.fotoUrls.length > 0)
                            ? j.fotoUrls
                            : (j.mediaIds && j.mediaIds.length > 0 && k.id === 'keg-005')
                              ? [`/mock/${j.itemChecklistId}.jpg`]
                              : [],
                        }
                      })
                      await downloadLaporanPdfDirectly({
                        kegiatan: k,
                        items: tpl?.items || [],
                        jawabanMap: jwbMap,
                        catatanPenutup: lap?.catatanPenutup || '',
                        pembuatNama: lap?.pembuat?.nama || (lap?.pembuatId ? MOCK_USERS.find(u => u.id === lap.pembuatId)?.nama : null) || user?.nama || 'Petugas Protokol DEN',
                        disetujuiNama: lap?.disetujuiOleh?.nama || (lap?.disetujuiOlehId ? MOCK_USERS.find(u => u.id === lap.disetujuiOlehId)?.nama : null) || 'Super Admin Protokol',
                        waktuPersetujuan: lap?.waktuPersetujuan ?? null,
                      })
                    } finally {
                      setDownloadingId(null)
                    }
                  }}
                  isDownloading={downloadingId === keg.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{pelaporanStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Pelaporan Card: Single Status Indicator
// ------------------------------------------------------------------
function PelaporanCard({
  kegiatan,
  onDownloadPdf,
  isDownloading = false,
}: {
  kegiatan: Kegiatan
  onDownloadPdf: (kegiatan: Kegiatan) => void
  isDownloading?: boolean
}) {
  const storeLaporan = useDataStore(s => s.laporan)
  const laporan = storeLaporan.find(l => l.kegiatanId === kegiatan.id)
  const jenis = MOCK_JENIS_ACARA.find(j => j.id === kegiatan.jenisAcaraId)

  const status = laporan?.status ?? StatusLaporan.BELUM_DILAPORKAN
  const isApproved = status === StatusLaporan.DISETUJUI
  const isPending = status === StatusLaporan.MENUNGGU_PERSETUJUAN

  const badgeClass = getStatusLaporanBadge(status)
  const Icon = isApproved
    ? ClipboardCheck
    : isPending
      ? Clock
      : status === StatusLaporan.DRAF || status === StatusLaporan.PERLU_REVISI
        ? FileWarning
        : ClipboardX

  return (
    <article className="pelaporan-card card">
      {/* Header */}
      <div className="pcard-header">
        <div className="pcard-time-badge num-tabular">
          <Clock size={12} aria-hidden="true" />
          <span>{kegiatan.jamMulai} WIB</span>
        </div>
        {jenis && <span className="pcard-jenis">{jenis.nama}</span>}
      </div>

      <h3 className="pcard-nama">{kegiatan.nama}</h3>

      <div className="pcard-loc">
        <MapPin size={13} aria-hidden="true" />
        <span>{kegiatan.lokasi}</span>
      </div>

      {/* Single Laporan Button */}
      <div className="pcard-fases">
        <Link
          href={`/pelaporan/${kegiatan.id}`}
          className={cn('fase-btn', `fase-btn-${badgeClass}`)}
        >
          <Icon size={16} className="fase-btn-icon" aria-hidden="true" />
          <div className="fase-btn-info">
            <span className="fase-btn-label">Laporan Kegiatan</span>
            <span className="fase-btn-status">{getStatusLaporanLabel(status)}</span>
          </div>
          <ChevronR size={14} className="fase-btn-arrow" aria-hidden="true" />
        </Link>
      </div>

      {/* PDF Direct Download (Only when Approved / Terlaksana) */}
      {isApproved && (
        <div className="pcard-pdf-row">
          <button
            type="button"
            className="pcard-pdf-btn"
            onClick={() => onDownloadPdf(kegiatan)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Download size={12} />
                <span>Download PDF Resmi</span>
              </>
            )}
          </button>
        </div>
      )}
    </article>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive State Protocol Standard
// ------------------------------------------------------------------
const pelaporanStyles = `
  .pelaporan-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1100px;
  }

  .page-header {
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 1.25rem;
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

  .pelaporan-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    align-items: start;
  }
  @media (min-width: 880px) {
    .pelaporan-layout {
      grid-template-columns: 290px 1fr;
    }
  }

  /* Mini Calendar */
  .mini-cal {
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .mini-cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .mini-cal-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .mini-cal-grid-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  .mini-cal-day-name {
    text-align: center;
    font-size: 0.65rem;
    color: var(--text-muted);
    font-weight: 600;
    padding: 0.2rem 0;
  }

  .mini-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .mini-cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: none;
    font-size: 0.775rem;
    color: var(--text-secondary);
    cursor: pointer;
    position: relative;
    gap: 2px;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
  }
  .mini-cal-cell:not(.mini-cal-empty):hover {
    background: var(--surface-muted);
    border-color: var(--border-distinct);
  }
  .mini-cal-empty { cursor: default; }

  .mini-today {
    color: var(--gold-400);
    font-weight: 700;
  }
  .mini-selected {
    background: var(--gold-subtle) !important;
    border-color: var(--gold-500) !important;
    color: var(--gold-400);
    font-weight: 700;
  }
  .mini-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--gold-500);
    position: absolute;
    bottom: 3px;
  }

  .mini-cal-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    border-top: 1px solid var(--border-subtle);
    padding-top: 0.75rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-red { background: var(--status-red); }
  .dot-yellow { background: var(--status-yellow); }
  .dot-green { background: var(--status-green); }

  /* Right Side */
  .pelaporan-right {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .pelaporan-list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .pelaporan-date-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .pelaporan-count-tag {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .pelaporan-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 3.5rem 1.5rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    text-align: center;
  }
  .empty-pelaporan-icon {
    opacity: 0.4;
    color: var(--text-muted);
  }
  .empty-pelaporan-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .empty-pelaporan-desc {
    font-size: 0.775rem;
    max-width: 380px;
    line-height: 1.4;
  }

  .pelaporan-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  /* Card */
  .pelaporan-card {
    padding: 1.15rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .pcard-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .pcard-time-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--gold-500);
    font-weight: 600;
  }
  .pcard-jenis {
    font-size: 0.675rem;
    color: var(--text-secondary);
    padding: 0.15rem 0.45rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }
  .pcard-nama {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .pcard-loc {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.775rem;
    color: var(--text-muted);
  }

  /* Fase Buttons */
  .pcard-fases {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }
  .fase-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
    text-decoration: none;
    transition: border-color var(--transition-fast), background-color var(--transition-fast);
    min-width: 220px;
    min-height: 48px; /* touch target compliance */
  }
  .fase-btn-green {
    background: var(--status-green-bg);
    border-color: var(--status-green-border);
    color: #34d399;
  }
  .fase-btn-yellow {
    background: var(--status-yellow-bg);
    border-color: var(--status-yellow-border);
    color: #fbbf24;
  }
  .fase-btn-red {
    background: var(--status-red-bg);
    border-color: var(--status-red-border);
    color: #f87171;
  }
  .fase-btn:hover {
    border-color: var(--border-strong);
  }

  .fase-btn-icon { flex-shrink: 0; }
  .fase-btn-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .fase-btn-label {
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.25;
  }
  .fase-btn-status {
    font-size: 0.7rem;
    opacity: 0.85;
    margin-top: 0.15rem;
  }
  .fase-btn-arrow {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .pcard-pdf-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border-subtle);
  }
  .pcard-pdf-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: var(--radius-xs);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    font-size: 0.725rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .pcard-pdf-btn:hover {
    background: #fef3c7;
    border-color: #fde68a;
    color: var(--gold-500);
  }

  @media (max-width: 640px) {
    .pelaporan-page {
      padding-bottom: 5.5rem;
    }
    .fase-btn {
      min-width: 100%;
    }
    .pcard-header {
      flex-wrap: wrap;
    }
  }
`
