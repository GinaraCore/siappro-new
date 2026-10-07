'use client'

// ============================================================
// SIAP-Pro: Persidangan & Dokumen Risalah
// Dewan Ekonomi Nasional Republik Indonesia
// Navigasi Kalender Tanggal + Repositori Dokumen Persidangan
// ============================================================

import { useState, useMemo, useRef } from 'react'
import jsPDF from 'jspdf'
import {
  FileText, Upload, X, Check, Loader2, Link2,
  AlertCircle, Clock, MapPin, CheckCircle2,
  ChevronLeft, ChevronRight, FileCheck, ExternalLink,
  Copy, Download, Edit3, ShieldAlert, Sparkles, Plus,
} from 'lucide-react'
import { useUser, useUserRole } from '@/store/auth-store'
import { UserRole, StatusPersidangan, Kegiatan } from '@/types'
import { useDataStore } from '@/store/data-store'
import { MOCK_JENIS_ACARA } from '@/lib/mock-data'
import { formatTanggalLong, cn } from '@/lib/utils'

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

/** Unduh berkas PDF resmi persidangan DEN dengan data riil */
function downloadDokumenSidang(filename: string, docType: string, kegiatan: Kegiatan) {
  const pdf = new jsPDF()
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('DEWAN EKONOMI NASIONAL REPUBLIK INDONESIA', 105, 20, { align: 'center' })
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Bagian Keprotokolan dan Dukungan Persidangan', 105, 26, { align: 'center' })
  pdf.setLineWidth(0.5)
  pdf.line(20, 30, 190, 30)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text(docType.toUpperCase(), 105, 42, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Agenda       : ${kegiatan.nama}`, 20, 56)
  pdf.text(`Tanggal      : ${formatTanggalLong(kegiatan.tanggal)}`, 20, 64)
  pdf.text(`Waktu        : ${kegiatan.jamMulai} WIB`, 20, 72)
  pdf.text(`Lokasi       : ${kegiatan.lokasi}`, 20, 80)
  pdf.text(`Pimpinan     : ${kegiatan.penjabat}`, 20, 88)
  pdf.text(`Nama Berkas  : ${filename}`, 20, 96)
  pdf.text(`Status       : Dokumen Resmi Terverifikasi SIAP-Pro`, 20, 104)

  pdf.setDrawColor(4, 120, 87)
  pdf.roundedRect(20, 116, 170, 26, 3, 3)
  pdf.setTextColor(4, 120, 87)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DOKUMEN RESMI PERSIDANGAN DEWAN EKONOMI NASIONAL RI', 105, 128, { align: 'center' })
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Tervalidasi dalam sistem digital SIAP-Pro DEN pada ${new Date().toLocaleString('id-ID')}`, 105, 135, { align: 'center' })

  const cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  pdf.save(cleanName)
}

interface SidangEditForm {
  linkZoom: string
  linkRecorder: string
  daftarHadirFile: File | null
  notulenFile: File | null
  bahanSidangFile: File | null
}

// ------------------------------------------------------------------
// Main Persidangan Page
// ------------------------------------------------------------------
export default function PersidanganPage() {
  const user = useUser()
  const role = useUserRole()
  const now = new Date()

  const { upsertSidang, getKegiatanForUser: getKegStore } = useDataStore()
  const sidangStore = useDataStore(s => s.sidang)

  // Hak akses: Tim Persidangan & Super Admin dapat mengunggah / mengedit
  const isAuthorized = role === UserRole.PERSIDANGAN || role === UserRole.SUPER_ADMIN
  const isReadOnly = !isAuthorized

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0])

  // Modal kelola dokumen
  const [activeKegId, setActiveKegId] = useState<string | null>(null)
  const [form, setForm] = useState<SidangEditForm>({
    linkZoom: '', linkRecorder: '',
    daftarHadirFile: null, notulenFile: null, bahanSidangFile: null,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null)

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

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

  const openEditModal = (kegId: string) => {
    if (isReadOnly) return
    setActiveKegId(kegId)
    const existing = sidangStore.find(d => d.kegiatanId === kegId)
    setForm({
      linkZoom: existing?.linkZoom ?? '',
      linkRecorder: existing?.linkRecorder ?? '',
      daftarHadirFile: null,
      notulenFile: null,
      bahanSidangFile: null,
    })
    setFormErrors({})
  }

  const handleSaveModal = async () => {
    if (!activeKegId || isReadOnly) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))

    const existing = sidangStore.find(d => d.kegiatanId === activeKegId)
    const newDaftarHadir = form.daftarHadirFile?.name ?? existing?.daftarHadirNama ?? null
    const newNotulen = form.notulenFile?.name ?? existing?.notulenNama ?? null
    const newBahan = form.bahanSidangFile?.name ?? existing?.bahanSidangNama ?? null

    // Jika daftar hadir atau notulen sudah ada, anggap selesai di-sidang
    const hasCoreDocs = Boolean(newDaftarHadir || newNotulen)
    const newStatus = hasCoreDocs ? StatusPersidangan.SELESAI_DI_SIDANG : StatusPersidangan.BELUM_DI_SIDANG

    upsertSidang({
      kegiatanId: activeKegId,
      linkZoom: form.linkZoom.trim(),
      linkRecorder: form.linkRecorder.trim(),
      daftarHadirNama: newDaftarHadir,
      notulenNama: newNotulen,
      bahanSidangNama: newBahan,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })

    setActiveKegId(null)
    setIsSaving(false)
    triggerToast('Dokumen persidangan resmi berhasil disimpan.')
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    triggerToast(`${label} disalin ke clipboard!`, 'info')
  }

  const activeKegiatanObj = myKegiatan.find(k => k.id === activeKegId)

  return (
    <div className="persidangan-page">
      {/* Toast Notification */}
      {toast && (
        <div className={cn('psd-toast', `toast-${toast.type}`)} role="status">
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'info' && <Sparkles size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Persidangan & Dokumen Risalah</h1>

        </div>
      </div>

      {/* Grid Layout 2 Kolom (Kalender di Kiri, Dokumen di Kanan) */}
      <div className="persidangan-layout">
        {/* Kolom Kiri: Mini Kalender */}
        <section className="mini-cal card" aria-label="Pemilih Tanggal Persidangan">
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
              const eventsOnDate = kegiatanByDate[dateStr] ?? []
              const hasEvents = eventsOnDate.length > 0
              const isToday = dateStr === now.toISOString().split('T')[0]
              const isSelected = dateStr === selectedDate

              // Cek status persidangan acara pada hari tersebut untuk dot indicator
              const allDone = hasEvents && eventsOnDate.every(k => {
                const s = sidangStore.find(rec => rec.kegiatanId === k.id)
                return s?.status === StatusPersidangan.SELESAI_DI_SIDANG
              })

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
                  {hasEvents && (
                    <span
                      className={cn('mini-dot', allDone ? 'dot-done' : 'dot-pending')}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legenda Operasional */}
          <div className="mini-cal-legend">
            <div className="legend-item">
              <span className="legend-dot dot-pending" aria-hidden="true" />
              <span>Belum Selesai Sidang</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-done" aria-hidden="true" />
              <span>Selesai Di-sidang</span>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Daftar Agenda & Dokumen Persidangan */}
        <section className="persidangan-right" aria-labelledby="persidangan-date-title">
          <div className="persidangan-list-head">
            <h2 id="persidangan-date-title" className="persidangan-date-title">
              {formatTanggalLong(selectedDate)}
            </h2>
            <span className="persidangan-count-tag num-tabular">
              {selectedKegiatan.length} Agenda
            </span>
          </div>

          {selectedKegiatan.length === 0 ? (
            <div className="persidangan-empty card">
              <FileText size={40} className="empty-icon" aria-hidden="true" />
              <p className="empty-title">Tidak ada agenda sidang pada tanggal ini.</p>
              <p className="empty-desc">
                Pilih tanggal bertanda titik pada kalender untuk memeriksa dan mengunduh berkas persidangan.
              </p>
            </div>
          ) : (
            <div className="persidangan-list">
              {selectedKegiatan.map(keg => {
                const sidang = sidangStore.find(s => s.kegiatanId === keg.id)
                const isSelesai = sidang?.status === StatusPersidangan.SELESAI_DI_SIDANG
                const jenis = MOCK_JENIS_ACARA.find(j => j.id === keg.jenisAcaraId)

                return (
                  <article key={keg.id} className="sidang-card card">
                    {/* Header Kartu */}
                    <div className="scard-header">
                      <div className="scard-meta-left">
                        <span className="scard-time num-tabular">
                          <Clock size={13} />
                          {keg.jamMulai} WIB
                        </span>
                        {jenis && <span className="scard-jenis">{jenis.nama}</span>}
                      </div>
                      <span className={cn('badge', isSelesai ? 'badge-green' : 'badge-yellow')}>
                        {isSelesai ? '✓ Selesai Di-sidang' : '○ Belum Di-sidang'}
                      </span>
                    </div>

                    <h3 className="scard-nama">{keg.nama}</h3>

                    <div className="scard-location-row">
                      <div className="scard-loc-item">
                        <MapPin size={13} />
                        <span>{keg.lokasi}</span>
                      </div>
                      <div className="scard-loc-item">
                        <span className="scard-pimpinan-tag">Pimpinan:</span>
                        <span>{keg.penjabat}</span>
                      </div>
                    </div>

                    {/* Grid Dokumen Persidangan */}
                    <div className="scard-docs-section">
                      <h4 className="scard-section-title">Dokumen Resmi Persidangan</h4>
                      <div className="docs-grid">
                        {/* 1. Daftar Hadir */}
                        <div className="doc-item-box">
                          <div className="doc-item-head">
                            <FileCheck size={16} className={sidang?.daftarHadirNama ? 'doc-icon-active' : 'doc-icon-empty'} />
                            <span className="doc-item-label">Daftar Hadir Sidang</span>
                          </div>
                          {sidang?.daftarHadirNama ? (
                            <div className="doc-file-info">
                              <span className="doc-filename">{sidang.daftarHadirNama}</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs btn-doc-action"
                                onClick={() => downloadDokumenSidang(sidang.daftarHadirNama!, 'Daftar Hadir Peserta Sidang', keg)}
                              >
                                <Download size={12} />
                                <span>Unduh PDF</span>
                              </button>
                            </div>
                          ) : (
                            <div className="doc-empty-hint">Belum diunggah (Wajib)</div>
                          )}
                        </div>

                        {/* 2. Notulensi & Risalah */}
                        <div className="doc-item-box">
                          <div className="doc-item-head">
                            <FileText size={16} className={sidang?.notulenNama ? 'doc-icon-active' : 'doc-icon-empty'} />
                            <span className="doc-item-label">Notulensi & Risalah</span>
                          </div>
                          {sidang?.notulenNama ? (
                            <div className="doc-file-info">
                              <span className="doc-filename">{sidang.notulenNama}</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs btn-doc-action"
                                onClick={() => downloadDokumenSidang(sidang.notulenNama!, 'Notulensi & Risalah Sidang', keg)}
                              >
                                <Download size={12} />
                                <span>Unduh PDF</span>
                              </button>
                            </div>
                          ) : (
                            <div className="doc-empty-hint">Belum diunggah</div>
                          )}
                        </div>

                        {/* 3. Bahan Sidang / Paparan */}
                        <div className="doc-item-box">
                          <div className="doc-item-head">
                            <FileText size={16} className={sidang?.bahanSidangNama ? 'doc-icon-active' : 'doc-icon-empty'} />
                            <span className="doc-item-label">Bahan Paparan Sidang</span>
                          </div>
                          {sidang?.bahanSidangNama ? (
                            <div className="doc-file-info">
                              <span className="doc-filename">{sidang.bahanSidangNama}</span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs btn-doc-action"
                                onClick={() => downloadDokumenSidang(sidang.bahanSidangNama!, 'Bahan Paparan & Lampiran Sidang', keg)}
                              >
                                <Download size={12} />
                                <span>Unduh PDF</span>
                              </button>
                            </div>
                          ) : (
                            <div className="doc-empty-hint">Belum diunggah (Opsional)</div>
                          )}
                        </div>
                      </div>

                      {/* Akses Tautan Digital */}
                      {(sidang?.linkZoom || sidang?.linkRecorder) && (
                        <div className="links-row">
                          {sidang?.linkZoom && (
                            <div className="link-chip">
                              <span className="link-chip-label">Zoom Meeting:</span>
                              <a
                                href={sidang.linkZoom}
                                target="_blank"
                                rel="noreferrer"
                                className="link-chip-url"
                              >
                                <span>Buka Pertemuan Virtual</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                className="btn-copy-link"
                                onClick={() => copyToClipboard(sidang.linkZoom, 'Tautan Zoom')}
                                title="Salin Tautan"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}

                          {sidang?.linkRecorder && (
                            <div className="link-chip">
                              <span className="link-chip-label">Audio Recorder:</span>
                              <a
                                href={sidang.linkRecorder}
                                target="_blank"
                                rel="noreferrer"
                                className="link-chip-url"
                              >
                                <span>Akses Rekaman Audio</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                className="btn-copy-link"
                                onClick={() => copyToClipboard(sidang.linkRecorder, 'Tautan Rekaman')}
                                title="Salin Tautan"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Kartu & Tombol Kelola */}
                    <div className="scard-footer">
                      {isAuthorized ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(keg.id)}
                        >
                          <Edit3 size={13} />
                          <span>Kelola / Unggah Dokumen Sidang</span>
                        </button>
                      ) : (
                        <span className="read-only-indicator">
                          <FileText size={12} />
                          Mode Akses Arsip Dokumen Resmi
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Kelola / Unggah Dokumen Persidangan */}
      {activeKegId && activeKegiatanObj && (
        <div className="modal-backdrop" onClick={() => setActiveKegId(null)}>
          <div className="modal-dialog card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Kelola Dokumen Persidangan</h3>
                <p className="modal-subtitle">{activeKegiatanObj.nama}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-close"
                onClick={() => setActiveKegId(null)}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* 1. Upload Daftar Hadir */}
              <div className="form-group">
                <label className="form-label">
                  Daftar Hadir Sidang (PDF) <span className="req">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  className="form-control"
                  onChange={e => setForm(f => ({ ...f, daftarHadirFile: e.target.files?.[0] ?? null }))}
                />
                <span className="form-help">Wajib diunggah sebagai bukti kehadiran sah pimpinan dan peserta rapat.</span>
              </div>

              {/* 2. Upload Notulensi */}
              <div className="form-group">
                <label className="form-label">Notulensi / Risalah Sidang (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  className="form-control"
                  onChange={e => setForm(f => ({ ...f, notulenFile: e.target.files?.[0] ?? null }))}
                />
              </div>

              {/* 3. Upload Bahan Paparan */}
              <div className="form-group">
                <label className="form-label">Bahan Paparan / Lampiran Sidang (PDF/PPT)</label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  className="form-control"
                  onChange={e => setForm(f => ({ ...f, bahanSidangFile: e.target.files?.[0] ?? null }))}
                />
              </div>

              {/* 4. Link Zoom */}
              <div className="form-group">
                <label className="form-label">Tautan Zoom Cloud Meeting</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  className="form-control"
                  value={form.linkZoom}
                  onChange={e => setForm(f => ({ ...f, linkZoom: e.target.value }))}
                />
              </div>

              {/* 5. Link Recorder */}
              <div className="form-group">
                <label className="form-label">Tautan Rekaman Audio Cloud Recorder</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="form-control"
                  value={form.linkRecorder}
                  onChange={e => setForm(f => ({ ...f, linkRecorder: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveKegId(null)}
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveModal}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Simpan Berkas Persidangan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{persidanganStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped CSS
// ------------------------------------------------------------------
const persidanganStyles = `
  .persidangan-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 3rem;
  }

  .persidangan-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    align-items: start;
  }
  @media (min-width: 880px) {
    .persidangan-layout {
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
    color: var(--gold-500);
    font-weight: 700;
  }
  .mini-selected {
    background: var(--gold-subtle) !important;
    border-color: var(--gold-500) !important;
    color: var(--gold-600);
    font-weight: 700;
  }
  .mini-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    position: absolute;
    bottom: 3px;
  }
  .dot-done { background: var(--status-green); }
  .dot-pending { background: var(--gold-500); }

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

  /* Right Section */
  .persidangan-right {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .persidangan-list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .persidangan-date-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .persidangan-count-tag {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-sm);
  }

  .persidangan-empty {
    padding: 3rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .empty-icon {
    color: var(--text-muted);
    opacity: 0.6;
    margin-bottom: 0.5rem;
  }
  .empty-title {
    font-weight: 600;
    color: var(--text-primary);
  }
  .empty-desc {
    font-size: 0.825rem;
    color: var(--text-muted);
    max-width: 380px;
  }

  /* Sidang Card */
  .persidangan-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .sidang-card {
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    border: 1px solid var(--border-subtle);
    background: var(--surface-card);
  }
  .scard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .scard-meta-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .scard-time {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.775rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface-muted);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }
  .scard-jenis {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--surface-subtle);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }
  .scard-nama {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
  }
  .scard-location-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .scard-loc-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .scard-pimpinan-tag {
    font-weight: 600;
    color: var(--text-muted);
  }

  /* Docs Section inside Card */
  .scard-docs-section {
    border-top: 1px solid var(--border-subtle);
    padding-top: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .scard-section-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.75rem;
  }
  .doc-item-box {
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .doc-item-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .doc-icon-active { color: var(--status-green); }
  .doc-icon-empty { color: var(--text-muted); opacity: 0.5; }
  .doc-item-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
  }
  .doc-file-info {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .doc-filename {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-all;
  }
  .btn-doc-action {
    align-self: flex-start;
  }
  .doc-empty-hint {
    font-size: 0.725rem;
    font-style: italic;
    color: var(--text-muted);
  }

  /* Links Row */
  .links-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .link-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
  }
  .link-chip-label {
    font-weight: 600;
    color: var(--text-muted);
  }
  .link-chip-url {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
    color: var(--gold-600);
    text-decoration: none;
  }
  .link-chip-url:hover {
    text-decoration: underline;
  }
  .btn-copy-link {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
    display: flex;
    align-items: center;
  }
  .btn-copy-link:hover {
    color: var(--text-primary);
  }

  /* Footer Card */
  .scard-footer {
    border-top: 1px solid var(--border-subtle);
    padding-top: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .read-only-indicator {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Modal Dialog */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .modal-dialog {
    width: 100%;
    max-width: 540px;
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-subtle);
  }
  .modal-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .modal-subtitle {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }
  .modal-body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 70vh;
    overflow-y: auto;
  }
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    background: var(--surface-muted);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .form-label .req {
    color: var(--status-red);
  }
  .form-control {
    width: 100%;
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-sm);
    background: var(--surface-card);
    color: var(--text-primary);
  }
  .form-control:focus {
    outline: none;
    border-color: var(--gold-500);
  }
  .form-help {
    font-size: 0.725rem;
    color: var(--text-muted);
  }

  /* Toast Notification */
  .psd-toast {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 1200;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: var(--radius-sm);
    font-size: 0.825rem;
    font-weight: 600;
    box-shadow: var(--shadow-md);
  }
  .toast-success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  .toast-info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  .toast-error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }
`
