'use client'

// ============================================================
// SIAP-Pro: Dokumen Resmi Laporan Keprotokolan
// Dewan Ekonomi Nasional Republik Indonesia
// Spesifikasi: PRD Bagian 8 (Output Dokumen PDF Laporan Protokol)
// ============================================================

import React, { useRef, useState } from 'react'
import {
  Printer,
  Share2,
  X,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  Check,
  Send,
} from 'lucide-react'
import { Kegiatan, ItemChecklist } from '@/types'
import { formatTanggalLong, cn } from '@/lib/utils'

interface LaporanProtokolDocumentProps {
  kegiatan: Kegiatan
  items: ItemChecklist[]
  jawabanMap: Record<string, { dicentang: boolean; keterangan: string; fotoUrls: string[] }>
  catatanPenutup?: string
  pembuatNama?: string
  onClose: () => void
}

export default function LaporanProtokolDocument({
  kegiatan,
  items,
  jawabanMap,
  catatanPenutup = '',
  pembuatNama = 'Tim Protokol DEN',
  onClose,
}: LaporanProtokolDocumentProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const judulDokumen = 'LAPORAN KEGIATAN PROTOKOL'

  const nomorDokumen = `DEN/PROTOKOL/${new Date().getFullYear()}/${kegiatan.id.replace('keg-', '').toUpperCase()}`

  // Categorize PICs
  const protokolPics = kegiatan.penugasan?.find(p => p.role === 'PROTOKOL')?.pics || []
  const persidanganPics = kegiatan.penugasan?.find(p => p.role === 'PERSIDANGAN')?.pics || []
  const humasPics = kegiatan.penugasan?.find(p => p.role === 'HUMAS')?.pics || []

  // Print Handler
  const handlePrint = () => {
    window.print()
  }

  // Web Share / WhatsApp Handler
  const handleShareWhatsApp = async () => {
    const summaryText = `*${judulDokumen}*\n` +
      `*Dewan Ekonomi Nasional RI*\n\n` +
      `Agenda: ${kegiatan.nama}\n` +
      `Hari/Tanggal: ${formatTanggalLong(kegiatan.tanggal)}\n` +
      `Waktu: ${kegiatan.jamMulai} WIB\n` +
      `Tempat: ${kegiatan.lokasi}\n` +
      `Pejabat: ${kegiatan.penjabat}\n` +
      `Status: Telah Terverifikasi Lengkap\n\n` +
      `Dokumen resmi dapat diakses melalui portal internal SIAP-Pro DEN.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: judulDokumen,
          text: summaryText,
          url: window.location.href,
        })
        return
      } catch (err) {
        // User cancelled or fallback to WhatsApp URL
      }
    }

    // Direct WhatsApp web/app link fallback
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="pdf-modal-backdrop" onClick={onClose}>
      {/* Floating Control Toolbar (Hidden in Print) */}
      <div className="pdf-toolbar no-print" onClick={e => e.stopPropagation()}>
        <div className="toolbar-info">
          <ShieldCheck size={18} className="toolbar-icon" />
          <span className="toolbar-title">Pratinjau Dokumen Berita Acara Protokol</span>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleShareWhatsApp}>
            <Send size={14} />
            Bagikan ke WhatsApp
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={14} />
            Cetak / Simpan PDF
          </button>
          <button type="button" className="btn-close-toolbar" onClick={onClose} aria-label="Tutup pratinjau">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="pdf-sheet-container" onClick={e => e.stopPropagation()}>
        <div className="pdf-sheet print-area">
          {/* 1. KOP SURAT RESMI GARUDA DEN */}
          <header className="kop-surat">
            <div className="kop-emblem-wrap">
              <img
                src="/logo-den.svg"
                alt="Dewan Ekonomi Nasional RI"
                style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
              />
            </div>

            <div className="kop-text-block">
              <h1 className="kop-instansi">DEWAN EKONOMI NASIONAL</h1>
              <h2 className="kop-negara">REPUBLIK INDONESIA</h2>
              <p className="kop-sub">Bagian Keprotokolan dan Dukungan Persidangan</p>
              <p className="kop-alamat">
                Gedung Ali Wardhana, Jl. Lapangan Banteng Timur No. 2-4, Jakarta Pusat 10710
              </p>
            </div>
          </header>

          <div className="kop-divider-double" />

          {/* 2. JUDUL DOKUMEN & NOMOR BERKAS */}
          <div className="doc-title-section">
            <h2 className="doc-title">{judulDokumen}</h2>
            <div className="doc-number-row">
              <span>Nomor: </span>
              <strong>{nomorDokumen}</strong>
            </div>
          </div>

          {/* 3. IDENTITAS KEGIATAN */}
          <section className="doc-section">
            <div className="section-heading">I. IDENTITAS AGENDA KEGIATAN</div>
            <table className="doc-table-meta">
              <tbody>
                <tr>
                  <td className="meta-label">Agenda / Acara</td>
                  <td className="meta-colon">:</td>
                  <td className="meta-value font-bold">{kegiatan.nama}</td>
                </tr>
                <tr>
                  <td className="meta-label">Hari, Tanggal</td>
                  <td className="meta-colon">:</td>
                  <td className="meta-value">{formatTanggalLong(kegiatan.tanggal)}</td>
                </tr>
                <tr>
                  <td className="meta-label">Waktu Pelaksanaan</td>
                  <td className="meta-colon">:</td>
                  <td className="meta-value">{kegiatan.jamMulai} WIB s.d. selesai</td>
                </tr>
                <tr>
                  <td className="meta-label">Tempat / Ruangan</td>
                  <td className="meta-colon">:</td>
                  <td className="meta-value">{kegiatan.lokasi}</td>
                </tr>
                <tr>
                  <td className="meta-label">Pejabat yang Didampingi</td>
                  <td className="meta-colon">:</td>
                  <td className="meta-value font-bold">{kegiatan.penjabat}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 4. SUSUNAN TIM PROTOKOL BERTUGAS */}
          <section className="doc-section">
            <div className="section-heading">II. SUSUNAN TIM PENUGASAN LAPANGAN</div>
            <table className="doc-table-team">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th style={{ width: '180px' }}>Divisi Pelaksana</th>
                  <th>Petugas Pelaksana (PIC)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">1</td>
                  <td className="font-semibold">Protokol Tempat Acara</td>
                  <td>
                    {protokolPics.length > 0
                      ? protokolPics.map(p => p.nama).join(', ')
                      : 'Tim Protokol DEN'}
                  </td>
                </tr>
                <tr>
                  <td className="text-center">2</td>
                  <td className="font-semibold">Dukungan Persidangan</td>
                  <td>
                    {persidanganPics.length > 0
                      ? persidanganPics.map(p => p.nama).join(', ')
                      : 'Tim Persidangan DEN'}
                  </td>
                </tr>
                <tr>
                  <td className="text-center">3</td>
                  <td className="font-semibold">Dokumentasi & Media</td>
                  <td>
                    {humasPics.length > 0
                      ? humasPics.map(p => p.nama).join(', ')
                      : 'Tim Humas & Dokumentasi'}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 5. TABEL VERIFIKASI & EVIDENCE FOTO */}
          <section className="doc-section">
            <div className="section-heading">III. MATRIKS VERIFIKASI KELENGKAPAN & EVIDENSI</div>
            <table className="doc-table-checklist">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>No</th>
                  <th style={{ width: '220px' }}>Daftar Pengecekan</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th>Keterangan & Bukti Lapangan (Evidence)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const jwb = jawabanMap[item.id]
                  const isChecked = jwb?.dicentang ?? false
                  const keterangan = jwb?.keterangan || ''
                  const fotos = jwb?.fotoUrls || []

                  return (
                    <tr key={item.id} className="checklist-row">
                      <td className="text-center align-top">{idx + 1}</td>
                      <td className="align-top">
                        <div className="item-kelompok-tag">{item.kelompok}</div>
                        <div className="item-teks-name">{item.teks}</div>
                        {item.wajib && <span className="item-wajib-badge">Wajib</span>}
                      </td>
                      <td className="align-top text-center">
                        {isChecked ? (
                          <div className="status-cell-done">
                            <Check size={13} className="status-check-icon" />
                            <span>Terpenuhi</span>
                          </div>
                        ) : (
                          <div className="status-cell-pending">
                            <span>Belum</span>
                          </div>
                        )}
                      </td>
                      <td className="align-top">
                        {keterangan && <p className="cell-keterangan">{keterangan}</p>}
                        {fotos.length > 0 ? (
                          <div className="cell-fotos-grid">
                            {fotos.map((url, fIdx) => (
                              <div key={fIdx} className="evidence-thumb-frame">
                                <img
                                  src={url}
                                  alt={`Bukti butir ${item.teks}`}
                                  className="evidence-thumb-img"
                                />
                                <span className="evidence-stamp">BUKTI #{fIdx + 1}</span>
                              </div>
                            ))}
                          </div>
                        ) : item.wajibFoto ? (
                          <span className="no-photo-note">Bukti foto tidak dilampirkan</span>
                        ) : (
                          !keterangan && <span className="empty-dash">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* 6. CATATAN PENUTUP */}
          {catatanPenutup && (
            <section className="doc-section">
              <div className="section-heading">IV. CATATAN KHUSUS PELAKSANAAN</div>
              <div className="catatan-box">
                <p>{catatanPenutup}</p>
              </div>
            </section>
          )}

          {/* 7. LEMBAR PENGESAHAN TANDA TANGAN */}
          <section className="doc-section ttd-section">
            <div className="ttd-grid">
              <div className="ttd-box">
                <p className="ttd-title">Mengetahui,</p>
                <p className="ttd-role">Kepala Bagian Protokol DEN RI</p>
                <div className="ttd-spacer" />
                <p className="ttd-name">Hendra Gunawan, S.STP</p>
                <p className="ttd-nip">NIP. 19850412 200801 1 003</p>
              </div>

              <div className="ttd-box ttd-box-right">
                <p className="ttd-title">Jakarta, {formatTanggalLong(new Date().toISOString())}</p>
                <p className="ttd-role">Petugas Pelapor Protokoler</p>
                <div className="ttd-spacer" />
                <p className="ttd-name">{pembuatNama}</p>
                <p className="ttd-nip">Petugas Tim Protokol Lapangan</p>
              </div>
            </div>

            {/* QR Verification Seal */}
            <div className="doc-seal-footer">
              <QrCode size={40} className="seal-qr" />
              <div className="seal-text">
                <strong>Sistem Informasi Akuntabilitas Protokoler (SIAP-Pro)</strong>
                <p>Dokumen ini telah disahkan secara digital dalam sistem informasi Dewan Ekonomi Nasional RI.</p>
                <span className="seal-code">Kode Verifikasi: DEN-{kegiatan.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{pdfDocumentStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Scoped Styles: High-Precision Printable Official Document Standard
// ------------------------------------------------------------------
const pdfDocumentStyles = `
  /* Viewport Overlay */
  .pdf-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    padding: 1.5rem 1rem;
  }

  /* Floating Toolbar */
  .pdf-toolbar {
    position: sticky;
    top: 0;
    z-index: 310;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    max-width: 820px;
    padding: 0.75rem 1.25rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
    margin-bottom: 1.25rem;
  }
  .toolbar-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .toolbar-icon {
    color: var(--gold-500);
  }
  .toolbar-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-close-toolbar {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-xs);
  }
  .btn-close-toolbar:hover {
    color: var(--text-primary);
  }

  /* Sheet Container */
  .pdf-sheet-container {
    width: 100%;
    max-width: 820px;
    margin-bottom: 3rem;
  }

  /* Physical Paper Sheet (A4 Proportion) */
  .pdf-sheet {
    background: #ffffff;
    color: #0f172a;
    padding: 2.5rem 3rem;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    border-radius: var(--radius-sm);
    border: 1px solid #e2e8f0;
    font-family: 'Inter', serif, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
  }

  /* Kop Surat Resmi */
  .kop-surat {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-bottom: 0.75rem;
  }
  .kop-emblem-wrap {
    flex-shrink: 0;
  }
  .garuda-emblem {
    width: 72px;
    height: 72px;
  }
  .kop-text-block {
    text-align: center;
    flex: 1;
  }
  .kop-instansi {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.04em;
    margin: 0;
    line-height: 1.15;
  }
  .kop-negara {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.08em;
    margin: 0;
    line-height: 1.2;
  }
  .kop-sub {
    font-size: 0.775rem;
    font-weight: 600;
    color: #334155;
    margin: 0.2rem 0 0 0;
  }
  .kop-alamat {
    font-size: 0.675rem;
    color: #64748b;
    margin: 0.15rem 0 0 0;
  }

  .kop-divider-double {
    border-top: 2.5px solid #0f172a;
    border-bottom: 0.75px solid #0f172a;
    height: 3px;
    margin-bottom: 1.5rem;
  }

  /* Document Title */
  .doc-title-section {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .doc-title {
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #0f172a;
    margin: 0;
  }
  .doc-number-row {
    font-size: 0.8rem;
    color: #475569;
    margin-top: 0.25rem;
  }

  /* Document Sections */
  .doc-section {
    margin-bottom: 1.5rem;
    page-break-inside: avoid;
  }
  .section-heading {
    font-size: 0.825rem;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 0.35rem;
    margin-bottom: 0.65rem;
  }

  /* Metadata Table */
  .doc-table-meta {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.825rem;
  }
  .doc-table-meta td {
    padding: 0.25rem 0.2rem;
    vertical-align: top;
  }
  .meta-label {
    width: 190px;
    color: #475569;
  }
  .meta-colon {
    width: 15px;
    text-align: center;
    color: #475569;
  }
  .meta-value {
    color: #0f172a;
  }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }

  /* Team Table */
  .doc-table-team, .doc-table-checklist {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .doc-table-team th, .doc-table-checklist th {
    background: #f1f5f9;
    border: 1px solid #94a3b8;
    color: #0f172a;
    padding: 0.45rem 0.6rem;
    font-weight: 700;
    text-align: left;
  }
  .doc-table-team td, .doc-table-checklist td {
    border: 1px solid #cbd5e1;
    padding: 0.5rem 0.6rem;
  }
  .text-center { text-align: center; }
  .align-top { vertical-align: top; }

  /* Checklist Matrix */
  .item-kelompok-tag {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
  }
  .item-teks-name {
    font-weight: 600;
    color: #0f172a;
  }
  .item-wajib-badge {
    display: inline-block;
    font-size: 0.65rem;
    color: #92400e;
    background: #fef3c7;
    border: 0.5px solid #fde68a;
    padding: 0.05rem 0.35rem;
    border-radius: 2px;
    margin-top: 0.2rem;
  }
  .status-cell-done {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #047857;
    font-weight: 700;
    font-size: 0.75rem;
  }
  .status-check-icon {
    stroke-width: 3;
  }
  .status-cell-pending {
    color: #b91c1c;
    font-weight: 600;
    font-size: 0.75rem;
  }
  .cell-keterangan {
    margin: 0 0 0.35rem 0;
    font-size: 0.775rem;
    color: #334155;
    line-height: 1.35;
  }
  .cell-fotos-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .evidence-thumb-frame {
    position: relative;
    width: 64px;
    height: 64px;
    border: 1px solid #94a3b8;
    border-radius: 2px;
    overflow: hidden;
  }
  .evidence-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .evidence-stamp {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.75);
    color: #ffffff;
    font-size: 0.55rem;
    font-weight: 700;
    text-align: center;
    padding: 1px 0;
  }
  .no-photo-note {
    font-size: 0.7rem;
    color: #94a3b8;
    font-style: italic;
  }
  .empty-dash {
    color: #cbd5e1;
  }

  /* Catatan Box */
  .catatan-box {
    padding: 0.65rem 0.85rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 2px;
    font-size: 0.8rem;
    color: #334155;
  }

  /* Tanda Tangan */
  .ttd-section {
    margin-top: 2rem;
  }
  .ttd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    page-break-inside: avoid;
  }
  .ttd-box {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: #0f172a;
  }
  .ttd-box-right {
    text-align: right;
  }
  .ttd-title { margin: 0; }
  .ttd-role { font-weight: 600; margin: 0.15rem 0 0 0; }
  .ttd-spacer { height: 60px; }
  .ttd-name { font-weight: 700; text-decoration: underline; margin: 0; }
  .ttd-nip { font-size: 0.75rem; color: #475569; margin: 0.15rem 0 0 0; }

  /* Verification Seal */
  .doc-seal-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 0.85rem;
    border-top: 1px dashed #cbd5e1;
  }
  .seal-qr {
    color: #b45309;
    flex-shrink: 0;
  }
  .seal-text {
    font-size: 0.675rem;
    color: #64748b;
    line-height: 1.35;
  }
  .seal-text strong {
    color: #334155;
    display: block;
  }
  .seal-code {
    display: block;
    font-family: monospace;
    color: #b45309;
    font-weight: 600;
    margin-top: 0.15rem;
  }

  /* ============================================================
     PRINT OPTIMIZATION (@media print)
     ============================================================ */
  @media print {
    /* Hide everything outside of print sheet */
    body * {
      visibility: hidden;
    }
    .print-area, .print-area * {
      visibility: visible;
    }
    .no-print {
      display: none !important;
    }
    .pdf-modal-backdrop {
      position: absolute;
      top: 0; left: 0; width: 100%;
      background: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .pdf-sheet-container {
      max-width: 100% !important;
      margin: 0 !important;
    }
    .pdf-sheet {
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
  }
`
