// ============================================================
// SIAP-Pro: Utility Functions
// ============================================================

import { clsx, type ClassValue } from 'clsx'
import { StatusLaporan, StatusPersidangan, StatusDokumentasi, UserRole } from '@/types'

// ------------------------------------------------------------------
// Class Name Merger (Tailwind-compatible)
// ------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ------------------------------------------------------------------
// Date Formatting
// ------------------------------------------------------------------

/** Format ISO date string to "Senin, 30 September 2026" */
export function formatTanggalLong(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Format ISO date string to "30 Sep 2026" */
export function formatTanggalShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Format ISO datetime to "30 Sep 2026, 09:00" */
export function formatDatetime(isoString: string): string {
  return new Date(isoString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Get relative time string "2 hari yang lalu" */
export function relativeTime(isoString: string): string {
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  const diff = (new Date(isoString).getTime() - Date.now()) / 1000

  const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'seconds'],
    [3600, 'minutes'],
    [86400, 'hours'],
    [86400 * 30, 'days'],
    [86400 * 365, 'months'],
    [Infinity, 'years'],
  ]

  let prev = 1
  for (const [max, unit] of ranges) {
    if (Math.abs(diff) < max) {
      return rtf.format(Math.round(diff / prev), unit)
    }
    prev = max
  }
  return ''
}

// ------------------------------------------------------------------
// Status Helpers
// ------------------------------------------------------------------

export function getStatusLaporanLabel(status: StatusLaporan): string {
  const labels: Record<StatusLaporan, string> = {
    [StatusLaporan.BELUM_DILAPORKAN]: 'Belum Dilaporkan',
    [StatusLaporan.DRAF]: 'Draf',
    [StatusLaporan.MENUNGGU_PERSETUJUAN]: 'Menunggu Persetujuan',
    [StatusLaporan.DISETUJUI]: 'Disetujui (Terlaksana)',
    [StatusLaporan.PERLU_REVISI]: 'Perlu Revisi',
  }
  return labels[status] ?? 'Belum Dilaporkan'
}

export function getStatusLaporanBadge(status: StatusLaporan): 'red' | 'yellow' | 'blue' | 'green' {
  const map: Record<StatusLaporan, 'red' | 'yellow' | 'blue' | 'green'> = {
    [StatusLaporan.BELUM_DILAPORKAN]: 'red',
    [StatusLaporan.DRAF]: 'yellow',
    [StatusLaporan.MENUNGGU_PERSETUJUAN]: 'blue',
    [StatusLaporan.DISETUJUI]: 'green',
    [StatusLaporan.PERLU_REVISI]: 'red',
  }
  return map[status] ?? 'red'
}

export function getStatusPersidanganLabel(status: StatusPersidangan): string {
  const labels: Record<StatusPersidangan, string> = {
    [StatusPersidangan.BELUM_DI_SIDANG]: 'Belum di Sidang',
    [StatusPersidangan.SELESAI_DI_SIDANG]: 'Selesai di Sidang',
  }
  return labels[status]
}

export function getStatusDokumentasiLabel(status: StatusDokumentasi): string {
  const labels: Record<StatusDokumentasi, string> = {
    [StatusDokumentasi.BELUM_DIDOKUMENTASI]: 'Belum Didokumentasi',
    [StatusDokumentasi.SUDAH_DIDOKUMENTASI]: 'Sudah Didokumentasi',
  }
  return labels[status]
}

// ------------------------------------------------------------------
// Role Helpers
// ------------------------------------------------------------------

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.KABAG]: 'Kabag',
    [UserRole.KASUBBAG]: 'Kasubbag',
    [UserRole.PROTOKOL]: 'Protokol',
    [UserRole.PERSIDANGAN]: 'Persidangan',
    [UserRole.HUMAS]: 'Humas',
  }
  return labels[role]
}

export function isAdminRole(role: UserRole): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(role)
}

export function canAccessPenugasan(role: UserRole): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG].includes(role)
}

// ------------------------------------------------------------------
// File Utilities
// ------------------------------------------------------------------

/** Format bytes to human readable string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Compute simple hash for duplicate photo detection */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

/** Check if file is valid image type */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/** Check if file is valid PDF */
export function isValidPdfFile(file: File): boolean {
  return file.type === 'application/pdf'
}

// ------------------------------------------------------------------
// Number / Percentage Helpers
// ------------------------------------------------------------------

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

export function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value))
}

// ------------------------------------------------------------------
// String Utilities
// ------------------------------------------------------------------

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

// ------------------------------------------------------------------
// DOM / PWA Helpers
// ------------------------------------------------------------------

/** Check if Web Share API is available */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

/** Share via Web Share API with fallback to download */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<void> {
  if (canShare()) {
    const file = new File([blob], filename, { type: blob.type })
    await navigator.share({ title, files: [file] })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
