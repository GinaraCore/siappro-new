// ============================================================
// SIAP-Pro — Core Type Definitions
// Based on PRD v2.0, Section 6 (Model Data)
// ============================================================

// ------------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------------

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  KABAG = 'KABAG',
  KASUBBAG = 'KASUBBAG',
  PROTOKOL = 'PROTOKOL',
  PERSIDANGAN = 'PERSIDANGAN',
  HUMAS = 'HUMAS',
}

export enum StatusLaporan {
  BELUM_DILAPORKAN = 'BELUM_DILAPORKAN',
  DRAF = 'DRAF',
  MENUNGGU_PERSETUJUAN = 'MENUNGGU_PERSETUJUAN',
  DISETUJUI = 'DISETUJUI',
  PERLU_REVISI = 'PERLU_REVISI',
}

export enum StatusPersidangan {
  BELUM_DI_SIDANG = 'BELUM_DI_SIDANG',
  SELESAI_DI_SIDANG = 'SELESAI_DI_SIDANG',
}

export enum StatusDokumentasi {
  BELUM_DIDOKUMENTASI = 'BELUM_DIDOKUMENTASI',
  SUDAH_DIDOKUMENTASI = 'SUDAH_DIDOKUMENTASI',
}


// ------------------------------------------------------------------
// USER
// ------------------------------------------------------------------

export interface User {
  id: string
  nama: string
  username: string
  /** bcrypt hashed password — never expose to client */
  passwordHash?: string
  role: UserRole
  aktif: boolean
  createdAt: string
  updatedAt: string
}

/** Safe user type (no password hash) for client-side use */
export type UserPublic = Omit<User, 'passwordHash'>

// ------------------------------------------------------------------
// JENIS ACARA & TEMPLATE CHECKLIST
// ------------------------------------------------------------------

export interface ItemChecklist {
  id: string
  templateChecklistId: string
  kelompok: string           // e.g. "Protokol Tempat Acara"
  nomor: number
  teks: string               // e.g. "Laser Pointer"
  wajib: boolean             // mandatory or optional
  wajibFoto: boolean         // must include photo evidence
  urutan: number
  aktif: boolean
}

export interface TemplateChecklist {
  id: string
  jenisAcaraId: string
  items: ItemChecklist[]
}

export interface JenisAcara {
  id: string
  nama: string               // e.g. "Rapat", "Undangan Narasumber"
  templates: TemplateChecklist[]
  aktif: boolean
  createdAt: string
}

// ------------------------------------------------------------------
// KEGIATAN & PENUGASAN
// ------------------------------------------------------------------

export interface Penugasan {
  id: string
  kegiatanId: string
  role: UserRole.PROTOKOL | UserRole.PERSIDANGAN | UserRole.HUMAS
  picIds: string[]           // can be more than one per role
  pics?: UserPublic[]        // populated on read
}

export interface Kegiatan {
  id: string
  nama: string
  tanggal: string            // ISO date string e.g. "2026-10-01"
  jamMulai: string           // e.g. "08:00"
  lokasi: string
  penjabat: string           // pejabat yang difasilitasi
  jenisAcaraId: string
  jenisAcara?: JenisAcara    // populated on read
  dibuatOleh: string         // userId
  penugasan: Penugasan[]
  softDeleted: boolean
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------------
// LAPORAN (Satu laporan per kegiatan)
// ------------------------------------------------------------------

export interface JawabanChecklist {
  id: string
  laporanId: string
  itemChecklistId: string
  itemChecklist?: ItemChecklist   // populated on read
  dicentang: boolean
  keterangan: string
  mediaIds: string[]         // array of Media.id
  media?: Media[]            // populated on read
  fotoUrls?: string[]        // direct data URLs / photo URLs
}

export interface Laporan {
  id: string
  kegiatanId: string
  kegiatan?: Kegiatan        // populated on read
  status: StatusLaporan
  catatanPenutup: string
  pembuatId: string          // userId
  pembuat?: UserPublic       // populated on read
  disetujuiOlehId?: string | null
  disetujuiOleh?: UserPublic | null
  waktuPersetujuan?: string | null
  catatanRevisi?: string | null
  jawaban: JawabanChecklist[]
  /** Snapshot of checklist items at time of creation (immutable) */
  snapshotItems: ItemChecklist[]
  waktuPelaporan: string | null
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------------
// MEDIA (Foto & File)
// ------------------------------------------------------------------

export type MediaTipe = 'foto' | 'dokumen_pdf' | 'audio' | 'video'

export interface Media {
  id: string
  urlAsli: string            // original high-res file URL
  urlKompresi: string | null // compressed ≤1MB version URL
  namaFile: string
  tipe: MediaTipe
  ukuranBytes: number
  statusKompresi: 'pending' | 'selesai' | 'gagal'
  pengunggahId: string
  createdAt: string
}

// ------------------------------------------------------------------
// DOKUMEN SIDANG (Persidangan module)
// ------------------------------------------------------------------

export interface DokumenSidang {
  id: string
  kegiatanId: string
  kegiatan?: Kegiatan        // populated on read
  linkZoom: string
  linkRecorder: string
  daftarHadirMediaId: string | null
  daftarHadir?: Media
  notulenMediaId: string | null   // optional
  notulen?: Media
  bahanSidangMediaId: string | null
  bahanSidang?: Media
  status: StatusPersidangan
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------------
// DOKUMENTASI (Humas module)
// ------------------------------------------------------------------

export interface Dokumentasi {
  id: string
  kegiatanId: string
  kegiatan?: Kegiatan        // populated on read
  linkVoiceRecord: string
  linkVideo: string
  fotoIds: string[]
  fotos?: Media[]            // populated on read
  status: StatusDokumentasi
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------------
// CATATAN REVIEW (Kabag/Kasubbag notes on reports)
// ------------------------------------------------------------------

export interface CatatanReview {
  id: string
  laporanId: string
  penulisId: string
  penulis?: UserPublic
  teks: string
  createdAt: string
}

// ------------------------------------------------------------------
// AUDIT LOG
// ------------------------------------------------------------------

export type AuditAksi =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_KEGIATAN'
  | 'UPDATE_KEGIATAN'
  | 'DELETE_KEGIATAN'
  | 'UPDATE_PENUGASAN'
  | 'SIMPAN_LAPORAN'
  | 'SIMPAN_DRAF'
  | 'UPLOAD_FOTO'
  | 'HAPUS_FOTO'
  | 'SIMPAN_SIDANG'
  | 'SIMPAN_DOKUMENTASI'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'RESET_PASSWORD'
  | 'UPDATE_TEMPLATE'

export interface AuditLog {
  id: string
  userId: string
  user?: UserPublic
  aksi: AuditAksi
  detail: Record<string, unknown>  // context payload
  kegiatanId?: string
  ipAddress?: string
  createdAt: string
}

// ------------------------------------------------------------------
// DASHBOARD STATS
// ------------------------------------------------------------------

export interface DashboardStats {
  totalKegiatan: number
  terlaksana: number          // laporan Pelaksanaan = Sudah Dilaporkan
  terEvaluasi: number         // TBD — awaiting OQ-6
  terDokumentasi: number      // ada ≥1 foto
  terNotulensi: number        // file notulen terunggah
  /** Computed percentages */
  pctTerlaksana: number
  pctTerEvaluasi: number
  pctTerDokumentasi: number
  pctTerNotulensi: number
}

// ------------------------------------------------------------------
// AUTH SESSION
// ------------------------------------------------------------------

export interface Session {
  user: UserPublic
  accessToken: string
  expiresAt: string
}
