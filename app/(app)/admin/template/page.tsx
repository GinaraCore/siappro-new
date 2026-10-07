'use client'

// ============================================================
// SIAP-Pro: Manajemen Template Checklist Protokoler
// Dewan Ekonomi Nasional Republik Indonesia
// Super Admin Template Management for Events & Checklists
// ============================================================

import { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  Check,
  X,
  Search,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { MOCK_JENIS_ACARA } from '@/lib/mock-data'
import { JenisAcara, ItemChecklist } from '@/types'
import { cn } from '@/lib/utils'

export default function AdminTemplatePage() {
  const [jenisAcaraList, setJenisAcaraList] = useState<JenisAcara[]>(MOCK_JENIS_ACARA)
  const [selectedJaId, setSelectedJaId] = useState<string>(MOCK_JENIS_ACARA[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')

  // Toast State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Modals State
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemChecklist | null>(null)
  const [itemForm, setItemForm] = useState({
    kelompok: '',
    teks: '',
    wajib: true,
    wajibFoto: false,
    aktif: true,
  })

  const [showJaModal, setShowJaModal] = useState(false)
  const [jaForm, setJaForm] = useState({ nama: '', aktif: true })

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Current active Jenis Acara
  const currentJa = jenisAcaraList.find(ja => ja.id === selectedJaId) || jenisAcaraList[0]

  // Current active Template
  const currentTemplate = currentJa?.templates[0]
  const currentItems = currentTemplate?.items || []

  // Filter items by search
  const filteredItems = currentItems.filter(item => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.teks.toLowerCase().includes(q) || item.kelompok.toLowerCase().includes(q)
  })

  // Group items by kelompok
  const groups = Array.from(new Set(filteredItems.map(item => item.kelompok)))

  // Existing kelompok suggestions for the current template
  const existingKelompokOptions = Array.from(new Set(currentItems.map(item => item.kelompok)))

  // KPI Metrics
  const totalItems = currentItems.length
  const totalWajib = currentItems.filter(i => i.wajib && i.aktif).length
  const totalFoto = currentItems.filter(i => i.wajibFoto && i.aktif).length
  const totalNonaktif = currentItems.filter(i => !i.aktif).length

  // Handlers
  const handleOpenAddItem = (kelompokDefault?: string) => {
    setEditingItem(null)
    setItemForm({
      kelompok: kelompokDefault || (existingKelompokOptions[0] || 'Protokol Tempat Acara'),
      teks: '',
      wajib: true,
      wajibFoto: false,
      aktif: true,
    })
    setShowItemModal(true)
  }

  const handleOpenEditItem = (item: ItemChecklist) => {
    setEditingItem(item)
    setItemForm({
      kelompok: item.kelompok,
      teks: item.teks,
      wajib: item.wajib,
      wajibFoto: item.wajibFoto,
      aktif: item.aktif,
    })
    setShowItemModal(true)
  }

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.teks.trim() || !itemForm.kelompok.trim()) {
      showToast('Kelompok dan teks butir checklist wajib diisi.', 'error')
      return
    }

    if (editingItem) {
      // Edit existing item
      setJenisAcaraList(prev =>
        prev.map(ja => {
          if (ja.id !== currentJa.id) return ja
          return {
            ...ja,
            templates: ja.templates.map((tpl, idx) => {
              if (idx !== 0) return tpl
              return {
                ...tpl,
                items: tpl.items.map(itm => {
                  if (itm.id !== editingItem.id) return itm
                  return {
                    ...itm,
                    kelompok: itemForm.kelompok.trim(),
                    teks: itemForm.teks.trim(),
                    wajib: itemForm.wajib,
                    wajibFoto: itemForm.wajibFoto,
                    aktif: itemForm.aktif,
                  }
                }),
              }
            }),
          }
        })
      )
      showToast('Butir checklist berhasil diperbarui.')
    } else {
      // Add new item
      const newItem: ItemChecklist = {
        id: `itm-custom-${Date.now()}`,
        templateChecklistId: currentTemplate?.id || `tpl-${Date.now()}`,
        kelompok: itemForm.kelompok.trim(),
        nomor: currentItems.length + 1,
        teks: itemForm.teks.trim(),
        wajib: itemForm.wajib,
        wajibFoto: itemForm.wajibFoto,
        urutan: currentItems.length + 1,
        aktif: itemForm.aktif,
      }

      setJenisAcaraList(prev =>
        prev.map(ja => {
          if (ja.id !== currentJa.id) return ja
          if (ja.templates.length === 0) {
            return {
              ...ja,
              templates: [
                {
                  id: `tpl-${Date.now()}`,
                  jenisAcaraId: ja.id,
                  items: [newItem],
                },
              ],
            }
          }
          return {
            ...ja,
            templates: ja.templates.map((tpl, idx) => {
              if (idx !== 0) return tpl
              return {
                ...tpl,
                items: [...tpl.items, newItem],
              }
            }),
          }
        })
      )
      showToast('Butir checklist baru berhasil ditambahkan.')
    }

    setShowItemModal(false)
  }

  const handleToggleItemStatus = (itemId: string) => {
    setJenisAcaraList(prev =>
      prev.map(ja => {
        if (ja.id !== currentJa.id) return ja
        return {
          ...ja,
          templates: ja.templates.map((tpl, idx) => {
            if (idx !== 0) return tpl
            return {
              ...tpl,
              items: tpl.items.map(itm => (itm.id === itemId ? { ...itm, aktif: !itm.aktif } : itm)),
            }
          }),
        }
      })
    )
    showToast('Status butir checklist berhasil diubah.')
  }

  const handleDeleteItem = (itemId: string) => {
    setJenisAcaraList(prev =>
      prev.map(ja => {
        if (ja.id !== currentJa.id) return ja
        return {
          ...ja,
          templates: ja.templates.map((tpl, idx) => {
            if (idx !== 0) return tpl
            return {
              ...tpl,
              items: tpl.items.filter(itm => itm.id !== itemId),
            }
          }),
        }
      })
    )
    setDeleteConfirmId(null)
    showToast('Butir checklist berhasil dihapus.')
  }

  const handleSaveJenisAcara = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jaForm.nama.trim()) {
      showToast('Nama jenis acara wajib diisi.', 'error')
      return
    }

    const newJa: JenisAcara = {
      id: `ja-custom-${Date.now()}`,
      nama: jaForm.nama.trim(),
      aktif: jaForm.aktif,
      createdAt: new Date().toISOString(),
      templates: [
        {
          id: `tpl-${Date.now()}`,
          jenisAcaraId: `ja-custom-${Date.now()}`,
          items: [],
        },
      ],
    }

    setJenisAcaraList(prev => [...prev, newJa])
    setSelectedJaId(newJa.id)
    setShowJaModal(false)
    setJaForm({ nama: '', aktif: true })
    showToast(`Jenis acara "${newJa.nama}" berhasil dibuat.`)
  }

  return (
    <div className="template-page">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={cn('template-toast', toastMsg.type === 'error' ? 'toast-error' : 'toast-success')}>
          {toastMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="page-header">
        <div className="header-meta">
          <div className="header-tag">Dewan Ekonomi Nasional Republik Indonesia</div>
          <h1 className="header-title">Kelola Template Checklist</h1>
          <p className="header-desc">
            Konfigurasi butir verifikasi dan instrumen keprotokoleran per jenis agenda resmi negara.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setJaForm({ nama: '', aktif: true })
              setShowJaModal(true)
            }}
          >
            <Plus size={15} />
            Tambah Jenis Acara
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleOpenAddItem()}>
            <Plus size={15} />
            Tambah Butir Checklist
          </button>
        </div>
      </header>

      {/* Snapshot Safety Callout */}
      <div className="snapshot-notice">
        <div className="notice-icon">
          <ShieldCheck size={18} />
        </div>
        <div className="notice-content">
          <strong className="notice-title">Integritas Data Protokoler Terjamin</strong>
          <p className="notice-text">
            Perubahan pada butir template bersifat modular dan hanya diterapkan untuk penugasan kegiatan yang dibuat
            setelahnya. Laporan kegiatan berjalan atau yang telah diverifikasi tetap menggunakan salinan template
            historis saat agenda dibuat.
          </p>
        </div>
      </div>

      {/* Jenis Acara Selector */}
      <section className="ja-selector-section">
        <div className="section-label">Pilih Jenis Acara:</div>
        <div className="ja-tabs">
          {jenisAcaraList.map(ja => {
            const isSelected = ja.id === currentJa?.id
            const itemCount = ja.templates.reduce((acc, t) => acc + t.items.length, 0)
            return (
              <button
                key={ja.id}
                type="button"
                className={cn('ja-tab-btn', isSelected && 'ja-tab-active')}
                onClick={() => setSelectedJaId(ja.id)}
              >
                <span className="ja-tab-name">{ja.nama}</span>
                <span className="ja-tab-badge">{itemCount} butir</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="controls-bar">
        {/* Search Input */}
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari butir checklist atau kelompok..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="kpi-strip">
        <div className="kpi-item">
          <span className="kpi-value">{totalItems}</span>
          <span className="kpi-label">Total Butir</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item">
          <span className="kpi-value kpi-gold">{totalWajib}</span>
          <span className="kpi-label">Wajib Terpenuhi</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item">
          <span className="kpi-value kpi-blue">{totalFoto}</span>
          <span className="kpi-label">Bukti Foto</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item">
          <span className="kpi-value">{groups.length}</span>
          <span className="kpi-label">Kelompok Divisi</span>
        </div>
        {totalNonaktif > 0 && (
          <>
            <div className="kpi-divider" />
            <div className="kpi-item">
              <span className="kpi-value kpi-muted">{totalNonaktif}</span>
              <span className="kpi-label">Nonaktif</span>
            </div>
          </>
        )}
      </div>

      {/* Checklist Groups Content */}
      <main className="template-content">
        {groups.length === 0 ? (
          <div className="empty-state card">
            <Info size={32} className="empty-icon" />
            <h3 className="empty-title">Belum ada butir checklist</h3>
            <p className="empty-desc">
              {searchQuery
                ? `Tidak ditemukan butir checklist dengan kata kunci "${searchQuery}".`
                : `Belum ada butir checklist untuk ${currentJa?.nama}.`}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => handleOpenAddItem()}>
              <Plus size={15} />
              Tambah Butir Pertama
            </button>
          </div>
        ) : (
          groups.map(kelompokName => {
            const itemsInGroup = filteredItems.filter(i => i.kelompok === kelompokName)
            return (
              <div key={kelompokName} className="group-card card">
                {/* Group Header */}
                <div className="group-header">
                  <div className="group-title-row">
                    <Layers size={16} className="group-icon" />
                    <h3 className="group-name">{kelompokName}</h3>
                    <span className="group-badge">{itemsInGroup.length} butir</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleOpenAddItem(kelompokName)}
                  >
                    <Plus size={14} />
                    Tambah ke Kelompok
                  </button>
                </div>

                {/* Items List */}
                <div className="items-table">
                  {itemsInGroup.map((item, idx) => (
                    <div key={item.id} className={cn('item-row', !item.aktif && 'item-row-inactive')}>
                      <div className="item-order">{idx + 1}</div>

                      <div className="item-main">
                        <span className="item-text">{item.teks}</span>
                        <div className="item-tags">
                          {item.wajib ? (
                            <span className="tag tag-wajib">Wajib</span>
                          ) : (
                            <span className="tag tag-opsional">Opsional</span>
                          )}
                          {item.wajibFoto && (
                            <span className="tag tag-foto">
                              <Camera size={11} />
                              Wajib Bukti Foto
                            </span>
                          )}
                          {!item.aktif && <span className="tag tag-inactive">Nonaktif</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="item-actions">
                        <button
                          type="button"
                          className={cn('action-toggle-btn', item.aktif ? 'toggle-active' : 'toggle-inactive')}
                          title={item.aktif ? 'Nonaktifkan butir' : 'Aktifkan butir'}
                          onClick={() => handleToggleItemStatus(item.id)}
                        >
                          {item.aktif ? <Check size={13} /> : <X size={13} />}
                          <span>{item.aktif ? 'Aktif' : 'Nonaktif'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          title="Ubah butir"
                          onClick={() => handleOpenEditItem(item)}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon btn-icon-danger"
                          title="Hapus butir"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>

      {/* Modal: Tambah / Edit Butir Checklist */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingItem ? 'Ubah Butir Checklist' : 'Tambah Butir Checklist Baru'}
                </h3>
                <p className="modal-sub">
                  {currentJa?.nama}
                </p>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowItemModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  Kelompok Divisi / Kategori <span className="label-req">*</span>
                </label>
                <input
                  type="text"
                  list="kelompok-options"
                  className="form-input"
                  placeholder="Contoh: Protokol Tempat Acara, Perangkat AV"
                  value={itemForm.kelompok}
                  onChange={e => setItemForm({ ...itemForm, kelompok: e.target.value })}
                  required
                />
                <datalist id="kelompok-options">
                  {existingKelompokOptions.map(opt => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
                <span className="form-hint">Pilih kategori yang tersedia atau ketik kategori baru.</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Deskripsi Butir Verifikasi <span className="label-req">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Contoh: Meja pimpinan dan kursi delegasi ditata sesuai tata tempat resmi."
                  value={itemForm.teks}
                  onChange={e => setItemForm({ ...itemForm, teks: e.target.value })}
                  required
                />
              </div>

              <div className="checkbox-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={itemForm.wajib}
                    onChange={e => setItemForm({ ...itemForm, wajib: e.target.checked })}
                  />
                  <div>
                    <span className="checkbox-title">Butir Wajib Terpenuhi (Mandatory)</span>
                    <span className="checkbox-desc">
                      Laporan checklist tidak dapat disahkan sebelum butir ini terverifikasi dan dicentang oleh petugas.
                    </span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={itemForm.wajibFoto}
                    onChange={e => setItemForm({ ...itemForm, wajibFoto: e.target.checked })}
                  />
                  <div>
                    <span className="checkbox-title">Wajib Lampirkan Bukti Foto</span>
                    <span className="checkbox-desc">
                      Petugas lapangan harus mengunggah foto evidence kamera atau galeri untuk item ini.
                    </span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={itemForm.aktif}
                    onChange={e => setItemForm({ ...itemForm, aktif: e.target.checked })}
                  />
                  <div>
                    <span className="checkbox-title">Status Butir Aktif</span>
                    <span className="checkbox-desc">
                      Jika dinonaktifkan, butir ini tidak akan muncul pada penugasan kegiatan baru.
                    </span>
                  </div>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Butir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Jenis Acara Baru */}
      {showJaModal && (
        <div className="modal-overlay" onClick={() => setShowJaModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Tambah Jenis Acara Baru</h3>
                <p className="modal-sub">Buat kategori kegiatan resmi protokol Dewan Ekonomi Nasional.</p>
              </div>
              <button type="button" className="btn-close" onClick={() => setShowJaModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveJenisAcara} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  Nama Jenis Acara <span className="label-req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kunjungan Kerja Daerah, Audiensi Pejabat Tinggi"
                  value={jaForm.nama}
                  onChange={e => setJaForm({ ...jaForm, nama: e.target.value })}
                  required
                />
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={jaForm.aktif}
                  onChange={e => setJaForm({ ...jaForm, aktif: e.target.checked })}
                />
                <div>
                  <span className="checkbox-title">Aktifkan Segera</span>
                  <span className="checkbox-desc">Jenis acara langsung dapat dipilih saat membuat penugasan baru.</span>
                </div>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJaModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Jenis Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Butir */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-dialog modal-dialog-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hapus Butir Checklist</h3>
              <button type="button" className="btn-close" onClick={() => setDeleteConfirmId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-p">
              Apakah Anda yakin ingin menghapus butir checklist ini? Butir ini tidak akan disertakan pada penugasan
              kegiatan mendatang.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Batal
              </button>
              <button type="button" className="btn btn-danger" onClick={() => handleDeleteItem(deleteConfirmId)}>
                Hapus Butir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{templateStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: Executive Light Mode (White Surface, Slate Text, Amber Accent)
// ------------------------------------------------------------------
const templateStyles = `
  .template-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Toast Notification */
  .template-toast {
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
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  }
  .toast-success {
    background: var(--status-green-bg);
    border: 1px solid var(--status-green-border);
    color: var(--status-green);
  }
  .toast-error {
    background: var(--status-red-bg);
    border: 1px solid var(--status-red-border);
    color: var(--status-red);
  }

  /* Header */
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @media (min-width: 768px) {
    .page-header {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
    }
  }
  .header-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .header-tag {
    font-size: 0.725rem;
    font-weight: 600;
    color: var(--gold-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .header-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }
  .header-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    max-width: 600px;
  }
  .header-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Snapshot Safety Callout */
  .snapshot-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 1.15rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: var(--radius-md);
  }
  .notice-icon {
    color: var(--gold-500);
    margin-top: 0.1rem;
    flex-shrink: 0;
  }
  .notice-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .notice-title {
    font-size: 0.825rem;
    font-weight: 600;
    color: #92400e;
  }
  .notice-text {
    font-size: 0.775rem;
    color: #78350f;
    line-height: 1.45;
  }

  /* Jenis Acara Selector */
  .ja-selector-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ja-tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .ja-tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.85rem;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }
  .ja-tab-btn:hover {
    border-color: var(--border-distinct);
    background: var(--surface-muted);
  }
  .ja-tab-active {
    background: #fef3c7;
    border-color: #fde68a;
  }
  .ja-tab-name {
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .ja-tab-active .ja-tab-name {
    color: var(--gold-500);
  }
  .ja-tab-badge {
    font-size: 0.6875rem;
    color: var(--text-muted);
    background: var(--surface-muted);
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius-xs);
  }
  .ja-tab-active .ja-tab-badge {
    background: #fde68a;
    color: #92400e;
  }

  /* Controls & Search */
  .controls-bar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  @media (min-width: 768px) {
    .controls-bar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  .fase-toggle-group {
    display: flex;
    background: var(--surface-muted);
    padding: 3px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
    width: fit-content;
  }
  .fase-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-xs);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .fase-toggle-active {
    background: var(--surface-card);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 280px;
  }
  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 0.45rem 2rem 0.45rem 2.2rem;
    font-size: 0.8rem;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }
  .search-input:focus {
    outline: none;
    border-color: var(--gold-500);
  }
  .search-clear {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
  }

  /* KPI Strip */
  .kpi-strip {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.75rem 1.25rem;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow-x: auto;
  }
  .kpi-item {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    white-space: nowrap;
  }
  .kpi-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .kpi-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .kpi-gold { color: var(--gold-500); }
  .kpi-blue { color: var(--status-blue); }
  .kpi-muted { color: var(--text-muted); }
  .kpi-divider {
    width: 1px;
    height: 18px;
    background: var(--border-subtle);
  }

  /* Group Card */
  .template-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .group-card {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.25rem;
    background: var(--surface-muted);
    border-bottom: 1px solid var(--border-subtle);
  }
  .group-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .group-icon {
    color: var(--gold-500);
  }
  .group-name {
    font-size: 0.925rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .group-badge {
    font-size: 0.7rem;
    color: var(--text-secondary);
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    padding: 0.1rem 0.45rem;
    border-radius: var(--radius-xs);
  }

  /* Items Table */
  .items-table {
    display: flex;
    flex-direction: column;
  }
  .item-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
    transition: background-color var(--transition-fast);
  }
  .item-row:last-child {
    border-bottom: none;
  }
  .item-row:hover {
    background: var(--surface-muted);
  }
  .item-row-inactive {
    opacity: 0.55;
    background: #fafaf9;
  }
  .item-order {
    font-size: 0.775rem;
    font-weight: 600;
    color: var(--text-muted);
    width: 22px;
    text-align: center;
    flex-shrink: 0;
  }
  .item-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .item-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.4;
  }
  .item-tags {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.1rem 0.45rem;
    border-radius: var(--radius-xs);
  }
  .tag-wajib {
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: var(--gold-500);
  }
  .tag-opsional {
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
  }
  .tag-foto {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: var(--status-blue);
  }
  .tag-inactive {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #6b7280;
  }

  /* Actions */
  .item-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .action-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: var(--radius-xs);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .toggle-active {
    background: var(--status-green-bg);
    border-color: var(--status-green-border);
    color: var(--status-green);
  }
  .toggle-inactive {
    background: var(--surface-muted);
    border-color: var(--border-subtle);
    color: var(--text-muted);
  }
  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .btn-icon:hover {
    background: var(--surface-card);
    color: var(--text-primary);
    border-color: var(--border-distinct);
  }
  .btn-icon-danger:hover {
    background: var(--status-red-bg);
    color: var(--status-red);
    border-color: var(--status-red-border);
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 3.5rem 1.5rem;
    text-align: center;
  }
  .empty-icon {
    color: var(--text-muted);
    opacity: 0.6;
  }
  .empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .empty-desc {
    font-size: 0.825rem;
    color: var(--text-secondary);
    max-width: 440px;
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .modal-dialog {
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 560px;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16);
    display: flex;
    flex-direction: column;
  }
  .modal-dialog-sm {
    max-width: 420px;
  }
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.15rem 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
  }
  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .modal-sub {
    font-size: 0.775rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }
  .btn-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-xs);
  }
  .btn-close:hover {
    color: var(--text-primary);
  }
  .modal-form {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .modal-body-p {
    padding: 1.25rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
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
  .label-req {
    color: var(--status-red);
  }
  .form-hint {
    font-size: 0.725rem;
    color: var(--text-muted);
  }
  .form-input, .form-textarea {
    width: 100%;
    padding: 0.55rem 0.75rem;
    font-size: 0.85rem;
    background: var(--surface-card);
    border: 1px solid var(--border-distinct);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }
  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--gold-500);
  }
  .checkbox-section {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 0.85rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    cursor: pointer;
  }
  .custom-checkbox {
    margin-top: 0.2rem;
    accent-color: var(--gold-500);
    width: 16px;
    height: 16px;
  }
  .checkbox-title {
    display: block;
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .checkbox-desc {
    display: block;
    font-size: 0.725rem;
    color: var(--text-muted);
    line-height: 1.35;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
  }
`
