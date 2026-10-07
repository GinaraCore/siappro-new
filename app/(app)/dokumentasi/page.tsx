'use client'

// ============================================================
// SIAP-Pro: Dokumentasi & Bank Media
// Dewan Ekonomi Nasional Republik Indonesia
// Navigasi Kalender Tanggal + Galeri Foto Liputan & Multimedia
// ============================================================

import { useState, useMemo, useRef } from 'react'
import {
  Camera, Upload, X, Check, Loader2, Link2,
  ChevronLeft, ChevronRight, Image as ImageIcon, Clock, MapPin,
  CheckCircle2, Trash2, ExternalLink, Copy, Eye, Download,
  Sparkles, AlertCircle, Plus, Video, Mic,
} from 'lucide-react'
import { useUser, useUserRole } from '@/store/auth-store'
import { UserRole, StatusDokumentasi, Kegiatan } from '@/types'
import { useDataStore } from '@/store/data-store'
import { MOCK_JENIS_ACARA } from '@/lib/mock-data'
import { formatTanggalLong, isValidImageFile, cn } from '@/lib/utils'

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

/** Kompresi gambar client-side (max 800px, JPEG 75%) agar hemat localStorage */
function compressImageToDataUrl(file: File, maxDim = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve((e.target?.result as string) || '')
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve((e.target?.result as string) || '')
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ------------------------------------------------------------------
// Main Dokumentasi Page
// ------------------------------------------------------------------
export default function DokumentasiPage() {
  const user = useUser()
  const role = useUserRole()
  const now = new Date()

  const { upsertDokumentasi, getKegiatanForUser: getKegStore } = useDataStore()
  const dokStore = useDataStore(s => s.dokumentasi)

  // Hak akses: Tim Humas & Super Admin dapat mengunggah foto & kelola link
  const isAuthorized = role === UserRole.HUMAS || role === UserRole.SUPER_ADMIN
  const isReadOnly = !isAuthorized

  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0])

  // Lightbox Preview Foto
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxCaption, setLightboxCaption] = useState<string>('')

  // Modal Kelola Tautan Multimedia
  const [linkModalKegId, setLinkModalKegId] = useState<string | null>(null)
  const [linkVoiceInput, setLinkVoiceInput] = useState('')
  const [linkVideoInput, setLinkVideoInput] = useState('')
  const [isSavingLinks, setIsSavingLinks] = useState(false)

  // Status Upload
  const [uploadingKegId, setUploadingKegId] = useState<string | null>(null)
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

  // Handle Upload Foto Cepat untuk Kegiatan Tertentu
  const handleBatchPhotoUpload = async (kegId: string, files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) return
    setUploadingKegId(kegId)

    const validFiles = Array.from(files).filter(isValidImageFile)
    if (validFiles.length === 0) {
      triggerToast('Format file tidak didukung. Harap pilih file foto JPG/PNG/WEBP.', 'error')
      setUploadingKegId(null)
      return
    }

    try {
      const newUrls: string[] = []
      for (const file of validFiles) {
        const compressed = await compressImageToDataUrl(file, 800, 0.75)
        newUrls.push(compressed)
      }

      const existing = dokStore.find(d => d.kegiatanId === kegId)
      const mergedUrls = [...(existing?.fotoUrls ?? []), ...newUrls]

      upsertDokumentasi({
        kegiatanId: kegId,
        linkVoiceRecord: existing?.linkVoiceRecord ?? '',
        linkVideo: existing?.linkVideo ?? '',
        fotoUrls: mergedUrls,
        fotoCount: mergedUrls.length,
        status: StatusDokumentasi.SUDAH_DIDOKUMENTASI,
        updatedAt: new Date().toISOString(),
      })

      triggerToast(`${validFiles.length} foto dokumentasi berhasil ditambahkan!`)
    } catch (err) {
      console.error('Gagal upload foto:', err)
      triggerToast('Gagal memproses unggahan foto.', 'error')
    } finally {
      setUploadingKegId(null)
    }
  }

  // Handle Hapus Foto dari Galeri
  const handleDeletePhoto = (kegId: string, photoIdx: number) => {
    if (isReadOnly) return
    const existing = dokStore.find(d => d.kegiatanId === kegId)
    if (!existing) return

    const updated = existing.fotoUrls.filter((_, idx) => idx !== photoIdx)
    const newStatus = updated.length > 0 || existing.linkVideo || existing.linkVoiceRecord
      ? StatusDokumentasi.SUDAH_DIDOKUMENTASI
      : StatusDokumentasi.BELUM_DIDOKUMENTASI

    upsertDokumentasi({
      ...existing,
      fotoUrls: updated,
      fotoCount: updated.length,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })

    triggerToast('Foto berhasil dihapus dari galeri.', 'info')
  }

  // Modal Link Management
  const openLinkModal = (kegId: string) => {
    if (isReadOnly) return
    const existing = dokStore.find(d => d.kegiatanId === kegId)
    setLinkModalKegId(kegId)
    setLinkVoiceInput(existing?.linkVoiceRecord ?? '')
    setLinkVideoInput(existing?.linkVideo ?? '')
  }

  const handleSaveLinks = async () => {
    if (!linkModalKegId || isReadOnly) return
    setIsSavingLinks(true)
    await new Promise(r => setTimeout(r, 400))

    const existing = dokStore.find(d => d.kegiatanId === linkModalKegId)
    const newVoice = linkVoiceInput.trim()
    const newVideo = linkVideoInput.trim()
    const hasMedia = (existing?.fotoUrls && existing.fotoUrls.length > 0) || Boolean(newVoice || newVideo)

    upsertDokumentasi({
      kegiatanId: linkModalKegId,
      linkVoiceRecord: newVoice,
      linkVideo: newVideo,
      fotoUrls: existing?.fotoUrls ?? [],
      fotoCount: existing?.fotoUrls?.length ?? 0,
      status: hasMedia ? StatusDokumentasi.SUDAH_DIDOKUMENTASI : StatusDokumentasi.BELUM_DIDOKUMENTASI,
      updatedAt: new Date().toISOString(),
    })

    setLinkModalKegId(null)
    setIsSavingLinks(false)
    triggerToast('Tautan rekaman suara & video berhasil diperbarui.')
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    triggerToast(`${label} disalin ke clipboard!`, 'info')
  }

  const activeModalKegiatan = myKegiatan.find(k => k.id === linkModalKegId)

  return (
    <div className="dokumentasi-page">
      {/* Toast Notification */}
      {toast && (
        <div className={cn('dok-toast', `toast-${toast.type}`)} role="status">
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'info' && <Sparkles size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dokumentasi & Bank Media</h1>

        </div>
      </div>

      {/* Grid Layout 2 Kolom (Kalender di Kiri, Galeri Foto di Kanan) */}
      <div className="dokumentasi-layout">
        {/* Kolom Kiri: Mini Kalender */}
        <section className="mini-cal card" aria-label="Pemilih Tanggal Dokumentasi">
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

              // Cek status dokumentasi acara pada hari tersebut
              const allDone = hasEvents && eventsOnDate.every(k => {
                const d = dokStore.find(rec => rec.kegiatanId === k.id)
                return d?.status === StatusDokumentasi.SUDAH_DIDOKUMENTASI
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
              <span>Belum Didokumentasi</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-done" aria-hidden="true" />
              <span>Selesai Didokumentasi</span>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Daftar Agenda & Galeri Foto Liputan */}
        <section className="dokumentasi-right" aria-labelledby="dokumentasi-date-title">
          <div className="dokumentasi-list-head">
            <h2 id="dokumentasi-date-title" className="dokumentasi-date-title">
              {formatTanggalLong(selectedDate)}
            </h2>
            <span className="dokumentasi-count-tag num-tabular">
              {selectedKegiatan.length} Agenda
            </span>
          </div>

          {selectedKegiatan.length === 0 ? (
            <div className="dokumentasi-empty card">
              <ImageIcon size={40} className="empty-icon" aria-hidden="true" />
              <p className="empty-title">Tidak ada agenda dokumentasi pada tanggal ini.</p>
              <p className="empty-desc">
                Pilih tanggal bertanda titik pada kalender untuk memeriksa dan mengelola arsip foto liputan resmi.
              </p>
            </div>
          ) : (
            <div className="dokumentasi-list">
              {selectedKegiatan.map(keg => {
                const dok = dokStore.find(d => d.kegiatanId === keg.id)
                const photos = dok?.fotoUrls ?? []
                const isSelesai = dok?.status === StatusDokumentasi.SUDAH_DIDOKUMENTASI
                const jenis = MOCK_JENIS_ACARA.find(j => j.id === keg.jenisAcaraId)
                const isUploadingThis = uploadingKegId === keg.id

                return (
                  <article key={keg.id} className="dok-card card">
                    {/* Header Kartu */}
                    <div className="dcard-header">
                      <div className="dcard-meta-left">
                        <span className="dcard-time num-tabular">
                          <Clock size={13} />
                          {keg.jamMulai} WIB
                        </span>
                        {jenis && <span className="dcard-jenis">{jenis.nama}</span>}
                      </div>
                      <span className={cn('badge', isSelesai ? 'badge-green' : 'badge-yellow')}>
                        {isSelesai ? '✓ Sudah Didokumentasi' : '○ Belum Didokumentasi'}
                      </span>
                    </div>

                    <h3 className="dcard-nama">{keg.nama}</h3>

                    <div className="dcard-location-row">
                      <div className="dcard-loc-item">
                        <MapPin size={13} />
                        <span>{keg.lokasi}</span>
                      </div>
                      <div className="dcard-loc-item">
                        <span className="dcard-pimpinan-tag">Pimpinan:</span>
                        <span>{keg.penjabat}</span>
                      </div>
                    </div>

                    {/* Galeri Foto Dokumentasi */}
                    <div className="dcard-gallery-section">
                      <div className="gallery-section-head">
                        <div className="gallery-head-left">
                          <Camera size={15} className="gallery-head-icon" />
                          <h4 className="gallery-section-title">Galeri Foto Liputan Resmi</h4>
                          <span className="gallery-count-pill num-tabular">
                            {photos.length} Foto
                          </span>
                        </div>

                        {/* Tombol Tambah Foto Cepat (Khusus Humas & Super Admin) */}
                        {isAuthorized && (
                          <label className="btn btn-secondary btn-xs btn-add-photo">
                            {isUploadingThis ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                <span>Tambah Foto</span>
                              </>
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={isUploadingThis}
                              style={{ display: 'none' }}
                              onChange={e => handleBatchPhotoUpload(keg.id, e.target.files)}
                            />
                          </label>
                        )}
                      </div>

                      {photos.length > 0 ? (
                        <div className="photo-grid">
                          {photos.map((url, idx) => (
                            <div key={idx} className="photo-thumb-card">
                              <img
                                src={url}
                                alt={`Dokumentasi ${keg.nama} #${idx + 1}`}
                                className="photo-thumb-img"
                                onClick={() => {
                                  setLightboxUrl(url)
                                  setLightboxCaption(`${keg.nama} — Foto Liputan #${idx + 1}`)
                                }}
                              />
                              <div className="photo-thumb-overlay">
                                <button
                                  type="button"
                                  className="btn-overlay-action"
                                  onClick={() => {
                                    setLightboxUrl(url)
                                    setLightboxCaption(`${keg.nama} — Foto Liputan #${idx + 1}`)
                                  }}
                                  title="Perbesar Foto"
                                >
                                  <Eye size={13} />
                                </button>
                                {isAuthorized && (
                                  <button
                                    type="button"
                                    className="btn-overlay-action btn-delete-photo"
                                    onClick={() => handleDeletePhoto(keg.id, idx)}
                                    title="Hapus Foto"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="gallery-empty-banner">
                          <ImageIcon size={22} className="banner-icon" />
                          <div>
                            <p className="banner-title">Belum ada foto liputan untuk kegiatan ini.</p>
                            <p className="banner-desc">Klik tombol &quot;Tambah Foto&quot; untuk melampirkan dokumentasi lapangan.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Akses Tautan Multimedia (Audio / Video) */}
                    {(dok?.linkVoiceRecord || dok?.linkVideo) && (
                      <div className="dcard-links-section">
                        <div className="links-row">
                          {dok?.linkVoiceRecord && (
                            <div className="link-chip">
                              <Mic size={13} className="link-icon-voice" />
                              <span className="link-chip-label">Rekaman Suara:</span>
                              <a
                                href={dok.linkVoiceRecord}
                                target="_blank"
                                rel="noreferrer"
                                className="link-chip-url"
                              >
                                <span>Buka Audio</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                className="btn-copy-link"
                                onClick={() => copyToClipboard(dok.linkVoiceRecord, 'Tautan Rekaman Suara')}
                                title="Salin Tautan"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}

                          {dok?.linkVideo && (
                            <div className="link-chip">
                              <Video size={13} className="link-icon-video" />
                              <span className="link-chip-label">Video Liputan:</span>
                              <a
                                href={dok.linkVideo}
                                target="_blank"
                                rel="noreferrer"
                                className="link-chip-url"
                              >
                                <span>Tonton Video</span>
                                <ExternalLink size={11} />
                              </a>
                              <button
                                type="button"
                                className="btn-copy-link"
                                onClick={() => copyToClipboard(dok.linkVideo, 'Tautan Video')}
                                title="Salin Tautan"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Kartu & Kelola Link */}
                    <div className="dcard-footer">
                      {isAuthorized ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openLinkModal(keg.id)}
                        >
                          <Link2 size={13} />
                          <span>Kelola Tautan Suara & Video</span>
                        </button>
                      ) : (
                        <span className="read-only-indicator">
                          <Camera size={12} />
                          Mode Akses Arsip Visual Resmi DEN
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

      {/* Lightbox Preview Foto */}
      {lightboxUrl && (
        <div className="lightbox-backdrop" onClick={() => setLightboxUrl(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="lightbox-head">
              <span className="lightbox-caption">{lightboxCaption}</span>
              <div className="lightbox-head-actions">
                <a
                  href={lightboxUrl}
                  download="dokumentasi-den.jpg"
                  className="btn btn-ghost btn-icon"
                  title="Unduh Foto"
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setLightboxUrl(null)}
                  aria-label="Tutup pratinjau"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="lightbox-img-wrap">
              <img src={lightboxUrl} alt={lightboxCaption} className="lightbox-img" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Tautan Audio & Video */}
      {linkModalKegId && activeModalKegiatan && (
        <div className="modal-backdrop" onClick={() => setLinkModalKegId(null)}>
          <div className="modal-dialog card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Kelola Tautan Multimedia</h3>
                <p className="modal-subtitle">{activeModalKegiatan.nama}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-close"
                onClick={() => setLinkModalKegId(null)}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <Mic size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Tautan Rekaman Suara (Google Drive / Cloud Audio)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="form-control"
                  value={linkVoiceInput}
                  onChange={e => setLinkVoiceInput(e.target.value)}
                />
                <span className="form-help">Tautan rekaman audio perbincangan atau jalannya persidangan.</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Video size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Tautan Video Liputan (YouTube / Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="form-control"
                  value={linkVideoInput}
                  onChange={e => setLinkVideoInput(e.target.value)}
                />
                <span className="form-help">Tautan video kompilasi atau rekaman visual kegiatan.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLinkModalKegId(null)}
                disabled={isSavingLinks}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveLinks}
                disabled={isSavingLinks}
              >
                {isSavingLinks ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Simpan Tautan Media</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{dokumentasiStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped CSS
// ------------------------------------------------------------------
const dokumentasiStyles = `
  .dokumentasi-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 3rem;
  }

  .dokumentasi-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    align-items: start;
  }
  @media (min-width: 880px) {
    .dokumentasi-layout {
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
  .dokumentasi-right {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .dokumentasi-list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dokumentasi-date-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .dokumentasi-count-tag {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-sm);
  }

  .dokumentasi-empty {
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

  /* Dokumentasi Card */
  .dokumentasi-list {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }
  .dok-card {
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    border: 1px solid var(--border-subtle);
    background: var(--surface-card);
  }
  .dcard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dcard-meta-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .dcard-time {
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
  .dcard-jenis {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--surface-subtle);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }
  .dcard-nama {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
  }
  .dcard-location-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .dcard-loc-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .dcard-pimpinan-tag {
    font-weight: 600;
    color: var(--text-muted);
  }

  /* Gallery Section */
  .dcard-gallery-section {
    border-top: 1px solid var(--border-subtle);
    padding-top: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .gallery-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .gallery-head-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .gallery-head-icon {
    color: var(--gold-500);
  }
  .gallery-section-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .gallery-count-pill {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--gold-600);
    background: var(--gold-subtle);
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
  }

  .btn-add-photo {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.65rem;
  }
  .photo-thumb-card {
    position: relative;
    aspect-ratio: 4/3;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--border-distinct);
    background: var(--surface-muted);
  }
  .photo-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: transform var(--transition-fast);
  }
  .photo-thumb-card:hover .photo-thumb-img {
    transform: scale(1.04);
  }
  .photo-thumb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .photo-thumb-card:hover .photo-thumb-overlay {
    opacity: 1;
  }
  .btn-overlay-action {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: none;
    background: #ffffff;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast);
  }
  .btn-overlay-action:hover {
    transform: scale(1.1);
  }
  .btn-delete-photo {
    color: var(--status-red);
  }
  .btn-delete-photo:hover {
    background: #fee2e2;
  }

  .gallery-empty-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--surface-muted);
    border: 1px dashed var(--border-distinct);
    border-radius: var(--radius-sm);
  }
  .banner-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .banner-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .banner-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Links Section */
  .dcard-links-section {
    border-top: 1px solid var(--border-subtle);
    padding-top: 0.65rem;
  }
  .links-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .link-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-distinct);
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
  }
  .link-icon-voice { color: #d97706; }
  .link-icon-video { color: #dc2626; }
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
  .dcard-footer {
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

  /* Lightbox Modal */
  .lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1300;
    padding: 1.5rem;
  }
  .lightbox-content {
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    background: #ffffff;
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
  }
  .lightbox-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
    background: var(--surface-card);
  }
  .lightbox-caption {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .lightbox-head-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .lightbox-img-wrap {
    padding: 1rem;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: 75vh;
  }
  .lightbox-img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
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
    max-width: 520px;
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
  .dok-toast {
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
