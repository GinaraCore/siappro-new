// ============================================================
// SIAP-Pro: Mock Data
// Realistic seed data for all roles and scenarios
// ============================================================

import {
  User,
  UserRole,
  JenisAcara,
  Kegiatan,
  Laporan,
  StatusLaporan,
  DokumenSidang,
  StatusPersidangan,
  Dokumentasi,
  StatusDokumentasi,
  Media,
  ItemChecklist,
  AuditLog,
  AuditAksi,
  DashboardStats,
} from '@/types'

// ------------------------------------------------------------------
// USERS
// ------------------------------------------------------------------

export const MOCK_USERS: User[] = [
  {
    id: 'usr-001',
    nama: 'Ahmad Fauzi',
    username: 'superadmin',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.SUPER_ADMIN,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-002',
    nama: 'Dra. Siti Rahayu, M.Si',
    username: 'kabag',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.KABAG,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-003',
    nama: 'Budi Santoso',
    username: 'kasubbag',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.KASUBBAG,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-004',
    nama: 'Pangki Peridana Putra',
    username: 'protokol1',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.PROTOKOL,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-005',
    nama: 'Topik Hidayat',
    username: 'protokol2',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.PROTOKOL,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-006',
    nama: 'Muhammad Faisal',
    username: 'protokol3',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.PROTOKOL,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-007',
    nama: 'M Aufarmario G',
    username: 'persidangan1',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.PERSIDANGAN,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-008',
    nama: 'Maylida Puspasari',
    username: 'persidangan2',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.PERSIDANGAN,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-009',
    nama: 'Murti Ali Lingga',
    username: 'humas1',
    passwordHash: '$2b$10$example_hash',
    role: UserRole.HUMAS,
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

// Quick credential lookup for mock auth
export const MOCK_CREDENTIALS: Record<string, { userId: string; password: string }> = {
  superadmin: { userId: 'usr-001', password: 'admin123' },
  kabag: { userId: 'usr-002', password: 'kabag123' },
  kasubbag: { userId: 'usr-003', password: 'kasubbag123' },
  protokol1: { userId: 'usr-004', password: 'proto123' },
  protokol2: { userId: 'usr-005', password: 'proto123' },
  protokol3: { userId: 'usr-006', password: 'proto123' },
  persidangan1: { userId: 'usr-007', password: 'sidang123' },
  persidangan2: { userId: 'usr-008', password: 'sidang123' },
  humas1: { userId: 'usr-009', password: 'humas123' },
}

// ------------------------------------------------------------------
// JENIS ACARA & TEMPLATE CHECKLIST RESMI DEN (17 ITEM STANDAR)
// Sumber: Laporan Persiapan Kegiatan Protokol DEN & PRD Seksi 7.4/8
// ------------------------------------------------------------------

export const STANDAR_ITEMS_PROTOKOL_17: ItemChecklist[] = [
  { id: 'itm-001', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 1, teks: 'Absen', wajib: true, wajibFoto: true, urutan: 1, aktif: true },
  { id: 'itm-002', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 2, teks: 'Daftar Nama Peserta Rapat Vip', wajib: true, wajibFoto: true, urutan: 2, aktif: true },
  { id: 'itm-003', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 3, teks: 'Bahan Rapat', wajib: true, wajibFoto: true, urutan: 3, aktif: true },
  { id: 'itm-004', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 4, teks: 'Lay Out Meja Rapat', wajib: true, wajibFoto: true, urutan: 4, aktif: true },
  { id: 'itm-005', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 5, teks: 'Laser Pointer', wajib: true, wajibFoto: true, urutan: 5, aktif: true },
  { id: 'itm-006', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 6, teks: 'ATK (Pena, Buku Catatan)', wajib: true, wajibFoto: true, urutan: 6, aktif: true },
  { id: 'itm-007', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 7, teks: 'Kalender', wajib: false, wajibFoto: false, urutan: 7, aktif: true },
  { id: 'itm-008', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 8, teks: 'Tempat Dudukan HP', wajib: false, wajibFoto: false, urutan: 8, aktif: true },
  { id: 'itm-009', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 9, teks: 'Perlengkapan Sanitasi (Hand sanitizer, Tisu Basah dan Tisu Kering)', wajib: true, wajibFoto: false, urutan: 9, aktif: true },
  { id: 'itm-010', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 10, teks: 'Kotak sampah', wajib: false, wajibFoto: false, urutan: 10, aktif: true },
  { id: 'itm-011', templateChecklistId: 'tpl-001', kelompok: 'Perangkat AV', nomor: 11, teks: 'Proyektor', wajib: true, wajibFoto: true, urutan: 11, aktif: true },
  { id: 'itm-012', templateChecklistId: 'tpl-001', kelompok: 'Perangkat AV', nomor: 12, teks: 'LED Monitor', wajib: true, wajibFoto: true, urutan: 12, aktif: true },
  { id: 'itm-013', templateChecklistId: 'tpl-001', kelompok: 'Perangkat AV', nomor: 13, teks: 'Mic Rapat', wajib: true, wajibFoto: true, urutan: 13, aktif: true },
  { id: 'itm-014', templateChecklistId: 'tpl-001', kelompok: 'Perangkat AV', nomor: 14, teks: 'Stand Mic (jika tidak menggunakan mic rapat)', wajib: true, wajibFoto: true, urutan: 14, aktif: true },
  { id: 'itm-015', templateChecklistId: 'tpl-001', kelompok: 'Konsumsi', nomor: 15, teks: 'Air Mineral (disarankan botol kaca)', wajib: true, wajibFoto: true, urutan: 15, aktif: true },
  { id: 'itm-016', templateChecklistId: 'tpl-001', kelompok: 'Protokol Tempat Acara', nomor: 16, teks: 'Name table/Name seat', wajib: true, wajibFoto: true, urutan: 16, aktif: true },
  { id: 'itm-017', templateChecklistId: 'tpl-001', kelompok: 'Perangkat AV', nomor: 17, teks: 'Perangkat Video Conference (jika meeting daring / hybrid)', wajib: true, wajibFoto: true, urutan: 17, aktif: true },
]

export const MOCK_JENIS_ACARA: JenisAcara[] = [
  {
    id: 'ja-001',
    nama: 'Rapat',
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    templates: [
      {
        id: 'tpl-001',
        jenisAcaraId: 'ja-001',
        items: STANDAR_ITEMS_PROTOKOL_17,
      },
    ],
  },
  {
    id: 'ja-002',
    nama: 'Undangan Narasumber',
    aktif: true,
    createdAt: '2026-01-01T00:00:00Z',
    templates: [
      {
        id: 'tpl-003',
        jenisAcaraId: 'ja-002',
        items: STANDAR_ITEMS_PROTOKOL_17.map(item => ({
          ...item,
          templateChecklistId: 'tpl-003',
        })),
      },
    ],
  },
]

// ------------------------------------------------------------------
// KEGIATAN (with penugasan)
// ------------------------------------------------------------------

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]
const addDays = (d: Date, n: number) => {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}
// Tanggal demo statis Oktober 2026 agar selalu tampil di filter bulan Oktober
const DEMO_OKT_3 = '2026-10-03'
const DEMO_OKT_5 = '2026-10-05'
const DEMO_OKT_10 = '2026-10-10'

export const MOCK_KEGIATAN: Kegiatan[] = [
  {
    id: 'keg-001',
    nama: 'Rapat Koordinasi Tim Ekonomi Q4 2026',
    tanggal: fmt(today),
    jamMulai: '09:00',
    lokasi: 'Ruang Rapat Utama, Gedung DEN Lantai 5',
    penjabat: 'Ketua DEN',
    jenisAcaraId: 'ja-001',
    dibuatOleh: 'usr-002',
    softDeleted: false,
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    penugasan: [
      { id: 'ptu-001', kegiatanId: 'keg-001', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-005', 'usr-006'] },
      { id: 'ptu-002', kegiatanId: 'keg-001', role: UserRole.PERSIDANGAN, picIds: ['usr-007', 'usr-008'] },
      { id: 'ptu-003', kegiatanId: 'keg-001', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  {
    id: 'keg-002',
    nama: 'Undangan Narasumber: Pakar Transformasi Ekonomi Digital',
    tanggal: fmt(addDays(today, 2)),
    jamMulai: '13:30',
    lokasi: 'Auditorium DEN, Gedung Lantai 2',
    penjabat: 'Wakil Ketua DEN',
    jenisAcaraId: 'ja-002',
    dibuatOleh: 'usr-003',
    softDeleted: false,
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    penugasan: [
      { id: 'ptu-004', kegiatanId: 'keg-002', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-005'] },
      { id: 'ptu-005', kegiatanId: 'keg-002', role: UserRole.PERSIDANGAN, picIds: ['usr-007'] },
      { id: 'ptu-006', kegiatanId: 'keg-002', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  {
    id: 'keg-003',
    nama: 'Rapat Pleno Dewan Ekonomi Nasional',
    tanggal: fmt(addDays(today, -2)),
    jamMulai: '08:00',
    lokasi: 'Ruang Pleno, Gedung DEN Lantai 3',
    penjabat: 'Ketua DEN',
    jenisAcaraId: 'ja-001',
    dibuatOleh: 'usr-002',
    softDeleted: false,
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    penugasan: [
      { id: 'ptu-007', kegiatanId: 'keg-003', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-006'] },
      { id: 'ptu-008', kegiatanId: 'keg-003', role: UserRole.PERSIDANGAN, picIds: ['usr-007', 'usr-008'] },
      { id: 'ptu-009', kegiatanId: 'keg-003', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  {
    id: 'keg-004',
    nama: 'Rapat Pembahasan APBN 2027',
    tanggal: fmt(addDays(today, 5)),
    jamMulai: '10:00',
    lokasi: 'Ruang Rapat Kecil, Gedung DEN Lantai 4',
    penjabat: 'Anggota DEN',
    jenisAcaraId: 'ja-001',
    dibuatOleh: 'usr-002',
    softDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    penugasan: [
      { id: 'ptu-010', kegiatanId: 'keg-004', role: UserRole.PROTOKOL, picIds: ['usr-005'] },
      { id: 'ptu-011', kegiatanId: 'keg-004', role: UserRole.PERSIDANGAN, picIds: ['usr-008'] },
      { id: 'ptu-012', kegiatanId: 'keg-004', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  // ----------------------------------------------------------------
  // keg-005: Kegiatan Resmi Sesuai Panduan Laporan Protokol DEN
  // ----------------------------------------------------------------
  {
    id: 'keg-005',
    nama: 'Rapat Pembahasan Kebijakan Upah Minimum Tahun 2026',
    tanggal: DEMO_OKT_3,
    jamMulai: '10:00:00',
    lokasi: 'Ruang Rapat Utama, Gedung DEN Lantai 5',
    penjabat: 'Pimpinan Dewan Ekonomi Nasional',
    jenisAcaraId: 'ja-001',
    dibuatOleh: 'usr-002',
    softDeleted: false,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-03T07:30:00Z',
    penugasan: [
      { id: 'ptu-013', kegiatanId: 'keg-005', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-005', 'usr-006'] },
      { id: 'ptu-014', kegiatanId: 'keg-005', role: UserRole.PERSIDANGAN, picIds: ['usr-007', 'usr-008'] },
      { id: 'ptu-015', kegiatanId: 'keg-005', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  // keg-006: Undangan Narasumber
  {
    id: 'keg-006',
    nama: 'Undangan Narasumber: Transformasi Digital Sektor Keuangan',
    tanggal: DEMO_OKT_5,
    jamMulai: '13:30',
    lokasi: 'Auditorium DEN, Gedung Lantai 2',
    penjabat: 'Wakil Ketua DEN',
    jenisAcaraId: 'ja-002',
    dibuatOleh: 'usr-003',
    softDeleted: false,
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-02T09:00:00Z',
    penugasan: [
      { id: 'ptu-016', kegiatanId: 'keg-006', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-005'] },
      { id: 'ptu-017', kegiatanId: 'keg-006', role: UserRole.PERSIDANGAN, picIds: ['usr-007'] },
      { id: 'ptu-018', kegiatanId: 'keg-006', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
  // keg-007: Sidang Pleno DEN
  {
    id: 'keg-007',
    nama: 'Sidang Pleno DEN: Evaluasi Kebijakan Ekonomi Nasional & Transformasi Fiskal',
    tanggal: DEMO_OKT_10,
    jamMulai: '09:00',
    lokasi: 'Ruang Sidang Utama, Gedung DEN Lantai 5',
    penjabat: 'Ketua Dewan Ekonomi Nasional',
    jenisAcaraId: 'ja-001',
    dibuatOleh: 'usr-002',
    softDeleted: false,
    createdAt: '2026-10-08T08:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z',
    penugasan: [
      { id: 'ptu-019', kegiatanId: 'keg-007', role: UserRole.PROTOKOL, picIds: ['usr-004', 'usr-005', 'usr-006'] },
      { id: 'ptu-020', kegiatanId: 'keg-007', role: UserRole.PERSIDANGAN, picIds: ['usr-007', 'usr-008'] },
      { id: 'ptu-021', kegiatanId: 'keg-007', role: UserRole.HUMAS, picIds: ['usr-009'] },
    ],
  },
]

// ------------------------------------------------------------------
// MEDIA BUKTI DOKUMENTASI & PROTOKOL (Real Photos dari Panduan DEN)
// ------------------------------------------------------------------

export const MOCK_MEDIA: Media[] = [
  { id: 'med-001', urlAsli: '/mock/itm-001.jpg', urlKompresi: '/mock/itm-001.jpg', namaFile: 'itm-001.jpg', tipe: 'foto', ukuranBytes: 280000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-002', urlAsli: '/mock/itm-002.jpg', urlKompresi: '/mock/itm-002.jpg', namaFile: 'itm-002.jpg', tipe: 'foto', ukuranBytes: 250000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-003', urlAsli: '/mock/itm-003.jpg', urlKompresi: '/mock/itm-003.jpg', namaFile: 'itm-003.jpg', tipe: 'foto', ukuranBytes: 410000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-004', urlAsli: '/mock/itm-004.jpg', urlKompresi: '/mock/itm-004.jpg', namaFile: 'itm-004.jpg', tipe: 'foto', ukuranBytes: 275000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-005', urlAsli: '/mock/itm-005.jpg', urlKompresi: '/mock/itm-005.jpg', namaFile: 'itm-005.jpg', tipe: 'foto', ukuranBytes: 286000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-006', urlAsli: '/mock/itm-006.jpg', urlKompresi: '/mock/itm-006.jpg', namaFile: 'itm-006.jpg', tipe: 'foto', ukuranBytes: 326000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-007', urlAsli: '/mock/itm-007.jpg', urlKompresi: '/mock/itm-007.jpg', namaFile: 'itm-007.jpg', tipe: 'foto', ukuranBytes: 326000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-008', urlAsli: '/mock/itm-008.jpg', urlKompresi: '/mock/itm-008.jpg', namaFile: 'itm-008.jpg', tipe: 'foto', ukuranBytes: 291000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-010', urlAsli: '/mock/itm-010.jpg', urlKompresi: '/mock/itm-010.jpg', namaFile: 'itm-010.jpg', tipe: 'foto', ukuranBytes: 273000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-011', urlAsli: '/mock/itm-011.jpg', urlKompresi: '/mock/itm-011.jpg', namaFile: 'itm-011.jpg', tipe: 'foto', ukuranBytes: 303000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-012', urlAsli: '/mock/itm-012.jpg', urlKompresi: '/mock/itm-012.jpg', namaFile: 'itm-012.jpg', tipe: 'foto', ukuranBytes: 280000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-013', urlAsli: '/mock/itm-013.jpg', urlKompresi: '/mock/itm-013.jpg', namaFile: 'itm-013.jpg', tipe: 'foto', ukuranBytes: 284000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-014', urlAsli: '/mock/itm-014.jpg', urlKompresi: '/mock/itm-014.jpg', namaFile: 'itm-014.jpg', tipe: 'foto', ukuranBytes: 216000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-015', urlAsli: '/mock/itm-015.jpg', urlKompresi: '/mock/itm-015.jpg', namaFile: 'itm-015.jpg', tipe: 'foto', ukuranBytes: 271000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-016', urlAsli: '/mock/itm-016.jpg', urlKompresi: '/mock/itm-016.jpg', namaFile: 'itm-016.jpg', tipe: 'foto', ukuranBytes: 250000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
  { id: 'med-017', urlAsli: '/mock/itm-017.jpg', urlKompresi: '/mock/itm-017.jpg', namaFile: 'itm-017.jpg', tipe: 'foto', ukuranBytes: 309000, statusKompresi: 'selesai', pengunggahId: 'usr-006', createdAt: new Date().toISOString() },
]

// ------------------------------------------------------------------
// LAPORAN RESMI DEN (17 ITEM PERSIS SEPERTI LAPORAN ASLI)
// ------------------------------------------------------------------

export const FULL_JAWABAN_KEG005: Laporan['jawaban'] = [
  { id: 'jaw-d01', laporanId: 'lap-005', itemChecklistId: 'itm-001', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-001'] },
  { id: 'jaw-d02', laporanId: 'lap-005', itemChecklistId: 'itm-002', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-002'] },
  { id: 'jaw-d03', laporanId: 'lap-005', itemChecklistId: 'itm-003', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-003'] },
  { id: 'jaw-d04', laporanId: 'lap-005', itemChecklistId: 'itm-004', dicentang: true, keterangan: 'u shape', mediaIds: ['med-004'] },
  { id: 'jaw-d05', laporanId: 'lap-005', itemChecklistId: 'itm-005', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-005'] },
  { id: 'jaw-d06', laporanId: 'lap-005', itemChecklistId: 'itm-006', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-006'] },
  { id: 'jaw-d07', laporanId: 'lap-005', itemChecklistId: 'itm-007', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-007'] },
  { id: 'jaw-d08', laporanId: 'lap-005', itemChecklistId: 'itm-008', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-008'] },
  { id: 'jaw-d09', laporanId: 'lap-005', itemChecklistId: 'itm-009', dicentang: true, keterangan: 'ada di adc', mediaIds: [] },
  { id: 'jaw-d10', laporanId: 'lap-005', itemChecklistId: 'itm-010', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-010'] },
  { id: 'jaw-d11', laporanId: 'lap-005', itemChecklistId: 'itm-011', dicentang: true, keterangan: 'sudah disiapkan Led', mediaIds: ['med-011'] },
  { id: 'jaw-d12', laporanId: 'lap-005', itemChecklistId: 'itm-012', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-012'] },
  { id: 'jaw-d13', laporanId: 'lap-005', itemChecklistId: 'itm-013', dicentang: true, keterangan: 'sudah disiapkan mic rapat', mediaIds: ['med-013'] },
  { id: 'jaw-d14', laporanId: 'lap-005', itemChecklistId: 'itm-014', dicentang: true, keterangan: 'sudah disiapkan mic rapat', mediaIds: ['med-014'] },
  { id: 'jaw-d15', laporanId: 'lap-005', itemChecklistId: 'itm-015', dicentang: true, keterangan: 'pakai gelas kaca', mediaIds: ['med-015'] },
  { id: 'jaw-d16', laporanId: 'lap-005', itemChecklistId: 'itm-016', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-016'] },
  { id: 'jaw-d17', laporanId: 'lap-005', itemChecklistId: 'itm-017', dicentang: true, keterangan: 'sudah disiapkan', mediaIds: ['med-017'] },
]

export const MOCK_LAPORAN: Laporan[] = [
  // keg-005: LAPORAN RESMI DEMO 3 OKTOBER — SUDAH DISETUJUI (ACC)
  {
    id: 'lap-005',
    kegiatanId: 'keg-005',
    status: StatusLaporan.DISETUJUI,
    catatanPenutup: 'persiapan Sdh dicek keseluruhan , sudah siap',
    pembuatId: 'usr-006',
    disetujuiOlehId: 'usr-001',
    waktuPersetujuan: '2026-10-03T08:15:00Z',
    catatanRevisi: null,
    jawaban: FULL_JAWABAN_KEG005.map(j => ({
      ...j,
      fotoUrls: j.mediaIds && j.mediaIds.length > 0 ? [`/mock/${j.itemChecklistId}.jpg`] : [],
    })),
    snapshotItems: STANDAR_ITEMS_PROTOKOL_17,
    waktuPelaporan: '2026-10-03T08:00:00Z',
    createdAt: '2026-10-03T07:00:00Z',
    updatedAt: '2026-10-03T08:15:00Z',
  },
]

// ------------------------------------------------------------------
// DOKUMEN SIDANG
// ------------------------------------------------------------------

export const MOCK_DOKUMEN_SIDANG: DokumenSidang[] = [
  {
    id: 'sid-001',
    kegiatanId: 'keg-003',
    linkZoom: 'https://zoom.us/j/123456789',
    linkRecorder: 'https://drive.google.com/file/d/example-recorder',
    daftarHadirMediaId: 'med-001',
    notulenMediaId: null,
    bahanSidangMediaId: null,
    status: StatusPersidangan.BELUM_DI_SIDANG,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sid-002',
    kegiatanId: 'keg-007',
    linkZoom: 'https://zoom.us/j/987654321',
    linkRecorder: 'https://drive.google.com/file/d/recorder-pleno-10okt',
    daftarHadirMediaId: 'med-001',
    notulenMediaId: 'med-002',
    bahanSidangMediaId: 'med-001',
    status: StatusPersidangan.SELESAI_DI_SIDANG,
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T12:30:00Z',
  },
]

// ------------------------------------------------------------------
// DOKUMENTASI
// ------------------------------------------------------------------

export const MOCK_DOKUMENTASI: Dokumentasi[] = [
  {
    id: 'dok-001',
    kegiatanId: 'keg-003',
    linkVoiceRecord: '',
    linkVideo: '',
    fotoIds: ['med-001', 'med-002'],
    status: StatusDokumentasi.SUDAH_DIDOKUMENTASI,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dok-002',
    kegiatanId: 'keg-007',
    linkVoiceRecord: 'https://drive.google.com/file/d/voice-10okt',
    linkVideo: 'https://youtube.com/watch?v=demo-den',
    fotoIds: ['med-001', 'med-002'],
    status: StatusDokumentasi.SUDAH_DIDOKUMENTASI,
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T13:00:00Z',
  },
]

// ------------------------------------------------------------------
// AUDIT LOG
// ------------------------------------------------------------------

export const MOCK_AUDIT_LOG: AuditLog[] = [
  {
    id: 'aud-001',
    userId: 'usr-002',
    aksi: 'CREATE_KEGIATAN' as AuditAksi,
    detail: { kegiatanNama: 'Rapat Koordinasi Tim Ekonomi Q4 2026' },
    kegiatanId: 'keg-001',
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-002',
    userId: 'usr-004',
    aksi: 'SIMPAN_DRAF' as AuditAksi,
    detail: { laporanId: 'lap-002', fase: 'PERSIAPAN' },
    kegiatanId: 'keg-001',
    createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-003',
    userId: 'usr-001',
    aksi: 'LOGIN' as AuditAksi,
    detail: {},
    createdAt: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-004',
    userId: 'usr-006',
    aksi: 'SIMPAN_SIDANG' as AuditAksi,
    detail: { kegiatanId: 'keg-003', dokumenCount: 2 },
    kegiatanId: 'keg-003',
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-005',
    userId: 'usr-007',
    aksi: 'UPLOAD_FOTO' as AuditAksi,
    detail: { kegiatanId: 'keg-003', jumlahFoto: 12 },
    kegiatanId: 'keg-003',
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-006',
    userId: 'usr-001',
    aksi: 'CREATE_USER' as AuditAksi,
    detail: { username: 'protokol2', role: 'PROTOKOL' },
    createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-007',
    userId: 'usr-004',
    aksi: 'SIMPAN_LAPORAN' as AuditAksi,
    detail: { laporanId: 'lap-001', fase: 'PERSIAPAN' },
    kegiatanId: 'keg-003',
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
  },
]




// ------------------------------------------------------------------
// DASHBOARD STATS
// ------------------------------------------------------------------

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalKegiatan: 4,
  terlaksana: 1,
  terEvaluasi: 0,
  terDokumentasi: 1,
  terNotulensi: 0,
  pctTerlaksana: 25,
  pctTerEvaluasi: 0,
  pctTerDokumentasi: 25,
  pctTerNotulensi: 0,
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

/** Get kegiatan visible to a specific user based on their role and penugasan */
export function getKegiatanForUser(userId: string, role: UserRole): Kegiatan[] {
  if ([UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(role)) {
    return MOCK_KEGIATAN.filter(k => !k.softDeleted)
  }
  return MOCK_KEGIATAN.filter(k =>
    !k.softDeleted &&
    k.penugasan.some(p => p.picIds.includes(userId))
  )
}

/** Get laporan for a kegiatan */
export function getLaporanForKegiatan(kegiatanId: string): Laporan | undefined {
  return MOCK_LAPORAN.find(l => l.kegiatanId === kegiatanId)
}

/** Get user by id */
export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id)
}

/** Get jenis acara by id */
export function getJenisAcaraById(id: string): JenisAcara | undefined {
  return MOCK_JENIS_ACARA.find(j => j.id === id)
}

/** Get template checklist for jenis acara */
export function getTemplate(jenisAcaraId: string) {
  const ja = getJenisAcaraById(jenisAcaraId)
  return ja?.templates[0]
}
