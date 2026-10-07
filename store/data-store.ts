'use client'

// ============================================================
// SIAP-Pro — Global Data Store (Zustand + Persist)
// Semua CRUD disimpan di memory/storage browser (localStorage)
// untuk kebutuhan demo interaktif yang persisten antar navigasi & refresh.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Kegiatan,
  Laporan,
  StatusLaporan,
  StatusPersidangan,
  StatusDokumentasi,
  UserRole,
} from '@/types'
import {
  MOCK_KEGIATAN,
  MOCK_LAPORAN,
  MOCK_DOKUMEN_SIDANG,
  MOCK_DOKUMENTASI,
} from '@/lib/mock-data'

// ------------------------------------------------------------------
// Slim persidangan/dokumentasi in-memory records
// ------------------------------------------------------------------
export interface SidangRecord {
  kegiatanId: string
  linkZoom: string
  linkRecorder: string
  daftarHadirNama: string | null
  notulenNama: string | null
  bahanSidangNama: string | null
  status: StatusPersidangan
  updatedAt: string
}

export interface DokumentasiRecord {
  kegiatanId: string
  linkVoiceRecord: string
  linkVideo: string
  fotoUrls: string[]     // object URLs from File inputs
  fotoCount: number
  status: StatusDokumentasi
  updatedAt: string
}

// ------------------------------------------------------------------
// Store Shape
// ------------------------------------------------------------------
interface DataState {
  kegiatan: Kegiatan[]
  laporan: Laporan[]
  sidang: SidangRecord[]
  dokumentasi: DokumentasiRecord[]

  // Kegiatan CRUD
  addKegiatan: (keg: Kegiatan) => void
  updateKegiatan: (keg: Kegiatan) => void
  softDeleteKegiatan: (id: string) => void

  // Laporan CRUD
  upsertLaporan: (lap: Laporan) => void
  approveLaporan: (kegiatanId: string, adminUserId: string) => void
  rejectLaporan: (kegiatanId: string, adminUserId: string, catatanRevisi: string) => void

  // Persidangan CRUD
  upsertSidang: (rec: SidangRecord) => void

  // Dokumentasi CRUD
  upsertDokumentasi: (rec: DokumentasiRecord) => void

  // Demo helper
  resetDemoData: () => void

  // Helpers
  getKegiatanForUser: (userId: string, role: UserRole) => Kegiatan[]
}

// ------------------------------------------------------------------
// Seed from mock data
// ------------------------------------------------------------------
function seedSidang(): SidangRecord[] {
  return MOCK_DOKUMEN_SIDANG.map(d => ({
    kegiatanId: d.kegiatanId,
    linkZoom: d.linkZoom,
    linkRecorder: d.linkRecorder,
    daftarHadirNama: d.daftarHadirMediaId ? 'daftar-hadir-rapat-pleno.pdf' : null,
    notulenNama: d.notulenMediaId ? 'notulen.pdf' : null,
    bahanSidangNama: d.bahanSidangMediaId ? 'bahan-sidang.pdf' : null,
    status: d.status,
    updatedAt: d.updatedAt,
  }))
}

function seedDokumentasi(): DokumentasiRecord[] {
  return MOCK_DOKUMENTASI.map(d => ({
    kegiatanId: d.kegiatanId,
    linkVoiceRecord: d.linkVoiceRecord,
    linkVideo: d.linkVideo,
    fotoUrls: d.fotoIds.map(id => `/mock/${id.replace('med-00', 'itm-00')}.jpg`),
    fotoCount: d.fotoIds.length,
    status: d.status,
    updatedAt: d.updatedAt,
  }))
}

// ------------------------------------------------------------------
// Store with Browser Local Storage Persistence
// ------------------------------------------------------------------
export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      kegiatan: [...MOCK_KEGIATAN],
      laporan: [...MOCK_LAPORAN],
      sidang: seedSidang(),
      dokumentasi: seedDokumentasi(),

      addKegiatan: (keg) =>
        set(s => ({
          kegiatan: [keg, ...s.kegiatan.filter(k => k.id !== keg.id)],
        })),

      updateKegiatan: (keg) =>
        set(s => ({
          kegiatan: s.kegiatan.map(k => k.id === keg.id ? keg : k),
        })),

      softDeleteKegiatan: (id) =>
        set(s => ({
          kegiatan: s.kegiatan.map(k => k.id === id ? { ...k, softDeleted: true } : k),
        })),

      upsertLaporan: (lap) =>
        set(s => {
          const existsById = s.laporan.some(l => l.id === lap.id)
          const existsByKegiatan = s.laporan.some(l => l.kegiatanId === lap.kegiatanId)
          return {
            laporan: existsById
              ? s.laporan.map(l => l.id === lap.id ? lap : l)
              : existsByKegiatan
                ? s.laporan.map(l => l.kegiatanId === lap.kegiatanId ? lap : l)
                : [lap, ...s.laporan],
          }
        }),

      approveLaporan: (kegiatanId, adminUserId) =>
        set(s => ({
          laporan: s.laporan.map(l =>
            l.kegiatanId === kegiatanId
              ? {
                  ...l,
                  status: StatusLaporan.DISETUJUI,
                  disetujuiOlehId: adminUserId,
                  waktuPersetujuan: new Date().toISOString(),
                  catatanRevisi: null,
                  updatedAt: new Date().toISOString(),
                }
              : l
          ),
        })),

      rejectLaporan: (kegiatanId, adminUserId, catatanRevisi) =>
        set(s => ({
          laporan: s.laporan.map(l =>
            l.kegiatanId === kegiatanId
              ? {
                  ...l,
                  status: StatusLaporan.PERLU_REVISI,
                  disetujuiOlehId: adminUserId,
                  waktuPersetujuan: new Date().toISOString(),
                  catatanRevisi,
                  updatedAt: new Date().toISOString(),
                }
              : l
          ),
        })),

      upsertSidang: (rec) =>
        set(s => {
          const exists = s.sidang.some(d => d.kegiatanId === rec.kegiatanId)
          return {
            sidang: exists
              ? s.sidang.map(d => d.kegiatanId === rec.kegiatanId ? rec : d)
              : [rec, ...s.sidang],
          }
        }),

      upsertDokumentasi: (rec) =>
        set(s => {
          const exists = s.dokumentasi.some(d => d.kegiatanId === rec.kegiatanId)
          return {
            dokumentasi: exists
              ? s.dokumentasi.map(d => d.kegiatanId === rec.kegiatanId ? rec : d)
              : [rec, ...s.dokumentasi],
          }
        }),

      resetDemoData: () =>
        set({
          kegiatan: [...MOCK_KEGIATAN],
          laporan: [...MOCK_LAPORAN],
          sidang: seedSidang(),
          dokumentasi: seedDokumentasi(),
        }),

      getKegiatanForUser: (userId, role) => {
        const { kegiatan } = get()
        if ([UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(role)) {
          return kegiatan.filter(k => !k.softDeleted)
        }
        return kegiatan.filter(k =>
          !k.softDeleted &&
          (k.dibuatOleh === userId || k.penugasan.some(p => p.picIds.includes(userId)))
        )
      },
    }),
    {
      name: 'siappro-data-storage-v6',
      partialize: (state) => ({
        kegiatan: state.kegiatan,
        laporan: state.laporan,
        sidang: state.sidang,
        dokumentasi: state.dokumentasi,
      }),
    }
  )
)

// ------------------------------------------------------------------
// Selector hooks
// ------------------------------------------------------------------
export const useKegiatan = () => useDataStore(s => s.kegiatan.filter(k => !k.softDeleted))
export const useLaporan = () => useDataStore(s => s.laporan)
export const useSidang = () => useDataStore(s => s.sidang)
export const useDokumentasi = () => useDataStore(s => s.dokumentasi)
