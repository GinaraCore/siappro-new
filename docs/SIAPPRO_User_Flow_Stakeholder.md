---
title: "SIAP-Pro — Dokumen Alur Pengguna untuk Tinjauan Stakeholder"
subtitle: "Dewan Ekonomi Nasional Republik Indonesia"
version: "v2.0 Draft"
date: "Oktober 2026"
status: "Untuk Ditinjau"
---

# SIAP-Pro
## Sistem Informasi & Aplikasi Protokoler
### Dokumen Alur Pengguna — Untuk Tinjauan Stakeholder

| | |
|---|---|
| **Instansi** | Dewan Ekonomi Nasional Republik Indonesia |
| **Versi Dokumen** | 2.0 (Draft untuk Review) |
| **Tanggal** | Oktober 2026 |
| **Status** | Untuk Ditinjau dan Dikonfirmasi |
| **Ditujukan Kepada** | Pimpinan & Stakeholder DEN RI |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Masalah](#2-latar-belakang--masalah)
3. [Peran Pengguna](#3-peran-pengguna)
4. [Alur Global Aplikasi](#4-alur-global-aplikasi)
5. [Alur per Peran Pengguna](#5-alur-per-peran-pengguna)
   - 5.1 [Super Admin / Kabag / Kasubbag — Penugasan](#51-super-admin--kabag--kasubbag--penugasan)
   - 5.2 [User Protokol — Pelaporan Kegiatan](#52-user-protokol--pelaporan-kegiatan)
   - 5.3 [User Persidangan — Dokumen Sidang](#53-user-persidangan--dokumen-sidang)
   - 5.4 [User Humas — Dokumentasi Foto & Video](#54-user-humas--dokumentasi-foto--video)
6. [Sistem Status Kegiatan](#6-sistem-status-kegiatan)
7. [Output PDF Laporan](#7-output-pdf-laporan)
8. [Fitur Utama Ringkasan](#8-fitur-utama-ringkasan)
9. [Skenario Pengecualian](#9-skenario-pengecualian)
10. [Rencana Rilis Bertahap](#10-rencana-rilis-bertahap)
11. [Poin yang Memerlukan Konfirmasi Klien](#11-poin-yang-memerlukan-konfirmasi-klien)

---

## 1. Ringkasan Eksekutif

**SIAP-Pro** (Sistem Informasi & Aplikasi Protokoler) adalah aplikasi web berbasis *mobile-first* yang dirancang untuk mendigitalkan seluruh proses kerja keprotokolan Dewan Ekonomi Nasional Republik Indonesia.

### Masalah yang Diselesaikan

Saat ini, koordinasi persiapan dan pelaporan kegiatan protokol dilakukan secara manual melalui grup WhatsApp — foto bukti dan keterangan tersebar, sulit dilacak per kegiatan, dan tidak tersedia dalam format yang rapi untuk dilaporkan kepada pimpinan.

### Solusi yang Dihadirkan

| Kebutuhan | Solusi di SIAP-Pro |
|---|---|
| Penjadwalan & penugasan staf | Modul Penugasan berbasis kalender |
| Pelaporan persiapan lapangan | Checklist + foto bukti langsung dari HP |
| Dokumen sidang terpusat | Modul Persidangan: notulen, daftar hadir, bahan |
| Foto & video kegiatan | Modul Dokumentasi sebagai bank data internal |
| Laporan siap baca pimpinan | Ekspor PDF ber-kop otomatis, bisa langsung dibagikan ke WhatsApp |

### Platform

Aplikasi ini berjalan sebagai **web app di browser HP** (tidak perlu instalasi dari App Store/Play Store). Dapat ditambahkan ke *home screen* layaknya aplikasi biasa.

---

## 2. Latar Belakang & Masalah

Tim keprotokolan DEN bertugas mendukung kegiatan pimpinan: rapat, penerimaan narasumber, dan kegiatan resmi lainnya. Tantangan yang dihadapi saat ini:

- Pelaporan persiapan dan pelaksanaan dilakukan lewat **grup WhatsApp** — tersebar dan tidak terstruktur.
- Tidak ada **rekam jejak per kegiatan** yang bisa dikonsultasi kembali.
- Tidak ada **standar format laporan** yang konsisten dan rapi untuk pimpinan.
- Dokumen sidang (notulen, daftar hadir) disimpan di berbagai tempat dan sulit diakses terpusat.
- Foto dokumentasi tersebar dan tidak terintegrasi dengan laporan kegiatan.

SIAP-Pro hadir untuk menjawab semua ini dalam satu platform terpadu.

---

## 3. Peran Pengguna

Aplikasi menggunakan sistem **otorisasi berbasis peran**. Setiap akun memiliki peran tetap yang menentukan modul apa saja yang dapat diakses.

| Peran | Akses Modul | Tanggung Jawab |
|---|---|---|
| **Super Admin** | Semua modul + manajemen user + template checklist | Pengelola sistem secara keseluruhan |
| **Kabag / Kasubbag** | Dashboard, Penugasan, semua laporan (baca), catatan review | Menjadwalkan kegiatan, menugaskan staf, memantau status |
| **User Protokol** | Modul Pelaporan Kegiatan | Mengisi checklist persiapan & pelaksanaan dengan foto bukti |
| **User Persidangan** | Modul Persidangan | Mengunggah daftar hadir, notulen, bahan sidang, link Zoom |
| **User Humas** | Modul Dokumentasi | Mengunggah foto & video kegiatan |

> **Catatan keamanan:** Menu modul di luar peran pengguna **tidak ditampilkan** di antarmuka, dan akses langsung via URL pun **ditolak di server**. Pembatasan ini aktif di dua lapis.

---

## 4. Alur Global Aplikasi

Semua pengguna, tanpa terkecuali, mengawali sesi lewat halaman login yang sama. Setelah autentikasi berhasil, sistem secara otomatis mengarahkan ke **dashboard dan modul sesuai peran**.

```
Buka SIAP-Pro di browser HP
            │
            ▼
      Halaman Login
            │
    ┌───────┴───────┐
    │               │
Kredensial     Kredensial
  Salah           Benar
    │               │
    ▼               ▼
Pesan Error   Dashboard Sesuai Peran
Coba Lagi           │
          ┌─────────┼──────────┬──────────┐
          │         │          │          │
          ▼         ▼          ▼          ▼
    Penugasan  Pelaporan  Persidangan Dokumentasi
   (Admin/     Kegiatan   (Sidang)    (Humas)
    Kabag)     (Protokol)
```

---

## 5. Alur per Peran Pengguna

---

### 5.1 Super Admin / Kabag / Kasubbag — Penugasan

Kabag/Kasubbag bertugas membuat jadwal kegiatan dan menugaskan staf (PIC) per peran. Setelah disimpan, kegiatan langsung muncul di kalender dan di akun masing-masing PIC yang ditunjuk.

#### Diagram Alur Penugasan

```
Buka menu Penugasan
        │
        ▼
Tampilan Kalender Kegiatan
        │
        ▼
Pilih Tanggal → Klik "Tambah Penugasan"
        │
        ▼
Isi Formulir Kegiatan:
  • Nama Kegiatan
  • Tanggal & Jam Mulai
  • Lokasi
  • Penjabat yang Difasilitasi
  • Jenis Acara (Rapat / Undangan Narasumber / dll.)
        │
        ▼
Sistem Memuat Template Checklist
Sesuai Jenis Acara Secara Otomatis
        │
        ▼
Tunjuk PIC per Peran:
  • PIC Protokol     (boleh lebih dari 1 orang)
  • PIC Persidangan  (boleh lebih dari 1 orang)
  • PIC Humas        (boleh lebih dari 1 orang)
        │
        ▼
     Data Lengkap?
  ┌──────┴──────┐
 Tidak         Ya
  │             │
  ▼             ▼
Kembali      Simpan
ke Form         │
                ▼
   Kegiatan muncul di Kalender
   & di akun tiap PIC sesuai perannya
```

#### Fitur Kunci Penugasan

| Fitur | Keterangan |
|---|---|
| Kalender visual | Tampilan per bulan/minggu, tanggal dengan kegiatan ditandai |
| Template otomatis | Jenis acara menentukan checklist yang dipakai staf |
| Multi-PIC per peran | Satu peran bisa dipegang beberapa orang sekaligus |
| Ubah / batalkan | Jadwal dan PIC bisa diubah; perubahan tercatat di log |
| Visibilitas terbatas | Hanya PIC yang ditunjuk yang melihat kegiatan di akunnya |

---

### 5.2 User Protokol — Pelaporan Kegiatan

User Protokol bertugas mengisi checklist persiapan dan pelaksanaan kegiatan, dilengkapi foto bukti (*evidence*), langsung dari lapangan via HP. Laporan yang lengkap dapat langsung diekspor sebagai PDF dan dibagikan ke grup WhatsApp.

#### Diagram Alur Pelaporan

```
Buka menu Pelaporan Kegiatan
        │
        ▼
Kalender → Pilih Tanggal
        │
        ▼
Daftar Kartu Kegiatan yang Menugaskan Saya
(Kartu Merah = belum dilaporkan, Hijau = sudah)
        │
        ▼
Pilih Kegiatan → Pilih Fase:
  ┌──────────┴──────────┐
  │                     │
  ▼                     ▼
PERSIAPAN           PELAKSANAAN
(sebelum acara)     (saat/sesudah acara)
  │                     │
  └──────────┬──────────┘
             │
             ▼
Buka Checklist (sesuai Jenis Acara yang dipilih Admin)
  Untuk tiap item:
  [✓] Centang item
  [✎] Isi keterangan
  [📷] Ambil foto / unggah dari galeri
             │
             ▼
        Simpan sebagai?
  ┌──────────┴──────────┐
  │                     │
  ▼                     ▼
DRAF              SIMPAN LAPORAN
(sementara,       (validasi item wajib)
status tetap            │
merah)          ┌───────┴────────┐
                │                │
          Ada item wajib    Semua item wajib
          kosong            terpenuhi
                │                │
                ▼                ▼
          Ditandai,        STATUS HIJAU:
          isi kembali      "Sudah Dilaporkan"
                                 │
                                 ▼
                      Tombol Download PDF
                                 │
                                 ▼
                    PDF ber-kop DEN RI dibuat otomatis
                                 │
                                 ▼
                    Bagikan ke WhatsApp / Simpan ke HP
```

#### Fitur Kunci Pelaporan

| Fitur | Keterangan |
|---|---|
| Checklist per jenis acara | Template berbeda untuk Rapat, Undangan Narasumber, dll. |
| Foto bukti (*evidence*) | Ambil dari kamera HP atau pilih dari galeri |
| Simpan sebagai draf | Bisa dilanjutkan nanti tanpa kehilangan isian |
| Validasi item wajib | Laporan hanya "hijau" jika semua item wajib terisi |
| Status visual merah/hijau | Langsung terlihat mana yang sudah dan belum dilaporkan |
| Ekspor PDF | Laporan ber-kop DEN RI, siap bagikan ke pimpinan |
| Fleksibilitas unggah foto | Foto bukti dapat diunggah bebas tanpa batasan duplikasi (satu foto dokumentasi dapat digunakan pada beberapa butir terkait) |
| Mode sinyal lemah | Foto masuk antrean dan dicoba ulang otomatis jika koneksi terputus |

---

### 5.3 User Persidangan — Dokumen Sidang

User Persidangan bertugas mengarsipkan seluruh kelengkapan dokumen sidang: link konferensi, daftar hadir, notulen, dan bahan sidang. Hanya kegiatan yang secara eksplisit menugaskan user tersebut yang tampil di daftarnya.

#### Diagram Alur Persidangan

```
Buka menu Persidangan
        │
        ▼
Pilih Tahun & Bulan
        │
        ▼
Daftar Kegiatan (hanya yang menugaskan saya):
  [Belum di Sidang]     [Selesai di Sidang]
        │
        ▼
Pilih Kartu Kegiatan
        │
        ▼
Isi Formulir Dokumen Sidang:
  • Tempel Link Zoom
  • Tempel Link Recorder / Rekaman
  • Unggah Daftar Hadir      (file)
  • Unggah Hasil Notulen     (file, OPSIONAL)
  • Unggah Bahan Sidang PDF  (file)
        │
        ▼
      Simpan
        │
  ┌─────┴──────────────┐
  │                    │
Syarat            Syarat Belum
Terpenuhi         Terpenuhi
  │                    │
  ▼                    ▼
Status:           Tetap "Belum di Sidang"
"Selesai          Kartu ditandai merah
di Sidang"
```

#### Fitur Kunci Persidangan

| Fitur | Keterangan |
|---|---|
| Filter per bulan/tahun | Navigasi mudah ke arsip kegiatan lama |
| Unggah file dokumen | Daftar hadir, notulen, bahan sidang (unggah file, bukan diketik) |
| Notulen opsional | Kegiatan bisa selesai tanpa notulen jika memang tidak ada |
| Visibilitas terbatas | Hanya melihat kegiatan yang menugaskan user ini |
| Indikator status | Merah = belum lengkap, Hijau = dokumen sudah semua |

---

### 5.4 User Humas — Dokumentasi Foto & Video

User Humas (Fotografer/Videografer) bertugas mengarsipkan foto dan video kegiatan. Modul ini berfungsi layaknya **"Google Drive khusus DEN"** — bank data visual yang terintegrasi dengan sistem, bisa difilter per tanggal.

#### Diagram Alur Dokumentasi

```
Buka menu Dokumentasi
        │
        ▼
Bank Data Kegiatan — Filter per Tanggal
        │
        ▼
Pilih Kartu Kegiatan
        │
        ▼
Isi Formulir Dokumentasi:
  • Tempel Link Voice Record
  • Tempel Link Video (YouTube, Drive, dll.)
  • Unggah Foto Kegiatan
      → Sistem simpan file asli (resolusi penuh)
      → Sistem buat versi terkompresi otomatis
         untuk tampilan & PDF (di latar belakang)
        │
        ▼
Hapus atau Ganti Foto jika Perlu
        │
        ▼
      Simpan
        │
        ▼
Status: "Sudah Didokumentasi"
```

#### Fitur Kunci Dokumentasi

| Fitur | Keterangan |
|---|---|
| Bank data foto/video | Terpusat, difilter per tanggal kegiatan |
| Simpan file asli | Foto resolusi penuh tersimpan untuk arsip jangka panjang |
| Versi terkompresi otomatis | Sistem buat versi kecil di latar belakang untuk tampilan & PDF |
| Link eksternal | Mendukung link voice record dan video dari platform eksternal |
| Hapus & ganti | Foto bisa dihapus atau diganti sebelum status final |

---

## 6. Sistem Status Kegiatan

### 6.1 Status Laporan (per Fase: Persiapan & Pelaksanaan)

Setiap fase memiliki status independen yang ditampilkan dengan warna yang langsung dapat dibaca:

| Status | Warna | Arti |
|---|---|---|
| **Belum Dilaporkan** | Merah | Belum ada isian, atau ada item wajib yang belum terisi |
| **Draf** | Kuning | Sudah ada isian sebagian, belum disimpan final |
| **Sudah Dilaporkan** | Hijau | Seluruh item wajib tercentang dan tersimpan |

#### Alur Perubahan Status

```
[Baru dibuat] ──► BELUM DILAPORKAN (Merah)
                        │
              ┌─────────┴──────────┐
              │                    │
         Simpan Draf          Simpan Final
              │               (semua item wajib ok)
              ▼                    │
           DRAF (Kuning)           ▼
              │              SUDAH DILAPORKAN (Hijau)
              │                    │
              └── lanjut isi ──────┘
                                   │
                           (jika dibuka kembali oleh admin)
                                   │
                                   ▼
                         BELUM DILAPORKAN (Merah)
```

### 6.2 Status Persidangan & Dokumentasi

| Modul | Status Awal | Status Selesai |
|---|---|---|
| Persidangan | Belum di Sidang (Merah) | Selesai di Sidang (Hijau) |
| Dokumentasi | Belum Didokumentasi (Merah) | Sudah Didokumentasi (Hijau) |

---

## 7. Output PDF Laporan

Setelah laporan persiapan berstatus hijau, User Protokol dapat mengunduh PDF yang secara otomatis dibuat sistem dengan format baku instansi:

### Komponen PDF Laporan Persiapan

| Elemen | Detail |
|---|---|
| **Kop Surat** | Logo Garuda Emas dengan teks "DEWAN EKONOMI NASIONAL REPUBLIK INDONESIA" |
| **Judul** | "LAPORAN PERSIAPAN" |
| **Identitas Kegiatan** | Nama agenda, tanggal, waktu pelaksanaan |
| **Daftar Tim** | Dikelompokkan per divisi: Protokol, Persidangan, Dokumentasi |
| **Tabel Checklist** | Kolom: No. — Daftar Pengecekan — Keterangan — Foto Bukti (Evidence) |
| **Penutup** | Catatan penutup & nama pembuat laporan |

### Cara Distribusi

1. Tekan tombol **Download PDF** di halaman laporan.
2. Sistem membuat PDF ber-kop secara otomatis (kurang dari 10 detik).
3. Tekan tombol **Bagikan** — PDF langsung bisa dikirim ke grup WhatsApp atau disimpan di HP.

---

## 8. Fitur Utama Ringkasan

| Fitur | Peran yang Menggunakan |
|---|---|
| Login & Otorisasi Berbasis Peran | Semua peran |
| Dashboard dengan 4 Indikator Kinerja | Admin / Kabag / Kasubbag |
| Kalender Penugasan | Admin / Kabag / Kasubbag |
| Template Checklist per Jenis Acara | Admin (kelola), Protokol (isi) |
| Pelaporan Persiapan + Foto Bukti | User Protokol |
| Pelaporan Pelaksanaan | User Protokol |
| Ekspor PDF Ber-kop + Share WhatsApp | User Protokol |
| Arsip Dokumen Sidang | User Persidangan |
| Bank Data Foto & Video | User Humas |
| Manajemen Akun User | Super Admin |
| Audit Log Perubahan | Super Admin |

---

## 9. Skenario Pengecualian

Sistem dirancang untuk menangani kondisi lapangan yang tidak ideal:

| Kondisi | Respons Sistem |
|---|---|
| Login salah | Pesan error umum, tetap di halaman login |
| Sesi habis (idle) | Diarahkan ke login; draf lokal tidak hilang |
| Sinyal putus saat unggah foto | Masuk antrean, dicoba ulang otomatis, tampil indikator "belum terkirim" |
| Foto terlalu besar | Pesan jelas dengan batas ukuran yang diizinkan |
| Foto yang sama dipakai di dua item | Peringatan sebelum laporan disimpan |
| Item wajib kosong saat simpan | Item ditandai merah, laporan tidak berubah jadi hijau |
| PIC diganti setelah laporan ada | Laporan lama milik pembuat awal tetap valid; PIC baru bisa melanjutkan |
| Kegiatan dibatalkan | Hilang dari daftar aktif, tetap tersimpan di arsip |
| Akses URL modul tanpa hak | Ditolak dengan respons 403 (Forbidden) |
| Template checklist diubah admin | Laporan yang sudah ada tidak berubah (snapshot saat kegiatan dibuat) |

---

## 10. Rencana Rilis Bertahap

Pengembangan SIAP-Pro direncanakan dalam tiga fase berurutan:

| Fase | Cakupan |
|---|---|
| **MVP (Fase 1)** | Login, Penugasan, Template Checklist (dikelola developer), Pelaporan Persiapan, Ekspor PDF + Share WhatsApp, Persidangan, Dokumentasi |
| **Fase 2** | Pelaporan Pelaksanaan + PDF Pelaksanaan, Manajemen template oleh Admin mandiri, Dashboard lengkap, Notifikasi/pengingat |
| **Fase 3** | Evaluasi Kegiatan, Tanda tangan digital, Pencarian arsip lanjutan |

---

## 11. Poin yang Memerlukan Konfirmasi Klien

Berikut adalah daftar keputusan yang perlu dikonfirmasi oleh pihak DEN sebelum pengembangan dapat dimulai atau dilanjutkan ke fase berikutnya:

| No. | Pertanyaan | Dampak ke Pengembangan |
|---|---|---|
| **OQ-1** | Apakah laporan persiapan diisi *real-time* sebelum acara, atau boleh setelahnya? Apakah ada batas waktu dan pengingat? | Notifikasi, status "terlambat" |
| **OQ-2** | Seperti apa format dan isi Laporan Pelaksanaan? Apakah mengikuti format yang sama dengan Laporan Persiapan? | Desain PDF kedua, template item |
| **OQ-3** | Siapa yang mengelola template checklist per jenis acara? Jenis acara apa saja yang ada selain Rapat dan Undangan Narasumber? | Scope modul manajemen template |
| **OQ-4** | Berapa lama data disimpan? Apakah ada batas ukuran foto asli yang diterima? | Biaya infrastruktur & storage |
| **OQ-5** | Apakah ini *rebuild* total dari awal, atau melanjutkan dari build SIAP-Pro yang sudah ada sebelumnya? | Estimasi waktu & biaya |
| **OQ-6** | Apa isi dan definisi modul Evaluasi Kegiatan? Apa yang dimaksud "Ter-Evaluasi" pada indikator Dashboard? | Scope Fase 3 |
| **OQ-7** | Apa peran Kabag/Kasubbag dalam laporan — hanya memantau, atau ada proses persetujuan/catatan resmi? | Alur review dan otorisasi laporan |
| **OQ-8** | Dua tombol di Dashboard (ikon kamera dan koper) ditujukan untuk fitur apa? | Scope Akses Cepat di Dashboard |
| **OQ-9** | Apa batas ukuran dan jenis file untuk unggahan di modul Persidangan dan Humas (apakah video/audio juga)? | Infrastruktur dan validasi file |
| **OQ-10** | Siapa yang memiliki kewenangan membuat akun user baru? | Scope manajemen user |
| **OQ-11** | Apakah laporan PDF perlu tanda tangan digital, atau nama pembuat cukup? | Fitur tanda tangan di Fase 3 |
| **OQ-12** | Apakah ada persyaratan khusus lokasi hosting atau keamanan data dari DEN (mengingat ini instansi pemerintah)? | Infrastruktur & kepatuhan |

---

## Catatan Penutup

Dokumen ini merupakan **draft untuk ditinjau** dan bukan komitmen kontrak final. Beberapa poin perlu diverifikasi kembali ke rekaman meeting asli sebelum menjadi kesepakatan tertulis. Poin-poin di Bagian 11 memerlukan jawaban dari DEN sebelum pengembangan fase berikutnya dapat dimulai.

---

*Dokumen ini disusun oleh tim pengembang berdasarkan rekaman meeting, User Manual SIAP-Pro ver 1.0, dan contoh Laporan Persiapan Kegiatan Protokol DEN RI.*

*SIAP-Pro · Sistem Informasi & Aplikasi Protokoler · Dewan Ekonomi Nasional RI · Oktober 2026*
