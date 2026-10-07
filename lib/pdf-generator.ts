'use client'

// ============================================================
// SIAP-Pro: Direct PDF Generator Engine
// Dewan Ekonomi Nasional Republik Indonesia
// Halaman 1: Khusus Cover & Detail Acara (Tanpa Kop Surat Instansi Alamat)
// Halaman 2 dst: Tabel Pengecekan Kesiapan & Bukti Fisik Lapangan
// Seluruh data agenda, tanggal, waktu, lokasi, tim penugasan 100% DINAMIS
// ============================================================

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Kegiatan, ItemChecklist, UserRole } from '@/types'
import { formatTanggalLong } from '@/lib/utils'
import { MOCK_USERS } from '@/lib/mock-data'

interface GeneratePdfParams {
  kegiatan: Kegiatan
  items: ItemChecklist[]
  jawabanMap: Record<string, { dicentang: boolean; keterangan: string; fotoUrls: string[] }>
  catatanPenutup?: string
  pembuatNama?: string
  disetujuiNama?: string
  waktuPersetujuan?: string | null
}

/** Preload all images in an element before capturing canvas */
async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>(resolve => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })
    })
  )
}

/** Format clean waktu string */
function formatWaktuClean(jam?: string): string {
  if (!jam) return '10:00 WIB'
  const parts = jam.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]} WIB`
  }
  return `${jam} WIB`
}

/** Format numbered name list */
function formatNameList(names: string[]): string {
  if (names.length === 0) return 'Petugas Protokol DEN'
  return names.map((name, idx) => `<div style="margin-bottom: 2px;">${idx + 1}. ${name}</div>`).join('')
}

/**
 * Chunk items for pages starting from Page 2 onwards.
 * Page 1 is strictly dedicated to Cover & Event Details (0 items).
 */
function chunkItemsPage2Onwards(sortedItems: ItemChecklist[]): ItemChecklist[][] {
  const total = sortedItems.length

  // Standar 17 butir DEN:
  // Halaman 2: Butir 1 - 5 (5 items)
  // Halaman 3: Butir 6 - 10 (5 items)
  // Halaman 4: Butir 11 - 14 (4 items)
  // Halaman 5: Butir 15 - 17 (3 items) + Catatan + Tanda Tangan
  if (total === 17) {
    return [
      sortedItems.slice(0, 5),   // Halaman 2: 1 - 5
      sortedItems.slice(5, 10),  // Halaman 3: 6 - 10
      sortedItems.slice(10, 14), // Halaman 4: 11 - 14
      sortedItems.slice(14, 17), // Halaman 5: 15 - 17 + Catatan + Signatures
    ]
  }

  // Dynamic chunking untuk jumlah butir dinamis:
  const chunks: ItemChecklist[][] = []
  let currentIdx = 0

  while (currentIdx < total) {
    const remaining = total - currentIdx
    if (remaining <= 3) {
      chunks.push(sortedItems.slice(currentIdx, total))
      break
    }
    if (remaining === 4) {
      chunks.push(sortedItems.slice(currentIdx, currentIdx + 4))
      break
    }
    const take = Math.min(5, remaining)
    chunks.push(sortedItems.slice(currentIdx, currentIdx + take))
    currentIdx += take
  }

  return chunks
}

export async function downloadLaporanPdfDirectly({
  kegiatan,
  items,
  jawabanMap,
  catatanPenutup = '',
  pembuatNama = 'Petugas Protokol DEN',
  disetujuiNama = 'Super Admin Protokol',
  waktuPersetujuan = null,
}: GeneratePdfParams): Promise<void> {
  const tanggalDokumen = formatTanggalLong(kegiatan.tanggal)
  const waktuStr = formatWaktuClean(kegiatan.jamMulai)
  const lokasiStr = kegiatan.lokasi || 'Gedung Dewan Ekonomi Nasional, Jakarta'
  const pimpinanStr = kegiatan.penjabat || 'Pimpinan Dewan Ekonomi Nasional'

  // Ambil daftar nama tim penugasan aktual 100% DINAMIS dari kegiatan
  const pProtokol = kegiatan.penugasan?.find(p => p.role === UserRole.PROTOKOL)
  const pSidang = kegiatan.penugasan?.find(p => p.role === UserRole.PERSIDANGAN)
  const pHumas = kegiatan.penugasan?.find(p => p.role === UserRole.HUMAS)

  const resolveNames = (picIds?: string[]): string[] => {
    if (!picIds || picIds.length === 0) return []
    return picIds.map(id => MOCK_USERS.find(u => u.id === id)?.nama || id)
  }

  const timProtokol = resolveNames(pProtokol?.picIds)
  const timSidang = resolveNames(pSidang?.picIds)
  const timDokumentasi = resolveNames(pHumas?.picIds)

  const displayProtokol = timProtokol.length > 0 ? timProtokol : ['Petugas Protokol DEN']
  const displaySidang = timSidang.length > 0 ? timSidang : ['Tim Persidangan DEN']
  const displayDokumentasi = timDokumentasi.length > 0 ? timDokumentasi : ['Tim Dokumentasi DEN']

  // Urutkan item aktif
  const sortedItems = [...items].filter(i => i.aktif).sort((a, b) => a.nomor - b.nomor)

  // Chunking tabel untuk halaman 2 dst.
  const tableChunks = chunkItemsPage2Onwards(sortedItems)
  const totalPages = 1 + tableChunks.length // Halaman 1 (Cover) + Halaman Tabel

  // Offscreen container
  const offscreenRoot = document.createElement('div')
  offscreenRoot.id = 'pdf-render-root'
  offscreenRoot.style.position = 'fixed'
  offscreenRoot.style.left = '-9999px'
  offscreenRoot.style.top = '0'
  offscreenRoot.style.zIndex = '-999'

  // Header Table Snippet
  const tableHeaderHtml = `
    <thead>
      <tr style="background-color: #1e293b; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
        <th style="padding: 9px 6px; border: 1px solid #334155; width: 42px; text-align: center;">No</th>
        <th style="padding: 9px 14px; border: 1px solid #334155; width: 235px; text-align: left;">Daftar Pengecekan & Kelompok</th>
        <th style="padding: 9px 14px; border: 1px solid #334155; text-align: center;">Laporan Pengecekan & Bukti Fisik Lapangan</th>
      </tr>
    </thead>
  `

  // Helper render baris tabel
  const renderRow = (item: ItemChecklist) => {
    const jwb = jawabanMap[item.id]
    const isChecked = jwb?.dicentang ?? false
    const rawKet = jwb?.keterangan?.trim() || ''
    const photoUrl = (jwb?.fotoUrls && jwb.fotoUrls.length > 0) ? jwb.fotoUrls[0] : null
    const hasPhoto = Boolean(photoUrl)

    const statusBadge = isChecked
      ? `<span style="display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.02em;">✓ SUDAH DISIAPKAN</span>`
      : `<span style="display: inline-block; background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.02em;">✕ BELUM DISIAPKAN</span>`

    const keteranganText = rawKet && rawKet.toLowerCase() !== 'sudah disiapkan'
      ? `<div style="font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 4px;">Catatan: "${rawKet}"</div>`
      : ''

    const photoHtml = hasPhoto
      ? `
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; max-width: 250px; margin: 6px auto 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <img src="${photoUrl}" alt="${item.teks}" style="max-height: 118px; max-width: 100%; width: auto; height: auto; object-fit: contain; border-radius: 2px; display: block; margin: 0 auto;" />
        </div>
      `
      : `
        <div style="font-size: 10px; font-style: italic; color: #94a3b8; margin-top: 4px;">
          ${item.wajibFoto ? 'Foto bukti belum dilampirkan' : 'Tidak memerlukan lampiran foto'}
        </div>
      `

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
        <td style="padding: 10px 4px; text-align: center; vertical-align: middle; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #0f172a; width: 42px;">
          ${item.nomor}
        </td>
        <td style="padding: 10px 14px; text-align: left; vertical-align: top; border: 1px solid #cbd5e1; width: 235px;">
          <span style="display: inline-block; font-size: 9px; font-weight: 600; color: #475569; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 3px; padding: 2px 6px; margin-bottom: 4px;">
            ${item.kelompok}
          </span>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.35;">
            ${item.teks}
          </div>
          ${item.wajib ? '<span style="display: inline-block; font-size: 9px; color: #b45309; font-weight: 600; margin-top: 2px;">• Butir Wajib</span>' : ''}
        </td>
        <td style="padding: 8px 12px; text-align: center; vertical-align: middle; border: 1px solid #cbd5e1;">
          <div style="margin-bottom: 2px;">
            ${statusBadge}
          </div>
          ${keteranganText}
          ${photoHtml}
        </td>
      </tr>
    `
  }

  const pageDivs: HTMLElement[] = []

  // =============================================================
  // HALAMAN 1: KHUSUS COVER & DETAIL ACARA (TANPA TABEL ROWS)
  // Sesuai permintaan: Logo DEN di tengah atas, Judul, Detail Acara & Tim
  // =============================================================
  const page1Div = document.createElement('div')
  page1Div.className = 'pdf-a4-page'
  page1Div.style.width = '794px'
  page1Div.style.height = '1123px'
  page1Div.style.backgroundColor = '#ffffff'
  page1Div.style.padding = '44px 50px'
  page1Div.style.boxSizing = 'border-box'
  page1Div.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  page1Div.style.color = '#0f172a'
  page1Div.style.position = 'relative'

  page1Div.innerHTML = `
    <!-- 1. LOGO RESMI DEN BULAT DI TENGAH ATAS -->
    <div style="text-align: center; margin-top: 15px; margin-bottom: 22px;">
      <img src="/logo-den-circular.png" alt="Logo DEN" style="width: 110px; height: 110px; object-fit: contain; margin: 0 auto; display: block;" />
    </div>

    <!-- 2. JUDUL DOKUMEN LAPORAN PERSIAPAN -->
    <div style="text-align: center; margin-bottom: 34px;">
      <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
        LAPORAN PERSIAPAN
      </div>
      <div style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.03em; margin-top: 4px;">
        DEWAN EKONOMI NASIONAL REPUBLIK INDONESIA
      </div>
    </div>

    <!-- 3. DETAIL ACARA / AGENDA (100% DINAMIS) -->
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #0f172a; margin-bottom: 26px;">
      <tr>
        <td style="width: 140px; padding: 6px 0; font-weight: 700; vertical-align: top;">Agenda</td>
        <td style="width: 18px; padding: 6px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 6px 0; font-weight: 700; line-height: 1.45; vertical-align: top;">${kegiatan.nama}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">Tanggal</td>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">${tanggalDokumen}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">Waktu</td>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">${waktuStr}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">Lokasi</td>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">${lokasiStr}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">Pimpinan Acara</td>
        <td style="padding: 6px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">${pimpinanStr}</td>
      </tr>
    </table>

    <!-- 4. DAFTAR TIM YANG BERTUGAS (100% DINAMIS) -->
    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
      Daftar Tim Yang Bertugas
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #0f172a; margin-bottom: 28px;">
      <tr>
        <td style="width: 140px; padding: 5px 0; font-weight: 700; vertical-align: top;">Protokoler</td>
        <td style="width: 18px; padding: 5px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 5px 0; font-weight: 600; line-height: 1.45; vertical-align: top;">
          ${formatNameList(displayProtokol)}
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: 700; vertical-align: top;">Persidangan</td>
        <td style="width: 18px; padding: 5px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 5px 0; font-weight: 600; line-height: 1.45; vertical-align: top;">
          ${formatNameList(displaySidang)}
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: 700; vertical-align: top;">Dokumentasi</td>
        <td style="width: 18px; padding: 5px 0; font-weight: 700; vertical-align: top;">:</td>
        <td style="padding: 5px 0; font-weight: 600; line-height: 1.45; vertical-align: top;">
          ${formatNameList(displayDokumentasi)}
        </td>
      </tr>
    </table>

    <!-- 5. GARIS PEMISAH & PENGANTAR TABEL -->
    <div style="border-top: 1.5px solid #0f172a; margin-bottom: 26px;"></div>

    <div style="text-align: center; margin-bottom: 12px;">
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.04em; text-transform: uppercase;">
        Tabel Pengecekan Persiapan
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
        (Rincian butir pengecekan dan dokumentasi foto bukti fisik tercantum mulai Halaman 2)
      </div>
    </div>

    <!-- RUNNING FOOTER HALAMAN 1 -->
    <div style="position: absolute; bottom: 20px; left: 50px; right: 50px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #64748b;">
      <div>SIAP-Pro • Sistem Informasi & Aplikasi Protokol DEN RI</div>
      <div>Dokumen Resmi Hasil Verifikasi Lapangan</div>
      <div style="font-weight: 700; color: #0f172a;">Halaman 1 dari ${totalPages}</div>
    </div>
  `

  offscreenRoot.appendChild(page1Div)
  pageDivs.push(page1Div)

  // =============================================================
  // HALAMAN 2 SAMPAI SELESAI: TABEL LIST DATA & BUKTI FOTO
  // =============================================================
  tableChunks.forEach((chunk, chunkIdx) => {
    const pageNum = chunkIdx + 2 // Karena Halaman 1 adalah Cover
    const isLastPage = pageNum === totalPages

    const pageDiv = document.createElement('div')
    pageDiv.className = 'pdf-a4-page'
    pageDiv.style.width = '794px'
    pageDiv.style.height = '1123px'
    pageDiv.style.backgroundColor = '#ffffff'
    pageDiv.style.padding = '36px 44px'
    pageDiv.style.boxSizing = 'border-box'
    pageDiv.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    pageDiv.style.color = '#0f172a'
    pageDiv.style.position = 'relative'

    // Running Header Ringkas di Halaman Lanjutan
    const topHeaderHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="/logo-den-circular.png" alt="Logo DEN" style="width: 26px; height: 26px; object-fit: contain;" />
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #0f172a; line-height: 1.1;">
              DEWAN EKONOMI NASIONAL REPUBLIK INDONESIA
            </div>
            <div style="font-size: 9px; font-weight: 600; color: #b45309;">
              Laporan Verifikasi Kesiapan Protokol Lapangan
            </div>
          </div>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #64748b;">
          <div style="font-weight: 700; color: #0f172a;">${kegiatan.nama.slice(0, 38)}${kegiatan.nama.length > 38 ? '...' : ''}</div>
          <div>${tanggalDokumen}</div>
        </div>
      </div>
    `

    // Render baris tabel
    const rowsHtml = chunk.map(item => renderRow(item)).join('')

    // Bagian Penutup & Pengesahan di Halaman Terakhir
    let bottomSectionHtml = ''
    if (isLastPage) {
      const displayCatatan = catatanPenutup?.trim()
        ? catatanPenutup
        : 'Seluruh sarana dan prasarana acara telah diverifikasi di lokasi dan dinyatakan siap untuk mendukung kelancaran kegiatan.'
      const displayPembuat = pembuatNama?.trim() ? pembuatNama : 'Petugas Protokol DEN'
      const displayDisetujui = disetujuiNama?.trim() ? disetujuiNama : 'Super Admin Protokol'
      const waktuAccStr = waktuPersetujuan
        ? new Date(waktuPersetujuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : tanggalDokumen

      bottomSectionHtml = `
        <!-- KOTAK CATATAN & REKOMENDASI PROTOKOL -->
        <div style="margin-top: 14px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #b45309; border-radius: 4px; padding: 9px 14px;">
          <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px;">
            Catatan & Rekomendasi Protokol :
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.4;">
            ${displayCatatan}
          </div>
        </div>

        <!-- LEMBAR PENGESAHAN DUA KOLOM -->
        <div style="margin-top: 20px; display: flex; justify-content: space-between; gap: 30px; font-size: 11px;">
          <!-- Kolom Kiri: Pembuat Laporan -->
          <div style="flex: 1; text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; padding: 12px 14px;">
            <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Jakarta, ${tanggalDokumen}</div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 45px;">
              Petugas Protokol Lapangan (Pelapor)
            </div>
            <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; text-decoration: underline;">
              ${displayPembuat}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Tim Protokol Dewan Ekonomi Nasional
            </div>
          </div>

          <!-- Kolom Kanan: Penyetuju (ACC) -->
          <div style="flex: 1; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; padding: 12px 14px;">
            <div style="font-size: 10px; color: #64748b; margin-bottom: 2px;">Terverifikasi: ${waktuAccStr}</div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
              Mengetahui & Menyetujui (ACC)
            </div>
            <div style="display: inline-block; border: 1px dashed #047857; background-color: #ecfdf5; border-radius: 4px; padding: 3px 10px; font-size: 9.5px; font-weight: 700; color: #047857; margin-bottom: 14px;">
              ✓ TERVERIFIKASI SISTEM ELEKTRONIK
            </div>
            <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; text-decoration: underline;">
              ${displayDisetujui}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Super Admin / Pimpinan Protokol DEN RI
            </div>
          </div>
        </div>
      `
    }

    // Running Footer
    const runningFooterHtml = `
      <div style="position: absolute; bottom: 18px; left: 44px; right: 44px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 9px; color: #64748b;">
        <div>SIAP-Pro • Sistem Informasi & Aplikasi Protokol Dewan Ekonomi Nasional RI</div>
        <div>Dokumen Resmi Hasil Verifikasi Lapangan</div>
        <div style="font-weight: 700; color: #0f172a;">Halaman ${pageNum} dari ${totalPages}</div>
      </div>
    `

    pageDiv.innerHTML = `
      ${topHeaderHtml}
      <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
        ${tableHeaderHtml}
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      ${bottomSectionHtml}
      ${runningFooterHtml}
    `

    offscreenRoot.appendChild(pageDiv)
    pageDivs.push(pageDiv)
  })

  document.body.appendChild(offscreenRoot)

  try {
    // Pastikan seluruh gambar dimuat
    await waitForImagesToLoad(offscreenRoot)

    const pdf = new jsPDF('p', 'mm', 'a4')

    for (let i = 0; i < pageDivs.length; i++) {
      if (i > 0) {
        pdf.addPage('a4', 'p')
      }

      const canvas = await html2canvas(pageDivs[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    }

    const sanitizedNama = kegiatan.nama.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
    pdf.save(`LAPORAN_PERSIAPAN_${sanitizedNama}.pdf`)
  } finally {
    document.body.removeChild(offscreenRoot)
  }
}
