'use client'

// ============================================================
// SIAP-Pro: Checklist & Laporan Kegiatan Page
// Dewan Ekonomi Nasional Republik Indonesia
// Verifikasi Lapangan, Foto Bukti, dan Approval Super Admin (ACC)
// Route: /pelaporan/[kegiatanId]
// ============================================================

import { useState, useMemo, use, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Camera, X, Check, Loader2,
  AlertCircle, Download, CheckCircle2, Info,
  Clock, MapPin, ChevronDown, ChevronUp,
  ShieldCheck, RotateCcw, Edit2, MessageSquare,
  FileCheck, Sparkles, Eye, Save, Send, Lock,
} from 'lucide-react'
import {
  MOCK_JENIS_ACARA,
  MOCK_USERS,
  getTemplate,
} from '@/lib/mock-data'
import { useUser } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import {
  StatusLaporan, ItemChecklist, UserRole,
} from '@/types'
import {
  cn, formatTanggalLong, getStatusLaporanLabel,
  getStatusLaporanBadge, isValidImageFile,
} from '@/lib/utils'
import { downloadLaporanPdfDirectly } from '@/lib/pdf-generator'

// ------------------------------------------------------------------
// Local Checklist State Interface
// ------------------------------------------------------------------
interface LocalJawaban {
  itemId: string
  dicentang: boolean
  keterangan: string
  fotoUrls: string[]
  fotoFiles: File[]
  isUploading: boolean
}

/** Kompres gambar ke dimensi max 800px & quality 0.75 agar hemat penyimpanan localStorage & rendering PDF cepat */
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

function generateReportId(existingId: string | undefined): string {
  return existingId ?? `lap-${Date.now()}`
}

// ------------------------------------------------------------------
// Main Checklist Page Component
// ------------------------------------------------------------------
export default function ChecklistPage({
  params,
}: {
  params: Promise<{ kegiatanId: string }>
}) {
  const { kegiatanId } = use(params)
  const router = useRouter()
  const user = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadItemId, setActiveUploadItemId] = useState<string | null>(null)

  const { upsertLaporan, approveLaporan, rejectLaporan } = useDataStore()
  const storeKegiatan = useDataStore(s => s.kegiatan)
  const storeLaporan = useDataStore(s => s.laporan)

  const kegiatan = storeKegiatan.find(k => k.id === kegiatanId)
  const jenis = MOCK_JENIS_ACARA.find(j => j.id === kegiatan?.jenisAcaraId)
  const template = kegiatan ? getTemplate(kegiatan.jenisAcaraId) : null

  const existingLaporan = storeLaporan.find(l => l.kegiatanId === kegiatanId)

  // Helper untuk inisialisasi state jawaban dari template dan laporan tersimpan
  const buildInitialJawaban = (
    tpl: ReturnType<typeof getTemplate> | null | undefined,
    lap: typeof existingLaporan,
    kId: string
  ): Record<string, LocalJawaban> => {
    const map: Record<string, LocalJawaban> = {}
    tpl?.items.filter(i => i.aktif).forEach(item => {
      const existing = lap?.jawaban.find(j => j.itemChecklistId === item.id)
      map[item.id] = {
        itemId: item.id,
        dicentang: existing?.dicentang ?? false,
        keterangan: existing?.keterangan ?? '',
        fotoUrls: (existing?.fotoUrls && existing.fotoUrls.length > 0)
          ? existing.fotoUrls
          : (existing?.mediaIds && existing.mediaIds.length > 0 && kId === 'keg-005')
            ? [`/mock/${item.id}.jpg`]
            : [],
        fotoFiles: [],
        isUploading: false,
      }
    })
    return map
  }

  // Initialize jawaban state
  const [jawabanMap, setJawabanMap] = useState<Record<string, LocalJawaban>>(() =>
    buildInitialJawaban(template, existingLaporan, kegiatanId)
  )

  const [catatanPenutup, setCatatanPenutup] = useState(existingLaporan?.catatanPenutup ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [savedStatus, setSavedStatus] = useState<StatusLaporan>(
    existingLaporan?.status ?? StatusLaporan.BELUM_DILAPORKAN
  )
  const [loadedKegiatanId, setLoadedKegiatanId] = useState<string>(kegiatanId)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [catatanRevisiInput, setCatatanRevisiInput] = useState('')
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  // Reset & sinkronisasi state saat berpindah kegiatanId
  if (template && loadedKegiatanId !== kegiatanId) {
    setLoadedKegiatanId(kegiatanId)
    setJawabanMap(buildInitialJawaban(template, existingLaporan, kegiatanId))
    setCatatanPenutup(existingLaporan?.catatanPenutup ?? '')
    setSavedStatus(existingLaporan?.status ?? StatusLaporan.BELUM_DILAPORKAN)
    setValidationErrors([])
  }

  // Role Permissions
  const isAdmin = user ? [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(user.role) : false
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN
  const isProtokol = user?.role === UserRole.PROTOKOL || isSuperAdmin
  const isReadOnly = !isProtokol // Only protokol & super admin can edit checklist

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ msg, type })
    setTimeout(() => setFeedbackToast(null), 4000)
  }

  const items = template?.items.filter(i => i.aktif) ?? []
  const groups: Record<string, ItemChecklist[]> = {}
  items.forEach(item => {
    if (!groups[item.kelompok]) groups[item.kelompok] = []
    groups[item.kelompok].push(item)
  })

  if (!kegiatan || !template || !user) {
    return (
      <div className="checklist-page">
        <div className="checklist-not-found card">
          <AlertCircle size={36} style={{ color: 'var(--status-red)' }} />
          <p>Data kegiatan atau template checklist tidak ditemukan.</p>
          <button className="btn btn-secondary" onClick={() => router.back()}>Kembali ke Daftar</button>
        </div>
      </div>
    )
  }

  // Progress metrics
  const wajibItems = items.filter(i => i.wajib)
  const filledWajib = wajibItems.filter(i => {
    const j = jawabanMap[i.id]
    if (!j?.dicentang) return false
    if (i.wajibFoto && j.fotoUrls.length === 0) return false
    return true
  })
  const progress = wajibItems.length > 0
    ? Math.round((filledWajib.length / wajibItems.length) * 100)
    : 100

  const totalFotoCount = Object.values(jawabanMap).reduce((acc, j) => acc + j.fotoUrls.length, 0)

  // ------- Handlers -------

  const updateJawaban = (itemId: string, patch: Partial<LocalJawaban>) => {
    if (isReadOnly) return
    setJawabanMap(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
    setValidationErrors([])
  }

  const handleFotoUpload = async (itemId: string, files: FileList | null) => {
    if (isReadOnly || !files || files.length === 0) return
    const file = files[0]
    if (!isValidImageFile(file)) {
      triggerToast('Format file tidak didukung. Harap unggah file foto (JPG, PNG, WEBP).', 'error')
      return
    }

    updateJawaban(itemId, { isUploading: true })
    try {
      const dataUrl = await compressImageToDataUrl(file, 800, 0.75)
      setJawabanMap(prev => {
        const cur = prev[itemId]
        return {
          ...prev,
          [itemId]: {
            ...cur,
            fotoUrls: [...(cur?.fotoUrls ?? []), dataUrl],
            fotoFiles: [...(cur?.fotoFiles ?? []), file],
            isUploading: false,
          },
        }
      })
      triggerToast('Foto bukti berhasil diunggah.')
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fallbackUrl = (e.target?.result as string) || ''
        setJawabanMap(prev => {
          const cur = prev[itemId]
          return {
            ...prev,
            [itemId]: {
              ...cur,
              fotoUrls: [...(cur?.fotoUrls ?? []), fallbackUrl],
              fotoFiles: [...(cur?.fotoFiles ?? []), file],
              isUploading: false,
            },
          }
        })
        triggerToast('Foto bukti berhasil diunggah.')
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFoto = (itemId: string, idx: number) => {
    if (isReadOnly) return
    const j = jawabanMap[itemId]
    const newUrls = j.fotoUrls.filter((_, i) => i !== idx)
    const newFiles = j.fotoFiles.filter((_, i) => i !== idx)
    updateJawaban(itemId, { fotoUrls: newUrls, fotoFiles: newFiles })
  }

  const validate = (): string[] => {
    const errors: string[] = []
    wajibItems.forEach(item => {
      const j = jawabanMap[item.id]
      if (!j?.dicentang) {
        errors.push(`Butir #${item.nomor} "${item.teks}" belum dicentang.`)
      } else if (item.wajibFoto && j.fotoUrls.length === 0) {
        errors.push(`Butir #${item.nomor} "${item.teks}" mewajibkan lampiran foto bukti.`)
      }
    })
    return errors
  }

  // Protokol: Simpan Draf
  const handleSimpanDraf = async () => {
    if (isReadOnly) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 400))

    const newStatus = StatusLaporan.DRAF
    const reportId = generateReportId(existingLaporan?.id)
    upsertLaporan({
      id: reportId,
      kegiatanId,
      status: newStatus,
      catatanPenutup,
      pembuatId: existingLaporan?.pembuatId ?? user.id,
      disetujuiOlehId: existingLaporan?.disetujuiOlehId ?? null,
      waktuPersetujuan: existingLaporan?.waktuPersetujuan ?? null,
      catatanRevisi: existingLaporan?.catatanRevisi ?? null,
      jawaban: Object.values(jawabanMap).map(j => ({
        id: `jaw-${j.itemId}`,
        laporanId: reportId,
        itemChecklistId: j.itemId,
        dicentang: j.dicentang,
        keterangan: j.keterangan,
        mediaIds: j.fotoUrls.length > 0 ? [`med-${j.itemId}`] : [],
        fotoUrls: j.fotoUrls,
      })),
      snapshotItems: template.items,
      waktuPelaporan: existingLaporan?.waktuPelaporan ?? null,
      createdAt: existingLaporan?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setSavedStatus(newStatus)
    setIsSaving(false)
    triggerToast('Draf checklist berhasil disimpan.', 'info')
  }

  // Protokol: Ajukan Laporan ke Super Admin
  const handleAjukanLaporan = async () => {
    if (isReadOnly) return
    const errors = validate()
    if (errors.length > 0) {
      setValidationErrors(errors)
      triggerToast(`Terdapat ${errors.length} butir wajib yang belum lengkap.`, 'error')
      return
    }

    setIsSaving(true)
    await new Promise(r => setTimeout(r, 600))

    const newStatus = StatusLaporan.MENUNGGU_PERSETUJUAN
    const nowIso = new Date().toISOString()
    const reportId = generateReportId(existingLaporan?.id)

    upsertLaporan({
      id: reportId,
      kegiatanId,
      status: newStatus,
      catatanPenutup,
      pembuatId: existingLaporan?.pembuatId ?? user.id,
      disetujuiOlehId: null,
      waktuPersetujuan: null,
      catatanRevisi: null,
      jawaban: Object.values(jawabanMap).map(j => ({
        id: `jaw-${j.itemId}`,
        laporanId: reportId,
        itemChecklistId: j.itemId,
        dicentang: j.dicentang,
        keterangan: j.keterangan,
        mediaIds: j.fotoUrls.length > 0 ? [`med-${j.itemId}`] : [],
        fotoUrls: j.fotoUrls,
      })),
      snapshotItems: template.items,
      waktuPelaporan: nowIso,
      createdAt: existingLaporan?.createdAt ?? nowIso,
      updatedAt: nowIso,
    })

    setSavedStatus(newStatus)
    setIsSaving(false)
    setValidationErrors([])
    triggerToast('Laporan berhasil diajukan ke Super Admin untuk persetujuan (ACC).', 'success')
  }

  // Super Admin: ACC / Setujui Laporan
  const handleApprove = async () => {
    if (!isAdmin) return
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))

    upsertLaporan({
      id: existingLaporan?.id ?? `lap-${Date.now()}`,
      kegiatanId,
      status: StatusLaporan.DISETUJUI,
      catatanPenutup,
      pembuatId: existingLaporan?.pembuatId ?? user.id,
      disetujuiOlehId: user.id,
      waktuPersetujuan: new Date().toISOString(),
      catatanRevisi: null,
      jawaban: Object.values(jawabanMap).map(j => ({
        id: `jaw-${j.itemId}`,
        laporanId: existingLaporan?.id ?? `lap-${Date.now()}`,
        itemChecklistId: j.itemId,
        dicentang: j.dicentang,
        keterangan: j.keterangan,
        mediaIds: j.fotoUrls.length > 0 ? [`med-${j.itemId}`] : [],
        fotoUrls: j.fotoUrls,
      })),
      snapshotItems: template.items,
      waktuPelaporan: existingLaporan?.waktuPelaporan ?? new Date().toISOString(),
      createdAt: existingLaporan?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setSavedStatus(StatusLaporan.DISETUJUI)
    setIsSaving(false)
    triggerToast('Laporan BERHASIL DISETUJUI (ACC)! Agenda resmi berstatus Terlaksana.', 'success')
  }

  // Super Admin: Minta Revisi
  const handleRejectRevisi = () => {
    if (!catatanRevisiInput.trim()) {
      triggerToast('Harap tuliskan catatan perbaikan sebelum mengirim revisi.', 'error')
      return
    }

    rejectLaporan(kegiatanId, user.id, catatanRevisiInput.trim())
    setSavedStatus(StatusLaporan.PERLU_REVISI)
    setShowRevisionModal(false)
    triggerToast('Laporan dikembalikan ke Tim Protokol untuk perbaikan.', 'info')
  }

  // 1-Click Direct Download PDF Engine
  const handleDirectDownloadPdf = async () => {
    if (savedStatus !== StatusLaporan.DISETUJUI) {
      triggerToast('Dokumen PDF resmi hanya dapat diunduh setelah disetujui (ACC) oleh Super Admin.', 'error')
      return
    }

    setIsDownloadingPdf(true)
    try {
      await downloadLaporanPdfDirectly({
        kegiatan,
        items: template.items,
        jawabanMap,
        catatanPenutup,
        pembuatNama: existingLaporan?.pembuat?.nama || (existingLaporan?.pembuatId ? MOCK_USERS.find(u => u.id === existingLaporan.pembuatId)?.nama : null) || user.nama || 'Petugas Protokol DEN',
        disetujuiNama: existingLaporan?.disetujuiOleh?.nama || (existingLaporan?.disetujuiOlehId ? MOCK_USERS.find(u => u.id === existingLaporan.disetujuiOlehId)?.nama : null) || 'Super Admin Protokol',
        waktuPersetujuan: existingLaporan?.waktuPersetujuan ?? new Date().toISOString(),
      })
      triggerToast('Dokumen PDF resmi berhasil diunduh.', 'success')
    } catch (err) {
      console.error('Gagal generate PDF:', err)
      triggerToast('Gagal mengunduh dokumen PDF. Silakan coba lagi.', 'error')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const isGroupExpanded = (group: string) =>
    expandedGroups[group] !== false

  const isApproved = savedStatus === StatusLaporan.DISETUJUI
  const isPendingAcc = savedStatus === StatusLaporan.MENUNGGU_PERSETUJUAN
  const isDraftOrRevision = savedStatus === StatusLaporan.DRAF || savedStatus === StatusLaporan.PERLU_REVISI || savedStatus === StatusLaporan.BELUM_DILAPORKAN

  return (
    <div className="checklist-page">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={cn('feedback-toast', `toast-${feedbackToast.type}`)}>
          {feedbackToast.type === 'success' && <CheckCircle2 size={16} />}
          {feedbackToast.type === 'error' && <AlertCircle size={16} />}
          {feedbackToast.type === 'info' && <Info size={16} />}
          <span>{feedbackToast.msg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="checklist-topbar">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.back()}
          aria-label="Kembali ke agenda"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        <div className="checklist-topbar-info">
          <h1 className="checklist-title">Pelaporan Kegiatan Protokol</h1>
          <span className={cn('badge', `badge-${getStatusLaporanBadge(savedStatus)}`)}>
            {getStatusLaporanLabel(savedStatus)}
          </span>
        </div>
      </header>

      {/* Kegiatan Info Header Card (Compact) */}
      <section className="kegiatan-info-card card" aria-label="Informasi Kegiatan">
        <div className="kegiatan-info-row">
          <Clock size={13} aria-hidden="true" />
          <span className="num-tabular">{kegiatan.jamMulai} WIB</span>
          <span className="kegiatan-info-sep" aria-hidden="true">|</span>
          <MapPin size={13} aria-hidden="true" />
          <span>{kegiatan.lokasi}</span>
          {jenis && (
            <>
              <span className="kegiatan-info-sep" aria-hidden="true">|</span>
              <span className="kegiatan-info-jenis">{jenis.nama}</span>
            </>
          )}
        </div>
        <h2 className="kegiatan-info-nama">{kegiatan.nama}</h2>
        <p className="kegiatan-info-tgl num-tabular">{formatTanggalLong(kegiatan.tanggal)}</p>
      </section>



      {/* Validation Errors Box */}
      {validationErrors.length > 0 && (
        <div className="validation-errors" role="alert">
          <div className="validation-header">
            <AlertCircle size={15} />
            <span>Terdapat {validationErrors.length} butir wajib yang belum lengkap:</span>
          </div>
          <ul className="validation-list">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Compact High-Density Checklist Accordion Groups */}
      <section className="checklist-groups" aria-label="Daftar Butir Checklist">
        {Object.entries(groups).map(([group, groupItems]) => {
          const groupCompletedCount = groupItems.filter(i => jawabanMap[i.id]?.dicentang).length
          const isGroupAllDone = groupCompletedCount === groupItems.length

          return (
            <div key={group} className="checklist-group card">
              <button
                className="group-header"
                onClick={() => toggleGroup(group)}
                aria-expanded={isGroupExpanded(group)}
              >
                <div className="group-header-left">
                  <span className="group-name">{group}</span>
                  <span className={cn('group-pill', isGroupAllDone ? 'pill-done' : 'pill-pending')}>
                    {groupCompletedCount} / {groupItems.length} Selesai
                  </span>
                </div>
                {isGroupExpanded(group)
                  ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                }
              </button>

              {isGroupExpanded(group) && (
                <div className="group-items-list">
                  {groupItems.map(item => (
                    <CompactChecklistItemRow
                      key={item.id}
                      item={item}
                      jawaban={jawabanMap[item.id]}
                      isReadOnly={isReadOnly}
                      onUpdate={patch => updateJawaban(item.id, patch)}
                      onFotoRemove={idx => removeFoto(item.id, idx)}
                      onPreviewPhoto={url => setPreviewPhotoUrl(url)}
                      hasValidationError={validationErrors.some(e => e.includes(`#${item.nomor}`))}
                      onOpenFileDialog={() => {
                        if (isReadOnly) return
                        setActiveUploadItemId(item.id)
                        fileInputRef.current?.click()
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* Catatan Evaluasi Penutup */}
      <section className="catatan-section card" aria-label="Catatan Pelaksanaan Acara">
        <label htmlFor="catatan-penutup-input" className="form-label" style={{ fontWeight: 600 }}>
          <MessageSquare size={14} />
          <span>Catatan Pelaksanaan / Dinamika Lapangan</span>
        </label>
        <textarea
          id="catatan-penutup-input"
          className="form-textarea"
          rows={3}
          placeholder={isReadOnly ? 'Tidak ada catatan tambahan dari tim protokol.' : 'Tuliskan dinamika pelaksanaan acara, perubahan rundown mendadak, atau evaluasi keprotokolan...'}
          value={catatanPenutup}
          onChange={e => !isReadOnly && setCatatanPenutup(e.target.value)}
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
      </section>

      {/* ============================================================ */}
      {/* BOTTOM ACTION CENTER & WORKFLOW CTA (Consolidated UX) */}
      {/* ============================================================ */}
      <section className="checklist-bottom-panel card" aria-label="Aksi dan Pengesahan Laporan">
        {/* Status & Progress Summary Header */}
        <div className="bottom-panel-header">
          <div className="bottom-panel-summary">
            <div className="bottom-panel-title">
              <span className="font-bold text-base">Aksi & Pengesahan Laporan Protokol</span>
              <span className={cn('badge', `badge-${getStatusLaporanBadge(savedStatus)}`)}>
                {getStatusLaporanLabel(savedStatus)}
              </span>
            </div>
            <p className="bottom-panel-subtitle">
              {isApproved
                ? 'Laporan telah diverifikasi dan disetujui (ACC) oleh Super Admin. Seluruh data diverifikasi dan dokumen PDF resmi siap diunduh.'
                : isPendingAcc
                  ? 'Laporan sedang menunggu persetujuan (ACC) dari Super Admin / Kasubbag Protokol.'
                  : savedStatus === StatusLaporan.PERLU_REVISI
                    ? `Perlu perbaikan oleh Tim Protokol. Catatan: "${existingLaporan?.catatanRevisi || '-'}"`
                    : 'Lengkapi 17 butir checklist dan foto bukti sebelum mengajukan ke Super Admin.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="bottom-panel-metrics">
            <div className="metric-chip">
              <span className="metric-chip-label">Verifikasi Wajib</span>
              <span className="metric-chip-val font-bold">{filledWajib.length} / {wajibItems.length} Butir</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Foto Bukti</span>
              <span className="metric-chip-val font-bold">{totalFotoCount} Foto</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="bottom-panel-actions">
          {/* Protokol: Simpan Draf & Ajukan */}
          {isProtokol && !isApproved && (
            <div className="btn-group-left">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSimpanDraf}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>Simpan Draf</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAjukanLaporan}
                disabled={isSaving || progress < 100}
                title={progress < 100 ? 'Lengkapi seluruh butir wajib terlebih dahulu' : 'Ajukan laporan ke Super Admin'}
              >
                <Send size={16} />
                <span>Ajukan ke Super Admin</span>
              </button>
            </div>
          )}

          {/* Super Admin: Setujui / Minta Revisi */}
          {isAdmin && !isApproved && (
            <div className="btn-group-admin">
              {isPendingAcc && (
                <button
                  type="button"
                  className="btn btn-ghost acc-btn-revisi"
                  onClick={() => setShowRevisionModal(true)}
                  disabled={isSaving}
                >
                  <RotateCcw size={16} />
                  <span>Minta Revisi</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary acc-btn-approve"
                onClick={handleApprove}
                disabled={isSaving}
              >
                <CheckCircle2 size={16} />
                <span>Setujui Laporan (ACC)</span>
              </button>
            </div>
          )}

          {/* Direct Download PDF Button (Always at bottom) */}
          <div className="btn-group-download" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={cn('btn', isApproved ? 'btn-download-pdf-active' : 'btn-download-pdf-locked')}
              onClick={handleDirectDownloadPdf}
              disabled={!isApproved || isDownloadingPdf}
              title={!isApproved ? 'Harus disetujui (ACC) Super Admin terlebih dahulu' : 'Unduh berkas PDF resmi'}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Membuat Dokumen PDF...</span>
                </>
              ) : isApproved ? (
                <>
                  <Download size={16} />
                  <span>Unduh Dokumen PDF Resmi</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Download PDF (Terkunci — Menunggu ACC)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Hidden File Input for Mobile / Camera Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => {
          if (activeUploadItemId) handleFotoUpload(activeUploadItemId, e.target.files)
          e.target.value = ''
        }}
      />

      {/* Modal Minta Revisi Super Admin */}
      {showRevisionModal && (
        <div className="modal-backdrop" onClick={() => setShowRevisionModal(false)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Kembalikan Laporan untuk Revisi</h3>
              <button className="btn-icon btn-ghost" onClick={() => setShowRevisionModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Tuliskan instruksi perbaikan atau butir yang memerlukan foto bukti tambahan bagi Tim Protokol:
              </p>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Contoh: Lampirkan foto bukti kesiapan name table VIP dan cek ulang mic podium..."
                value={catatanRevisiInput}
                onChange={e => setCatatanRevisiInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRevisionModal(false)}>
                Batal
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleRejectRevisi}>
                Kirim Permintaan Revisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="photo-lightbox-backdrop" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="photo-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={previewPhotoUrl} alt="Pratinjau Foto Bukti" className="lightbox-img" />
            <button className="lightbox-close" onClick={() => setPreviewPhotoUrl(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <style>{checklistStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Compact High-Density Checklist Item Row Component
// ------------------------------------------------------------------
function CompactChecklistItemRow({
  item,
  jawaban,
  isReadOnly = false,
  onUpdate,
  onFotoRemove,
  onPreviewPhoto,
  hasValidationError,
  onOpenFileDialog,
}: {
  item: ItemChecklist
  jawaban: LocalJawaban
  isReadOnly?: boolean
  onUpdate: (patch: Partial<LocalJawaban>) => void
  onFotoRemove: (idx: number) => void
  onPreviewPhoto: (url: string) => void
  hasValidationError: boolean
  onOpenFileDialog: () => void
}) {
  const [showNoteInput, setShowNoteInput] = useState(false)
  const isChecked = jawaban?.dicentang ?? false
  const hasNote = Boolean(jawaban?.keterangan?.trim())
  const hasPhotos = (jawaban?.fotoUrls?.length ?? 0) > 0

  return (
    <div className={cn('compact-item-row', isChecked && 'row-checked', hasValidationError && 'row-error')}>
      {/* 1. Top Section: Checkbox + Number + Full-Width Title & Badges */}
      <div className="citem-top-section">
        <div className="citem-col-check">
          <input
            type="checkbox"
            id={`chk-${item.id}`}
            className="checkbox citem-checkbox"
            checked={isChecked}
            onChange={e => !isReadOnly && onUpdate({ dicentang: e.target.checked })}
            disabled={isReadOnly}
            aria-label={`Verifikasi ${item.teks}`}
          />
          <span className="citem-number num-tabular">#{item.nomor}</span>
        </div>

        <div className="citem-col-body">
          <div className="citem-title-row">
            <label htmlFor={`chk-${item.id}`} className={cn('citem-label', isChecked && 'label-checked')}>
              {item.teks}
            </label>
            <div className="citem-tags">
              {item.wajib ? (
                <span className="citem-tag tag-wajib">Wajib</span>
              ) : (
                <span className="citem-tag tag-opsional">Opsional</span>
              )}
              {item.wajibFoto && (
                <span className="citem-tag tag-foto">
                  <Camera size={10} aria-hidden="true" />
                  <span>Wajib Foto</span>
                </span>
              )}
            </div>
          </div>

          {/* Existing Note Snippet or Inline Input */}
          {hasNote && !showNoteInput && (
            <div className="citem-note-display">
              <span className="citem-note-text">“{jawaban.keterangan}”</span>
              {!isReadOnly && (
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => setShowNoteInput(true)}
                  title="Ubah catatan"
                >
                  <Edit2 size={11} />
                </button>
              )}
            </div>
          )}

          {showNoteInput && !isReadOnly && (
            <div className="citem-note-edit">
              <input
                type="text"
                className="citem-inline-input"
                value={jawaban?.keterangan ?? ''}
                onChange={e => onUpdate({ keterangan: e.target.value })}
                placeholder="Tulis catatan kondisi riil lapangan..."
                autoFocus
              />
              <button
                type="button"
                className="btn-sm btn-ghost"
                style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setShowNoteInput(false)}
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Actions & Photos Strip (Indented on Mobile) */}
      <div className="citem-col-actions">
        {/* Photos Thumbnails */}
        {hasPhotos && (
          <div className="citem-photo-strip">
            {jawaban.fotoUrls.map((url, idx) => (
              <div key={idx} className="cphoto-thumb-wrap">
                <img
                  src={url}
                  alt={`Bukti #${item.nomor}`}
                  className="cphoto-thumb"
                  onClick={() => onPreviewPhoto(url)}
                  title="Klik untuk melihat foto besar"
                />
                {!isReadOnly && (
                  <button
                    type="button"
                    className="cphoto-delete-btn"
                    onClick={() => onFotoRemove(idx)}
                    title="Hapus foto"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {!isReadOnly && (item.wajibFoto || hasPhotos) && (
          <button
            type="button"
            className={cn('btn-citem-upload', jawaban?.isUploading && 'uploading')}
            onClick={onOpenFileDialog}
            disabled={jawaban?.isUploading}
            title="Unggah foto dokumentasi bukti acara"
          >
            {jawaban?.isUploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Camera size={12} />
            )}
            <span className="upload-btn-text">{hasPhotos ? '+ Foto' : 'Unggah Foto'}</span>
          </button>
        )}

        {/* Note Toggle Button (when no note exists yet) */}
        {!isReadOnly && !hasNote && !showNoteInput && (
          <button
            type="button"
            className="btn-citem-note"
            onClick={() => setShowNoteInput(true)}
            title="Tambah keterangan khusus"
          >
            <MessageSquare size={11} />
            <span>+ Catatan</span>
          </button>
        )}
      </div>

    </div>
  )
}

// ------------------------------------------------------------------
// High-Density Responsive Scoped CSS Styles
// ------------------------------------------------------------------
const checklistStyles = `
  .checklist-page {
    max-width: 980px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 5rem;
  }

  /* Top Navigation Bar */
  .checklist-topbar {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.5rem 0;
  }
  .checklist-topbar-info {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
  .checklist-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  /* Executive Approval Banner (ACC Bar) */
  .acc-executive-banner {
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
    border-radius: var(--radius-md);
    transition: all var(--transition-normal);
  }
  .acc-approved {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.35);
  }
  .acc-pending {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.35);
  }
  .acc-normal {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
  }
  .acc-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 260px;
  }
  .acc-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .acc-icon-approved { color: var(--status-green); }
  .acc-icon-pending  { color: #60a5fa; }
  .acc-icon-draft    { color: var(--gold-400); }

  .acc-texts {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .acc-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .acc-headline {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .acc-subtext {
    font-size: 0.775rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }
  .acc-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .acc-btn-approve {
    background: #059669 !important;
    border-color: #047857 !important;
    color: white !important;
    font-weight: 600;
  }
  .acc-btn-approve:hover {
    background: #047857 !important;
  }
  .acc-btn-revisi {
    color: var(--status-red) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
  }
  .acc-btn-revisi:hover {
    background: rgba(239, 68, 68, 0.1) !important;
  }

  /* Kegiatan Info Header Card */
  .kegiatan-info-card {
    padding: 0.85rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .kegiatan-info-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .kegiatan-info-sep { opacity: 0.4; }
  .kegiatan-info-jenis {
    color: var(--gold-400);
    font-weight: 600;
  }
  .kegiatan-info-nama {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  .kegiatan-info-tgl {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Compact KPI Bar */
  .kpi-compact-bar {
    padding: 0.75rem 1.25rem;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
  }
  @media (max-width: 640px) {
    .kpi-compact-bar {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .kpi-divider { display: none; }
  }
  .kpi-metric {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .kpi-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
    color: var(--text-muted);
  }
  .kpi-val-row {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }
  .kpi-number {
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.2;
  }
  .kpi-pct {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .kpi-sub-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .kpi-caption {
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .kpi-status-text {
    font-size: 0.95rem;
    font-weight: 700;
  }
  .text-green { color: var(--status-green); }
  .text-blue  { color: #60a5fa; }
  .text-yellow{ color: var(--status-yellow); }

  .kpi-bar-track {
    height: 4px;
    background: var(--surface-muted);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 0.25rem;
  }
  .kpi-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  .kpi-divider {
    width: 1px;
    height: 38px;
    background: var(--border-subtle);
  }

  /* Validation Errors */
  .validation-errors {
    padding: 0.75rem 1rem;
    background: var(--status-red-bg);
    border: 1px solid var(--status-red-border);
    border-radius: var(--radius-sm);
    color: var(--status-red);
    font-size: 0.775rem;
  }
  .validation-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }
  .validation-list {
    margin: 0;
    padding-left: 1.25rem;
  }

  /* Checklist Groups */
  .checklist-groups {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .checklist-group {
    overflow: hidden;
    padding: 0;
  }
  .group-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--surface-subtle);
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }
  .group-header:hover {
    background: var(--surface-muted);
  }
  .group-header-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .group-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .group-pill {
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 99px;
  }
  .pill-done {
    background: var(--status-green-bg);
    color: var(--status-green);
    border: 1px solid var(--status-green-border);
  }
  .pill-pending {
    background: var(--surface-muted);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  /* Group Items List */
  .group-items-list {
    display: flex;
    flex-direction: column;
  }

  /* COMPACT ITEM ROW (High Density & Mobile Responsive) */
  .compact-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--border-subtle);
    gap: 0.75rem;
    min-height: 48px;
    transition: background var(--transition-fast);
  }
  .compact-item-row:last-child {
    border-bottom: none;
  }
  .compact-item-row:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  .row-checked {
    background: rgba(16, 185, 129, 0.02);
  }
  .row-error {
    background: rgba(239, 68, 68, 0.04);
    border-color: var(--status-red-border);
  }

  /* Top Section: Checkbox + Number + Label & Tags */
  .citem-top-section {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    flex: 1;
    min-width: 0;
  }

  .citem-col-check {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-shrink: 0;
    padding-top: 2px;
  }
  .citem-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--gold-500);
    border-radius: 4px;
    margin: 0;
  }
  .citem-number {
    font-size: 0.725rem;
    color: var(--text-muted);
    font-weight: 600;
    min-width: 22px;
  }

  .citem-col-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .citem-title-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .citem-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    line-height: 1.35;
    word-break: break-word;
  }
  .label-checked {
    color: var(--text-primary);
  }
  .citem-tags {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
    flex-shrink: 0;
  }
  .citem-tag {
    font-size: 0.625rem;
    padding: 0.12rem 0.4rem;
    border-radius: var(--radius-xs);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
    line-height: 1.2;
  }
  .tag-wajib {
    background: var(--gold-subtle);
    color: var(--gold-500);
    border: 1px solid var(--border-accent);
  }
  .tag-opsional {
    background: var(--surface-muted);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }
  .tag-foto {
    background: rgba(96, 165, 250, 0.12);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .citem-note-display {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--surface-muted);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-xs);
    border-left: 2px solid var(--gold-400);
    max-width: 100%;
  }
  .citem-note-text {
    font-size: 0.725rem;
    font-style: italic;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn-icon-subtle {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }
  .btn-icon-subtle:hover { color: var(--gold-400); }

  .citem-note-edit {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.2rem;
    width: 100%;
  }
  .citem-inline-input {
    flex: 1;
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
    border-radius: var(--radius-xs);
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    color: var(--text-primary);
  }

  /* Col Actions */
  .citem-col-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .citem-photo-strip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .cphoto-thumb-wrap {
    position: relative;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-xs);
    overflow: hidden;
    border: 1px solid var(--border-distinct);
    cursor: pointer;
  }
  .cphoto-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cphoto-delete-btn {
    position: absolute;
    top: 1px;
    right: 1px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .btn-citem-upload {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: var(--radius-xs);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }
  .btn-citem-upload:hover {
    border-color: #60a5fa;
    color: #60a5fa;
    background: rgba(96, 165, 250, 0.08);
  }
  .btn-citem-note {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    cursor: pointer;
    padding: 0.3rem 0.55rem;
    border-radius: var(--radius-xs);
    white-space: nowrap;
    transition: all var(--transition-fast);
  }
  .btn-citem-note:hover {
    color: var(--text-secondary);
    border-color: var(--border-distinct);
  }

  /* Catatan Section */
  .catatan-section {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  /* Consolidated Bottom Action Center (CTA Panel) */
  .checklist-bottom-panel {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    margin-top: 0.5rem;
  }
  .bottom-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 1rem;
  }
  .bottom-panel-summary {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-width: 260px;
  }
  .bottom-panel-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .bottom-panel-subtitle {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.45;
  }
  .bottom-panel-metrics {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .metric-chip {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-sm);
  }
  .metric-chip-label {
    font-size: 0.675rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .metric-chip-val {
    font-size: 0.85rem;
    color: var(--text-primary);
  }
  .bottom-panel-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .btn-group-left, .btn-group-admin, .btn-group-download {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .btn-download-pdf-active {
    background: #059669 !important;
    border-color: #047857 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    padding: 0.55rem 1.25rem !important;
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
  }
  .btn-download-pdf-active:hover {
    background: #047857 !important;
  }
  .btn-download-pdf-locked {
    background: var(--surface-muted) !important;
    border: 1px solid var(--border-subtle) !important;
    color: var(--text-muted) !important;
    cursor: not-allowed;
    padding: 0.55rem 1.25rem !important;
  }

  /* Feedback Toast */
  .feedback-toast {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-md);
    font-size: 0.825rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    animation: toastSlideIn 0.25s ease-out;
  }
  @keyframes toastSlideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .toast-success {
    background: #064e3b;
    color: #a7f3d0;
    border: 1px solid #059669;
  }
  .toast-info {
    background: #1e3a8a;
    color: #bfdbfe;
    border: 1px solid #2563eb;
  }
  .toast-error {
    background: #7f1d1d;
    color: #fecaca;
    border: 1px solid #dc2626;
  }

  /* Modal Minta Revisi */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .modal-content {
    width: 100%;
    max-width: 480px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }
  .modal-desc {
    font-size: 0.775rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  /* Photo Lightbox */
  .photo-lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    cursor: zoom-out;
  }
  .photo-lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }
  .lightbox-img {
    max-width: 100%;
    max-height: 85vh;
    border-radius: var(--radius-sm);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  .lightbox-close {
    position: absolute;
    top: -36px;
    right: 0;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
  }

  /* ========================================================== */
  /* MOBILE REFLOW & DEDICATED MOBILE LAYOUT (< 640px)          */
  /* ========================================================== */
  @media (max-width: 640px) {
    .checklist-page {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      gap: 0.85rem;
      padding-bottom: 6.5rem; /* Menjamin bottom nav mobile tidak menutupi aksi terbawah */
    }

    /* Top Navigation */
    .checklist-topbar {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .checklist-title {
      font-size: 1.05rem;
    }

    /* Kegiatan Info Card */
    .kegiatan-info-card {
      padding: 0.75rem 1rem;
      gap: 0.4rem;
    }
    .kegiatan-info-nama {
      font-size: 0.95rem;
      line-height: 1.35;
    }
    .kegiatan-info-row {
      flex-wrap: wrap;
      gap: 0.35rem 0.5rem;
      font-size: 0.725rem;
    }

    /* Compact KPI Bar */
    .kpi-compact-bar {
      grid-template-columns: 1fr;
      padding: 0.85rem 1rem;
      gap: 0.85rem;
    }
    .kpi-divider {
      display: none;
    }

    /* Group Header Accordion */
    .group-header {
      padding: 0.75rem 0.85rem;
    }
    .group-name {
      font-size: 0.825rem;
    }

    /* Checklist Item Mobile Card Reflow */
    .compact-item-row {
      flex-direction: column;
      align-items: stretch;
      padding: 0.75rem 0.85rem;
      gap: 0.55rem;
    }

    .citem-top-section {
      width: 100%;
      align-items: flex-start;
      gap: 0.65rem;
    }

    .citem-col-check {
      padding-top: 2px;
      gap: 0.4rem;
    }

    .citem-checkbox {
      width: 19px;
      height: 19px;
    }

    .citem-col-body {
      width: 100%;
      gap: 0.35rem;
    }

    .citem-title-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
      width: 100%;
    }

    .citem-label {
      font-size: 0.875rem;
      line-height: 1.4;
      font-weight: 600;
      color: var(--text-primary);
    }

    .citem-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    /* Action Buttons Row: Indented to align flush under item text */
    .citem-col-actions {
      width: 100%;
      padding-left: 2.15rem; /* indents past checkbox + number */
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      justify-content: flex-start;
    }

    .btn-citem-upload,
    .btn-citem-note {
      min-height: 34px;
      padding: 0.35rem 0.75rem;
      font-size: 0.725rem;
    }

    .citem-photo-strip {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    .cphoto-thumb-wrap {
      width: 44px;
      height: 44px;
    }

    .citem-note-display {
      margin-left: 2.15rem;
      max-width: calc(100% - 2.15rem);
      white-space: normal;
    }
    .citem-note-text {
      white-space: normal;
      word-break: break-word;
    }

    .citem-note-edit {
      margin-left: 2.15rem;
      width: calc(100% - 2.15rem);
      flex-wrap: wrap;
    }

    /* Bottom Action Panel on Mobile */
    .checklist-bottom-panel {
      padding: 1rem;
      gap: 1rem;
    }
    .bottom-panel-header {
      flex-direction: column;
      gap: 0.85rem;
    }
    .bottom-panel-summary {
      min-width: 0;
      width: 100%;
    }
    .bottom-panel-metrics {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .metric-chip {
      padding: 0.5rem 0.65rem;
    }
    .bottom-panel-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      width: 100%;
    }
    .btn-group-left,
    .btn-group-admin,
    .btn-group-download {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      margin-left: 0 !important;
      gap: 0.5rem;
    }
    .btn-group-left .btn,
    .btn-group-admin .btn,
    .btn-group-download .btn {
      width: 100%;
      justify-content: center;
      min-height: 44px;
      font-size: 0.825rem;
    }
  }
`
