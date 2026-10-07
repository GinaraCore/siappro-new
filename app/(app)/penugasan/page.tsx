'use client'

// ============================================================
// SIAP-Pro: Penugasan Acara & Manajemen Agenda
// Dewan Ekonomi Nasional Republik Indonesia
// Jadwal Kegiatan Resmi Kenegaraan dan Disposisi Tim
// ============================================================

import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, User2,
  CalendarDays, Pencil, Trash2, X, Check, Loader2, AlertCircle,
  Users, ChevronDown, CheckCircle2, Printer, FileText,
} from 'lucide-react'
import { useUser, useUserRole } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { UserRole, Kegiatan, StatusLaporan } from '@/types'
import {
  MOCK_USERS, MOCK_JENIS_ACARA, getTemplate,
} from '@/lib/mock-data'
import { formatTanggalLong, cn } from '@/lib/utils'
import LaporanProtokolDocument from '@/components/pdf/LaporanProtokolDocument'

// ------------------------------------------------------------------
// Indonesian Calendar Constants
// ------------------------------------------------------------------
const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

// ------------------------------------------------------------------
// Calendar Date Helper Functions
// ------------------------------------------------------------------
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface FormData {
  nama: string
  tanggal: string
  jamMulai: string
  lokasi: string
  penjabat: string
  jenisAcaraId: string
  protokolPicIds: string[]
  persidanganPicIds: string[]
  humasPicIds: string[]
}

const EMPTY_FORM: FormData = {
  nama: '', tanggal: '', jamMulai: '', lokasi: '', penjabat: '',
  jenisAcaraId: '', protokolPicIds: [], persidanganPicIds: [], humasPicIds: [],
}

function generateKegId(existingId: string | null): string {
  return existingId ?? `keg-${Date.now()}`
}

function generatePenugasanItemId(suffix: string): string {
  return `ptu-${Date.now()}-${suffix}`
}

// ------------------------------------------------------------------
// Main Penugasan Component
// ------------------------------------------------------------------
export default function PenugasanPage() {
  const user = useUser()
  const role = useUserRole()
  const { addKegiatan, updateKegiatan, softDeleteKegiatan, getKegiatanForUser } = useDataStore()
  // Baca kegiatan dan laporan dari store (reactive)
  const storeKegiatan = useDataStore(s => s.kegiatan)
  const storeLaporan = useDataStore(s => s.laporan)

  // Kabag, Kasubbag, Super Admin memiliki akses disposisi penuh
  const canManage = role ? [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(role) : false

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [pdfKegiatan, setPdfKegiatan] = useState<Kegiatan | null>(null)

  // kegiatanByDate reaktif ke storeKegiatan
  const kegiatanByDate = useMemo(() => {
    const map: Record<string, Kegiatan[]> = {}
    if (!user || !role) return map
    getKegiatanForUser(user.id, role).forEach(k => {
      if (!map[k.tanggal]) map[k.tanggal] = []
      map[k.tanggal].push(k)
    })
    return map
  }, [storeKegiatan, user, role, getKegiatanForUser])

  const selectedKegiatan = useMemo(() => {
    return (kegiatanByDate[selectedDate] ?? []).filter(k => !k.softDeleted)
  }, [kegiatanByDate, selectedDate])

  if (!user || !role) return null

  // ---- Calendar Computations ----
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // ---- Navigation ----
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // ---- Form Actions ----
  const openAdd = (date?: string) => {
    if (!canManage) return
    setForm({
      ...EMPTY_FORM,
      tanggal: date ?? selectedDate,
      jamMulai: '09:00',
      jenisAcaraId: MOCK_JENIS_ACARA[0]?.id ?? 'ja-001',
    })
    setFormErrors({})
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (keg: Kegiatan) => {
    if (!canManage) return
    const proto = keg.penugasan.find(p => p.role === UserRole.PROTOKOL)
    const sidang = keg.penugasan.find(p => p.role === UserRole.PERSIDANGAN)
    const humas = keg.penugasan.find(p => p.role === UserRole.HUMAS)
    setForm({
      nama: keg.nama,
      tanggal: keg.tanggal,
      jamMulai: keg.jamMulai,
      lokasi: keg.lokasi,
      penjabat: keg.penjabat,
      jenisAcaraId: keg.jenisAcaraId,
      protokolPicIds: proto?.picIds ?? [],
      persidanganPicIds: sidang?.picIds ?? [],
      humasPicIds: humas?.picIds ?? [],
    })
    setFormErrors({})
    setEditingId(keg.id)
    setShowForm(true)
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.nama.trim()) errs.nama = 'Nama kegiatan dinas wajib diisi.'
    if (!form.tanggal) errs.tanggal = 'Tanggal kegiatan wajib ditentukan.'
    if (!form.jamMulai) errs.jamMulai = 'Jam mulai wajib diisi.'
    if (!form.lokasi.trim()) errs.lokasi = 'Lokasi atau ruang rapat wajib diisi.'
    if (!form.penjabat.trim()) errs.penjabat = 'Nama pejabat utama yang difasilitasi wajib diisi.'
    if (!form.jenisAcaraId) errs.jenisAcaraId = 'Klasifikasi jenis kegiatan wajib dipilih.'
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) {
      showToast('Mohon lengkapi seluruh isian wajib formulir.', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    if (!validate()) return
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 400))

    const newId = generateKegId(editingId)
    const newKegiatan: Kegiatan = {
      id: newId,
      nama: form.nama,
      tanggal: form.tanggal,
      jamMulai: form.jamMulai,
      lokasi: form.lokasi,
      penjabat: form.penjabat,
      jenisAcaraId: form.jenisAcaraId,
      dibuatOleh: user.id,
      softDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      penugasan: [
        { id: generatePenugasanItemId('p'), kegiatanId: newId, role: UserRole.PROTOKOL, picIds: form.protokolPicIds },
        { id: generatePenugasanItemId('s'), kegiatanId: newId, role: UserRole.PERSIDANGAN, picIds: form.persidanganPicIds },
        { id: generatePenugasanItemId('h'), kegiatanId: newId, role: UserRole.HUMAS, picIds: form.humasPicIds },
      ],
    }

    if (editingId) {
      updateKegiatan(newKegiatan)
    } else {
      addKegiatan(newKegiatan)
    }

    // Pindah tampilan kalender ke bulan & tahun tanggal kegiatan yang baru dibuat
    if (form.tanggal) {
      const parts = form.tanggal.split('-').map(Number)
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setViewYear(parts[0])
        setViewMonth(parts[1] - 1)
      }
    }

    setShowForm(false)
    setSelectedDate(form.tanggal)
    setIsSubmitting(false)
    showToast(editingId ? 'Agenda kegiatan dinas berhasil diperbarui.' : 'Agenda kegiatan dinas berhasil dijadwalkan.', 'success')
  }

  const handleSoftDelete = (id: string) => {
    if (!canManage) return
    softDeleteKegiatan(id)
    showToast('Agenda kegiatan dinas telah dibatalkan.', 'success')
  }

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const protokolUsers = MOCK_USERS.filter(u => u.role === UserRole.PROTOKOL && u.aktif)
  const persidanganUsers = MOCK_USERS.filter(u => u.role === UserRole.PERSIDANGAN && u.aktif)
  const humasUsers = MOCK_USERS.filter(u => u.role === UserRole.HUMAS && u.aktif)

  return (
    <div className="penugasan-page">
      {/* Toast Notification */}
      {toast && (
        <div className={cn('penugasan-toast', `toast-${toast.type}`)} role="status">
          <Check size={16} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Penugasan & Jadwal Agenda</h1>

        </div>
        {canManage && (
          <button
            id="btn-tambah-penugasan"
            className="btn btn-primary"
            onClick={() => openAdd()}
          >
            <Plus size={16} />
            <span>Tambah Agenda</span>
          </button>
        )}
      </div>

      <div className="penugasan-layout">
        {/* Calendar View Panel */}
        <section className="calendar-panel card" aria-label="Kalender Agenda Protokol">
          {/* Month Navigation */}
          <div className="cal-nav">
            <button className="btn btn-ghost btn-icon" onClick={prevMonth} aria-label="Bulan sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <h2 className="cal-month-title">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth} aria-label="Bulan berikutnya">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="cal-grid-header">
            {DAY_NAMES_SHORT.map(d => (
              <span key={d} className="cal-day-name">{d}</span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="cal-grid">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toISODate(viewYear, viewMonth, day)
              const hasEvents = !!kegiatanByDate[dateStr]?.some(k => !k.softDeleted)
              const isToday = dateStr === now.toISOString().split('T')[0]
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={day}
                  className={cn(
                    'cal-cell',
                    isToday && 'cal-cell-today',
                    isSelected && 'cal-cell-selected',
                  )}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-label={`${day} ${MONTH_NAMES_ID[viewMonth]}`}
                  aria-pressed={isSelected}
                >
                  <span className="cal-day-num num-tabular">{day}</span>
                  {hasEvents && <span className="cal-dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </section>

        {/* Selected Date Agenda Listing */}
        <section className="day-events-panel" aria-labelledby="selected-date-title">
          <div className="day-events-header">
            <div>
              <h2 id="selected-date-title" className="day-events-title">
                {formatTanggalLong(selectedDate)}
              </h2>
              <p className="day-events-sub num-tabular">
                {selectedKegiatan.length === 0
                  ? 'Tidak ada agenda dinas pada tanggal ini.'
                  : `${selectedKegiatan.length} agenda dinas terdaftar`}
              </p>
            </div>
            {canManage && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openAdd(selectedDate)}
              >
                <Plus size={14} />
                <span>Agenda Baru</span>
              </button>
            )}
          </div>

          {selectedKegiatan.length === 0 ? (
            <div className="day-events-empty card">
              <CalendarDays size={36} className="empty-cal-icon" aria-hidden="true" />
              <p className="empty-cal-title">Belum ada agenda protokol yang dijadwalkan.</p>
              {canManage && (
                <button className="btn btn-ghost btn-sm" onClick={() => openAdd(selectedDate)}>
                  + Jadwalkan agenda pada tanggal ini
                </button>
              )}
            </div>
          ) : (
            <div className="day-events-list">
              {selectedKegiatan.map(keg => (
                <KegiatanCard
                  key={keg.id}
                  kegiatan={keg}
                  canManage={canManage}
                  onEdit={() => openEdit(keg)}
                  onDelete={() => handleSoftDelete(keg.id)}
                  onViewPdf={() => setPdfKegiatan(keg)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal Drawer: Tambah & Edit Agenda */}
      {showForm && (
        <div className="drawer-overlay" onClick={() => setShowForm(false)}>
          <div
            className="drawer"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="drawer-header">
              <h2 id="form-title" className="drawer-title">
                {editingId ? 'Sunting Agenda Kedinasan' : 'Jadwalkan Agenda Kedinasan Baru'}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowForm(false)}
                aria-label="Tutup form dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="drawer-form" noValidate>
              <div className="form-grid">
                {/* Nama Agenda */}
                <div className="form-group form-full">
                  <label htmlFor="f-nama" className="form-label">Nama Agenda / Kegiatan</label>
                  <input
                    id="f-nama"
                    type="text"
                    className={cn('form-input', formErrors.nama && 'error')}
                    placeholder="Contoh: Sidang Pleno Kebijakan Fiskal DEN RI"
                    value={form.nama}
                    onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  />
                  {formErrors.nama && <span className="form-error"><AlertCircle size={12} />{formErrors.nama}</span>}
                </div>

                {/* Tanggal */}
                <div className="form-group">
                  <label htmlFor="f-tanggal" className="form-label">Tanggal Pelaksanaan</label>
                  <input
                    id="f-tanggal"
                    type="date"
                    className={cn('form-input', formErrors.tanggal && 'error')}
                    value={form.tanggal}
                    onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                  />
                  {formErrors.tanggal && <span className="form-error"><AlertCircle size={12} />{formErrors.tanggal}</span>}
                </div>

                {/* Jam */}
                <div className="form-group">
                  <label htmlFor="f-jam" className="form-label">Waktu Mulai (WIB)</label>
                  <input
                    id="f-jam"
                    type="time"
                    className={cn('form-input', formErrors.jamMulai && 'error')}
                    value={form.jamMulai}
                    onChange={e => setForm(f => ({ ...f, jamMulai: e.target.value }))}
                  />
                  {formErrors.jamMulai && <span className="form-error"><AlertCircle size={12} />{formErrors.jamMulai}</span>}
                </div>

                {/* Lokasi */}
                <div className="form-group form-full">
                  <label htmlFor="f-lokasi" className="form-label">Lokasi / Ruang Sidang</label>
                  <input
                    id="f-lokasi"
                    type="text"
                    className={cn('form-input', formErrors.lokasi && 'error')}
                    placeholder="Contoh: Ruang Sidang Utama DEN RI, Lantai 4"
                    value={form.lokasi}
                    onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                  />
                  {formErrors.lokasi && <span className="form-error"><AlertCircle size={12} />{formErrors.lokasi}</span>}
                </div>

                {/* Penjabat */}
                <div className="form-group form-full">
                  <label htmlFor="f-penjabat" className="form-label">Pejabat Utama / VVIP yang Didampingi</label>
                  <input
                    id="f-penjabat"
                    type="text"
                    className={cn('form-input', formErrors.penjabat && 'error')}
                    placeholder="Contoh: Ketua Dewan Ekonomi Nasional RI / Menko Perekonomian"
                    value={form.penjabat}
                    onChange={e => setForm(f => ({ ...f, penjabat: e.target.value }))}
                  />
                  {formErrors.penjabat && <span className="form-error"><AlertCircle size={12} />{formErrors.penjabat}</span>}
                </div>

                {/* Jenis Acara */}
                <div className="form-group form-full">
                  <label htmlFor="f-jenis" className="form-label">Klasifikasi Kegiatan</label>
                  <div className="select-wrapper">
                    <select
                      id="f-jenis"
                      className={cn('form-select', formErrors.jenisAcaraId && 'error')}
                      value={form.jenisAcaraId}
                      onChange={e => setForm(f => ({ ...f, jenisAcaraId: e.target.value }))}
                    >
                      <option value="">Pilih Kategori Acara</option>
                      {MOCK_JENIS_ACARA.filter(j => j.aktif).map(j => (
                        <option key={j.id} value={j.id}>{j.nama}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="select-icon" aria-hidden="true" />
                  </div>
                  {formErrors.jenisAcaraId && <span className="form-error"><AlertCircle size={12} />{formErrors.jenisAcaraId}</span>}
                </div>

                {/* Delegasi Tim */}
                <div className="form-group form-full">
                  <span className="form-label">Disposisi Personel Tim Kerja</span>
                  <p className="form-hint" style={{ marginBottom: '0.65rem' }}>
                    Pilih aparatur protokol, notulis persidangan, dan humas yang bertugas.
                  </p>

                  <MultiPicSelect
                    label="Petugas Protokol Lapangan"
                    color="var(--gold-400)"
                    users={protokolUsers}
                    selectedIds={form.protokolPicIds}
                    onChange={ids => setForm(f => ({ ...f, protokolPicIds: ids }))}
                  />
                  <MultiPicSelect
                    label="Petugas Risalah & Persidangan"
                    color="#60a5fa"
                    users={persidanganUsers}
                    selectedIds={form.persidanganPicIds}
                    onChange={ids => setForm(f => ({ ...f, persidanganPicIds: ids }))}
                  />
                  <MultiPicSelect
                    label="Petugas Liputan & Media Humas"
                    color="#c084fc"
                    users={humasUsers}
                    selectedIds={form.humasPicIds}
                    onChange={ids => setForm(f => ({ ...f, humasPicIds: ids }))}
                  />
                </div>
              </div>

              <div className="drawer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Batalkan
                </button>
                <button
                  id="btn-simpan-penugasan"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan Disposisi...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Simpan & Terbitkan Jadwal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official PDF Document Modal Preview from Penugasan */}
      {pdfKegiatan && (() => {
        const lap = storeLaporan.find(l => l.kegiatanId === pdfKegiatan.id && l.status === StatusLaporan.DISETUJUI) ||
          storeLaporan.find(l => l.kegiatanId === pdfKegiatan.id)
        const tpl = getTemplate(pdfKegiatan.jenisAcaraId)
        const jwbMap: Record<string, { dicentang: boolean; keterangan: string; fotoUrls: string[] }> = {}
        lap?.jawaban?.forEach(j => {
          jwbMap[j.itemChecklistId] = {
            dicentang: j.dicentang,
            keterangan: j.keterangan,
            fotoUrls: [],
          }
        })

        return (
          <LaporanProtokolDocument
            kegiatan={pdfKegiatan}
            items={tpl?.items || []}
            jawabanMap={jwbMap}
            catatanPenutup={lap?.catatanPenutup || 'Seluruh instrumen verifikasi kegiatan telah dipenuhi dan disetujui.'}
            pembuatNama="Petugas Protokol DEN"
            onClose={() => setPdfKegiatan(null)}
          />
        )
      })()}

      <style>{penugasanStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Multi-Select Personel Component
// ------------------------------------------------------------------
function MultiPicSelect({
  label, color, users, selectedIds, onChange,
}: {
  label: string
  color: string
  users: typeof MOCK_USERS
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const toggle = (id: string) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id])
  }

  return (
    <div className="pic-group">
      <div className="pic-group-label">
        <Users size={13} style={{ color }} aria-hidden="true" />
        <span>{label}</span>
        {selectedIds.length > 0 && (
          <span className="pic-count num-tabular">{selectedIds.length} personil dipilih</span>
        )}
      </div>
      <div className="pic-chips">
        {users.map(u => {
          const isSelected = selectedIds.includes(u.id)
          return (
            <button
              key={u.id}
              type="button"
              className={cn('pic-chip', isSelected && 'pic-chip-selected')}
              onClick={() => toggle(u.id)}
              style={isSelected ? { borderColor: color, color } : {}}
            >
              {isSelected && <Check size={11} aria-hidden="true" />}
              <span>{u.nama}</span>
            </button>
          )
        })}
        {users.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Belum ada personil terdaftar pada unit ini.
          </span>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Kegiatan Card Component
// ------------------------------------------------------------------
function KegiatanCard({
  kegiatan, onEdit, onDelete, onViewPdf, canManage = true,
}: {
  kegiatan: Kegiatan
  onEdit: () => void
  onDelete: () => void
  onViewPdf?: () => void
  canManage?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const storeLaporan = useDataStore(s => s.laporan)
  const isDone = storeLaporan.some(l => l.kegiatanId === kegiatan.id && l.status === StatusLaporan.DISETUJUI)
  const jenis = MOCK_JENIS_ACARA.find(j => j.id === kegiatan.jenisAcaraId)

  return (
    <article className="kegiatan-card card">
      <div className="kegiatan-card-header">
        <div className="kegiatan-jam num-tabular">
          <Clock size={13} aria-hidden="true" />
          <span>{kegiatan.jamMulai} WIB</span>
        </div>
        <span className="kegiatan-jenis-badge">{jenis?.nama ?? 'Acara'}</span>
        {isDone && (
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} />
            <span>Selesai</span>
          </span>
        )}
        <div className="kegiatan-actions">
          {isDone && onViewPdf && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onViewPdf}
              style={{ color: 'var(--status-green)', borderColor: 'rgba(16, 185, 129, 0.4)', gap: '0.35rem' }}
              title="Unduh Berita Acara & Dokumen PDF Laporan"
            >
              <Printer size={13} />
              <span>Unduh PDF</span>
            </button>
          )}
          {canManage && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onEdit}
                aria-label="Sunting agenda dinas"
                title="Sunting data"
              >
                <Pencil size={13} />
                <span>Sunting</span>
              </button>
              {confirmDelete ? (
                <div className="kegiatan-confirm-row">
                  <button className="btn btn-danger btn-sm" onClick={onDelete}>
                    Konfirmasi Batal
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
                    Kembali
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm text-red"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Batalkan agenda"
                  title="Batalkan agenda"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <h3 className="kegiatan-nama">{kegiatan.nama}</h3>

      <div className="kegiatan-meta">
        <div className="kegiatan-meta-item">
          <MapPin size={13} aria-hidden="true" />
          <span>{kegiatan.lokasi}</span>
        </div>
        <div className="kegiatan-meta-item">
          <User2 size={13} aria-hidden="true" />
          <span>Pejabat: <strong>{kegiatan.penjabat}</strong></span>
        </div>
      </div>

      {/* Disposed Officer Chips */}
      <div className="kegiatan-pic-row">
        {kegiatan.penugasan.map(p => {
          const roleLabels: Record<string, string> = {
            [UserRole.PROTOKOL]: 'Protokol',
            [UserRole.PERSIDANGAN]: 'Sidang',
            [UserRole.HUMAS]: 'Humas',
          }
          const pics = MOCK_USERS.filter(u => p.picIds.includes(u.id))
          if (pics.length === 0) return null
          return (
            <div key={p.id} className="kegiatan-pic-group">
              <span className="kegiatan-pic-role">{roleLabels[p.role]}:</span>
              {pics.map(u => (
                <span key={u.id} className="kegiatan-pic-name">
                  {u.nama.split(' ')[0]}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </article>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive State Protocol Standard
// ------------------------------------------------------------------
const penugasanStyles = `
  .penugasan-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1100px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
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

  /* Toast Notification */
  .penugasan-toast {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.825rem;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    max-width: 340px;
  }
  .toast-success {
    background: var(--status-green-bg);
    color: var(--status-green);
    border: 1px solid var(--status-green-border);
  }
  .toast-error {
    background: var(--status-red-bg);
    color: var(--status-red);
    border: 1px solid var(--status-red-border);
  }

  /* Layout */
  .penugasan-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  @media (min-width: 960px) {
    .penugasan-layout {
      grid-template-columns: 360px 1fr;
    }
  }

  /* Calendar */
  .calendar-panel {
    padding: 1.15rem;
    height: fit-content;
  }
  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }
  .cal-month-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cal-grid-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 0.35rem;
  }
  .cal-day-name {
    text-align: center;
    font-size: 0.65rem;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: 0.2rem 0;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }
  .cal-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    position: relative;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
    gap: 2px;
  }
  .cal-cell:not(.cal-cell-empty):hover {
    background: var(--surface-muted);
    border-color: var(--border-distinct);
  }
  .cal-cell-empty { cursor: default; }

  .cal-cell-today {
    border-color: var(--border-distinct);
  }
  .cal-cell-today .cal-day-num {
    color: var(--gold-400);
    font-weight: 700;
  }
  .cal-cell-selected {
    background: var(--gold-subtle) !important;
    border-color: var(--gold-500) !important;
  }
  .cal-cell-selected .cal-day-num {
    color: var(--gold-400);
    font-weight: 700;
  }

  .cal-day-num {
    font-size: 0.825rem;
    color: var(--text-secondary);
    line-height: 1;
  }
  .cal-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--gold-500);
    flex-shrink: 0;
  }

  /* Day Events Panel */
  .day-events-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .day-events-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }
  .day-events-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .day-events-sub {
    font-size: 0.775rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }

  .day-events-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
  .empty-cal-icon {
    color: var(--text-muted);
    opacity: 0.4;
  }
  .empty-cal-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .day-events-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Kegiatan Card */
  .kegiatan-card {
    padding: 1rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .kegiatan-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .kegiatan-jam {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: var(--gold-400);
    font-weight: 600;
  }
  .kegiatan-jenis-badge {
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }
  .kegiatan-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
  }
  .kegiatan-confirm-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .kegiatan-nama {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.35;
  }
  .kegiatan-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.25rem;
  }
  .kegiatan-meta-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.775rem;
    color: var(--text-muted);
  }
  .kegiatan-meta-item strong {
    color: var(--text-secondary);
  }
  .kegiatan-pic-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }
  .kegiatan-pic-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .kegiatan-pic-role {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--gold-500);
  }
  .kegiatan-pic-name {
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
  }

  /* Drawer Modal */
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
    max-width: 620px;
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

  /* Form Layout */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }
  .form-full {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Select */
  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .form-select {
    padding-right: 2.25rem !important;
    cursor: pointer;
  }
  .select-icon {
    position: absolute;
    right: 0.875rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  /* PIC Group */
  .pic-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.65rem;
    background: var(--surface-canvas);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.65rem 0.75rem;
  }
  .pic-group-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.775rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .pic-count {
    margin-left: auto;
    font-size: 0.675rem;
    color: var(--gold-500);
  }
  .pic-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .pic-chip {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-xs);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .pic-chip:hover {
    border-color: var(--border-strong);
    color: var(--text-primary);
  }
  .pic-chip-selected {
    background: var(--gold-subtle);
    font-weight: 600;
  }
`
