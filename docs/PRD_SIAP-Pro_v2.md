# PRD — SIAP-Pro (Sistem Aplikasi Protokol)

| | |
|---|---|
| **Klien** | Dewan Ekonomi Nasional Republik Indonesia |
| **Versi** | 2.0 (Draft untuk review klien) |
| **Tanggal** | 30 September 2026 |
| **Sumber** | Rekaman meeting (SIAPPRO.mp3), User Manual SIAP-Pro ver 1.0, contoh "Laporan Persiapan Kegiatan Protokol", PRD v1.1 dan User Flow hasil Gemini |

**Legenda penanda** yang dipakai di dokumen ini:

- **[Rekaman]** — disebut langsung di meeting.
- **[Manual]** — terlihat di User Manual ver 1.0.
- **[Laporan]** — terlihat di contoh laporan PDF.
- **[Usulan]** — rekomendasi penyusun, belum dikonfirmasi klien.
- **[OQ-n]** — pertanyaan terbuka yang harus dijawab klien (lihat Bagian 12).

> Catatan kualitas sumber: transkrip rekaman dibuat otomatis dan kasar. Poin bertanda [Rekaman] sebaiknya dicek ulang ke audio asli sebelum jadi komitmen kontrak.

---

## 1. Latar Belakang dan Masalah

Tim keprotokolan DEN mendukung kegiatan pimpinan (rapat, undangan narasumber, dan sejenisnya). Saat ini persiapan dan pelaksanaan dilaporkan manual lewat grup WhatsApp: foto dan keterangan tersebar, sulit dilacak per kegiatan, dan hasil akhirnya tidak rapi untuk dibaca pimpinan. [Rekaman]

Kebutuhan inti:

1. Kabag/Kasubbag dapat menjadwalkan kegiatan dan menugaskan staf per peran.
2. Staf melapor persiapan dan pelaksanaan dengan checklist + foto bukti (evidence) langsung dari lapangan.
3. Hasil laporan dapat diunduh sebagai PDF rapi dan dibagikan ke grup WhatsApp untuk dibaca pimpinan. [Rekaman]
4. Dokumen sidang (notulen, daftar hadir) dan foto kegiatan tersimpan terpusat, seperti "Google Drive" khusus DEN, tetapi terintegrasi dengan aplikasi. [Rekaman]

## 2. Tujuan dan Metrik Sukses

| Tujuan | Metrik [Usulan] |
|---|---|
| Menggantikan pelaporan manual via WhatsApp | ≥ 90% kegiatan terjadwal punya laporan persiapan di aplikasi |
| Laporan tepat waktu | ≥ 80% laporan persiapan terisi sebelum acara mulai |
| Laporan siap baca pimpinan | PDF dapat dihasilkan < 10 detik dan tanpa edit manual |
| Arsip terpusat | 100% kegiatan bersidang punya notulen/daftar hadir; 100% kegiatan terdokumentasi punya foto |

## 3. Scope

**Masuk scope (MVP):** Login, Dashboard, Penugasan, Template Checklist per jenis acara, Pelaporan Persiapan, Pelaporan Pelaksanaan, Persidangan, Dokumentasi, Ekspor PDF + Share, Manajemen User, Audit log.

**Perlu keputusan klien:** Modul Evaluasi Kegiatan (lihat 7.9, [OQ-6]), notifikasi/pengingat, tanda tangan digital.

**Di luar scope:** Aplikasi native iOS/Android, integrasi Zoom/WhatsApp API otomatis, perekaman/transkripsi rapat di dalam aplikasi.

## 4. Platform dan Infrastruktur

- **Web app mobile-first.** Alasan [Rekaman]: aplikasi native butuh update berkala dan biaya langganan store (Apple), dan rilis ke Play Store dinilai sulit. Web fleksibel, tanpa instalasi. Penggunaan utama di lapangan via smartphone; pimpinan juga dominan lewat mobile.
- **PWA (installable, tanpa store)** [Usulan]: memberi ikon di home screen dan cache dasar tanpa biaya store.
- **Hosting:** cloud hosting untuk tahap awal, rencana pindah ke VPS jika perlu. Storage tidak perlu di-upgrade di awal. [Rekaman]
- **Environment:** staging dan production terpisah; kode di GitHub dan diuji di staging sebelum production. [Rekaman]
- **Desain:** fungsi didahulukan; visual/warna terbuka untuk ide baru. [Rekaman]
- **Basis sistem:** rekaman menyebut ada build SIAP-Pro sebelumnya (source code, server staging). Status proyek (rebuild atau lanjutan) belum jelas. [OQ-5]

## 5. Peran dan Hak Akses

Otorisasi berbasis peran, **ditegakkan di server** (bukan hanya menyembunyikan menu). Penugasan peran bersifat permanen per akun (misal "si A hanya Persidangan"), sedangkan penugasan kegiatan bersifat per acara. [Rekaman]

| Peran | Deskripsi | Akses |
|---|---|---|
| **Super Admin** | Pengelola sistem | Semua modul, manajemen user, template checklist |
| **Kabag / Kasubbag** | Mengendalikan penugasan dan memantau | Dashboard, Penugasan, semua laporan (baca), catatan review |
| **User Protokol** | Melapor persiapan dan pelaksanaan | Hanya modul Pelaporan Kegiatan |
| **User Persidangan** | Mengurus dokumen sidang | Hanya modul Persidangan |
| **User Humas (fotografer)** | Dokumentasi foto/video | Hanya modul Dokumentasi |

Catatan:

- User biasa **tidak** melihat menu Penugasan. Mereka hanya melihat jadwal yang menuntut nama mereka. [Rekaman]
- Satu peran pada satu kegiatan dapat dipegang **lebih dari satu orang** (contoh laporan: 3 protokoler, 2 persidangan). [Laporan][Manual]
- Peran Kabag/Kasubbag muncul lewat kolom "Catatan Kabag" dan "Catatan Kasubbag" di kartu kegiatan [Manual]; alur review mereka belum dijelaskan. [OQ-7]

## 6. Model Data dan Status

### 6.1 Entitas utama [Usulan]

- **User:** nama, username, kata sandi (hash), peran, status aktif.
- **JenisAcara:** nama (Rapat, Undangan Narasumber, dst.), dan daftar template checklist.
- **TemplateChecklist / ItemChecklist:** kelompok (misal "Protokol Tempat Acara"), nomor, teks item, urutan.
- **Kegiatan:** nama, tanggal, jam mulai, lokasi, penjabat yang difasilitasi, jenis acara, dibuat oleh.
- **Penugasan:** kegiatan × peran (Protokol / Persidangan / Humas) × daftar user (PIC).
- **Laporan:** kegiatan + fase (Persiapan / Pelaksanaan), status, catatan penutup, waktu pelaporan, pembuat laporan.
- **JawabanChecklist:** laporan × item, centang, keterangan, foto.
- **Media:** file asli, versi terkompresi, tipe, ukuran, pengunggah, waktu.
- **DokumenSidang:** kegiatan + link Zoom, link recorder, daftar hadir, notulen, bahan sidang.
- **Dokumentasi:** kegiatan + link voice record, link video, foto.
- **CatatanReview:** laporan + penulis + teks.
- **AuditLog:** siapa, apa, kapan.

### 6.2 Status

**Laporan (per fase: Persiapan dan Pelaksanaan)** [Rekaman: hijau = lengkap, merah = ada yang belum]

| Status | Warna | Arti |
|---|---|---|
| Belum dilaporkan | Merah | Belum ada isian, atau ada item wajib belum terisi |
| Sudah dilaporkan | Hijau | Seluruh item wajib tercentang dan tersimpan |
| Sebagian *(opsional)* | Kuning | Sebagian item terisi [Usulan] |

**Persidangan:** Belum di sidang → Selesai di sidang. [Manual]

**Dokumentasi:** Belum didokumentasi → Sudah didokumentasi. [Manual]

## 7. Spesifikasi Fitur

### 7.1 Autentikasi

- **FR-AUTH-1** Login dengan Nama Pengguna dan Kata Sandi; ikon mata menampilkan/menyembunyikan sandi. [Manual]
- **FR-AUTH-2** Login gagal menampilkan pesan kesalahan yang jelas dan tidak membocorkan mana yang salah. [Usulan]
- **FR-AUTH-3** Setelah login, pengguna diarahkan ke Dashboard sesuai perannya. [Manual]
- **FR-AUTH-4** Logout dan batas waktu sesi (idle timeout). [Usulan]

**Acceptance:** kredensial valid → masuk Dashboard; tidak valid → tetap di halaman login dengan pesan error; akses URL modul tanpa hak → ditolak (403).

### 7.2 Dashboard

- **FR-DASH-1** Menampilkan 4 indikator persentase [Manual]: Kegiatan Total vs Terlaksana; Terlaksana vs Ter-Evaluasi; Terlaksana vs Ter-Dokumentasi; Terlaksana vs Ter-Notulensi.
- **FR-DASH-2** Indikator berpersentase rendah ditandai agar bottleneck terlihat. [Manual]
- **FR-DASH-3** Akses Cepat ke modul sesuai peran. Screenshot manual menampilkan 6 tombol (Penugasan Acara, Pelaporan Kegiatan, Evaluasi Kegiatan, Persidangan, serta dua tombol ikon kamera dan koper yang belum berlabel jelas). [OQ-8]
- **FR-DASH-4** Definisi "Terlaksana", "Ter-Evaluasi", "Ter-Dokumentasi", "Ter-Notulensi" harus ditetapkan. [Usulan: Terlaksana = laporan Pelaksanaan berstatus hijau; Ter-Dokumentasi = ada minimal 1 foto; Ter-Notulensi = file notulen terunggah.] [OQ-6]

### 7.3 Penugasan (Kabag / Kasubbag / Super Admin)

**Sebagai** Kabag/Kasubbag, **saya ingin** menjadwalkan kegiatan di kalender dan menugaskan staf, **agar** tim tahu tugasnya dan tidak bingung.

- **FR-PEN-1** Tampilan kalender ala Google Calendar; pilih tanggal → daftar kegiatan hari itu. [Rekaman][Manual]
- **FR-PEN-2** Tombol "Tambah Penugasan" membuka formulir: Nama Kegiatan, Tanggal, Jam Mulai, Lokasi, Penjabat yang difasilitasi, **Jenis Acara**. [Manual][Rekaman]
- **FR-PEN-3** Jenis Acara menentukan template checklist yang dipakai (lihat 7.4).
- **FR-PEN-4** Pilih PIC untuk peran Protokol, Persidangan, Humas; **boleh lebih dari satu orang per peran.** [Laporan][Usulan]
- **FR-PEN-5** Setelah Simpan, kegiatan langsung muncul di kalender, dan hanya PIC yang ditunjuk melihatnya di modul masing-masing. [Manual][Rekaman]
- **FR-PEN-6** Ubah jadwal atau ganti PIC setelah disimpan, dengan mencatat perubahan di audit log. [Usulan]
- **FR-PEN-7** Hapus/batalkan kegiatan (soft delete, tetap ada di arsip). [Usulan]

**Acceptance:** PIC yang ditunjuk melihat kegiatan di akunnya dalam ≤ 5 detik setelah Simpan; user yang tidak ditunjuk tidak melihatnya.

### 7.4 Template Checklist per Jenis Acara

- **FR-TPL-1** Setiap Jenis Acara punya template checklist Persiapan dan Pelaksanaan. Contoh: Rapat memakai 17 item (Absen, Daftar Nama Peserta VIP, Bahan Rapat, Lay Out Meja Rapat, Laser Pointer, ATK, Kalender, Tempat Dudukan HP, Perlengkapan Sanitasi, Kotak Sampah, Proyektor, LED Monitor, Mic Rapat, Stand Mic, Air Mineral, Name Table, Perangkat Video Conference). [Laporan][Rekaman]
- **FR-TPL-2** Item dikelompokkan (misal "Protokol Tempat Acara") dan bernomor. [Manual]
- **FR-TPL-3** Admin dapat menambah/ubah/nonaktifkan item dan jenis acara tanpa developer. [Usulan][OQ-3]
- **FR-TPL-4** Perubahan template tidak mengubah laporan lama (snapshot item saat kegiatan dibuat). [Usulan]
- **FR-TPL-5** Setiap item bertanda: wajib/opsional, wajib foto atau tidak. [Usulan]

### 7.5 Pelaporan Persiapan (User Protokol)

**Sebagai** PIC Protokol, **saya ingin** mengisi checklist persiapan dengan foto bukti, **agar** kesiapan acara terdokumentasi.

- **FR-LAP-1** Daftar kegiatan yang menugaskan user, difilter per tanggal; kartu berwarna merah/hijau menurut status. [Manual][Rekaman]
- **FR-LAP-2** Pilih kegiatan → pilih fase **Persiapan** atau **Pelaksanaan**. [Rekaman]
- **FR-LAP-3** Tiap item: kotak centang, kolom keterangan, tombol unggah foto/ambil dari kamera. [Manual]
- **FR-LAP-4** Persiapan dilaporkan sebelum acara (rekaman menyebut tim harus siap sekitar 1 jam sebelumnya). [Rekaman][OQ-1]
- **FR-LAP-5** Simpan → status diperbarui; jika semua item wajib terpenuhi menjadi hijau. [Manual]
- **FR-LAP-6** Simpan sebagai draf tanpa validasi lengkap. [Usulan]
- **FR-LAP-7** Peringatan jika foto yang sama (hash sama) dipakai di beberapa item dalam satu laporan. [Usulan; dasar: contoh laporan memakai foto identik untuk ATK dan Kalender]
- **FR-LAP-8** Kolom "Catatan penutup" dan nama pembuat laporan terisi otomatis dari akun yang menyimpan. [Laporan]
- **FR-LAP-9** Tampilkan catatan Kabag/Kasubbag di kartu kegiatan (hanya baca untuk PIC). [Manual]

### 7.6 Pelaporan Pelaksanaan

- **FR-PLK-1** Alur sama dengan Persiapan, dengan template item pelaksanaan. [Rekaman]
- **FR-PLK-2** Format PDF Laporan Pelaksanaan belum ada. [OQ-2]

### 7.7 Persidangan (User Persidangan)

- **FR-SID-1** Pilih periode (tahun/bulan); daftar dipisah "Selesai di sidang" dan "Belum di sidang". [Manual]
- **FR-SID-2** Kartu kegiatan muncul hanya jika user ditugaskan di kegiatan itu; merah jika belum diunggah. [Rekaman]
- **FR-SID-3** Kolom Link Zoom dan Link Recorder. [Manual]
- **FR-SID-4** Unggah file **Daftar Hadir**, **Hasil Notulen** (drop file, bukan diketik; opsional) dan **Bahan Sidang** (PDF). [Manual][Rekaman]
- **FR-SID-5** Jenis file dan batas ukuran per jenis harus ditetapkan. [Usulan: PDF ≤ 20 MB per file] [OQ-9]
- **FR-SID-6** Simpan → status menjadi "Selesai di sidang" bila syarat terpenuhi. [Usulan]

### 7.8 Dokumentasi (User Humas)

- **FR-DOK-1** Berfungsi sebagai bank data foto/video, difilter **per tanggal** (bukan per acara). [Rekaman]
- **FR-DOK-2** Tampilan kartu kegiatan dan formulir: Link Voice Record, Link Video, unggah foto. [Manual]
- **FR-DOK-3** Foto: simpan **file asli** untuk arsip, dan hasilkan **versi terkompresi (≤ 1 MB)** untuk tampilan dan PDF. Ini menggantikan batas "Max 1MB" di User Manual/Flow, yang bertentangan dengan fungsi bank data foto resolusi tinggi. [Usulan][OQ-4]
- **FR-DOK-4** Hapus dan ganti foto sebelum status final. [Manual: ikon hapus]

### 7.9 Evaluasi Kegiatan (belum terdefinisi)

Indikator "Ter-Evaluasi" dan tombol "Evaluasi Kegiatan" ada di Dashboard [Manual], tetapi tidak ada panduan halaman dan penjelasan jelas di sumber yang tersedia. Modul ini **tidak dispesifikasikan** sampai klien menjawab [OQ-6]. Kandidat isi [Usulan]: catatan evaluasi per kegiatan oleh Kabag/Kasubbag, skor kesiapan, tindak lanjut.

### 7.10 Ekspor PDF dan Share

- **FR-PDF-1** Tombol Download di Halaman Pelaporan menghasilkan PDF laporan per kegiatan per fase. [Manual]
- **FR-PDF-2** Tombol **Bagikan** memakai Web Share API agar PDF bisa langsung dikirim ke grup WhatsApp; fallback ke unduh. [Rekaman: PDF diunduh lalu dibagikan ke grup][Usulan: tombol Share]
- **FR-PDF-3** Laporan disimpan dan dapat dicari kembali per tanggal. [Rekaman]
- **FR-PDF-4** Format PDF: lihat Bagian 8.

### 7.11 Manajemen User

- **FR-USR-1** Super Admin membuat/nonaktifkan akun dan menetapkan peran permanen. [Rekaman: nama diberi peran][OQ-10]
- **FR-USR-2** Reset kata sandi oleh Super Admin. [Usulan]

### 7.12 Notifikasi *(opsional)*

- **FR-NTF-1** Pengingat ke PIC bahwa laporan persiapan belum diisi mendekati jam acara. [Usulan; dasar: laporan harus diisi pada hari yang sama] [OQ-1]

## 8. Spesifikasi Output PDF: Laporan Persiapan

Mengikuti contoh "Laporan Persiapan Kegiatan Protokol":

| Elemen | Spesifikasi |
|---|---|
| Kop | Logo Garuda emas dengan teks melingkar "DEWAN EKONOMI NASIONAL" dan "REPUBLIK INDONESIA" |
| Judul | "LAPORAN PERSIAPAN" |
| Identitas | Agenda, Tanggal, Waktu |
| Daftar Tim | Dikelompokkan per divisi (Protokoler, Persidangan, Dokumentasi); mendukung banyak nama per divisi |
| Tabel | Kolom: No, Daftar Pengecekan, Laporan Pengecekan dan Evidence (keterangan + foto) |
| Penutup | "Catatan" + nama "Pembuat laporan" (tanda tangan digital: [OQ-11]) |

Ketentuan:

- Jumlah baris tabel **dinamis** mengikuti template Jenis Acara. [Usulan]
- Item tanpa foto tetap tampil (contoh laporan: item 9 hanya berisi teks). Jika foto wajib, item tanpa foto ditandai. [Laporan][Usulan]
- Tabel dan foto tidak boleh terpotong di tengah baris saat pindah halaman. [Usulan]
- Foto di PDF memakai versi terkompresi.
- Laporan Pelaksanaan mengikuti pola serupa; format final menunggu klien. [OQ-2]

## 9. Penanganan Foto dan File

| Aspek | Ketentuan [Usulan] |
|---|---|
| Sumber | Kamera HP (±6 MB per foto) [Rekaman][Flow] |
| Kompresi | Proses kompresi di server secara asinkron: unggah selesai dulu, kompres di latar belakang. Alasan: kompresi 6MB → 1MB saat upload dinilai lambat [Rekaman] |
| Penyimpanan | File asli + versi ≤ 1 MB |
| Indikator | Progress upload; status "diproses" sampai versi terkompresi siap |
| Duplikasi | Peringatan hash duplikat dalam satu laporan |
| Retensi | Ditetapkan klien [OQ-4] |

## 10. Persyaratan Non-Fungsional [Usulan]

- **Keamanan:** HTTPS, kata sandi ter-hash, RBAC di server, batas percobaan login, audit log tindakan penting. Data instansi pemerintah, sehingga lokasi hosting perlu disepakati [OQ-12].
- **Kinerja:** halaman utama < 3 detik pada 4G; upload foto tidak memblokir UI.
- **Konektivitas lapangan:** draf tersimpan lokal dan antrean unggah otomatis bila sinyal buruk.
- **Ketersediaan dan backup:** backup harian; pemulihan diuji berkala.
- **Kompatibilitas:** Chrome/Safari mobile versi terbaru; layar 360 px ke atas; desktop didukung tetapi bukan prioritas [Rekaman].
- **Aksesibilitas dan keterbacaan:** kontras teks pada latar emas/gelap perlu diuji (UI saat ini bertema gelap-emas).
- **Deployment:** staging → production via GitHub. [Rekaman]

## 11. Terminologi

| Istilah | Pakai | Catatan |
|---|---|---|
| Protokol / Protokoler | **Protokol** untuk peran/modul; "Protokoler" hanya di kop PDF jika diminta klien | Sumber tidak konsisten |
| Humas / Dokumentasi | **Humas** untuk peran, **Dokumentasi** untuk modul | Di PDF, divisi ditulis "Dokumentasi" |
| PIC | Staf yang ditugaskan pada satu peran di satu kegiatan | |
| Evidence | Foto/bukti pendukung item checklist | Tulis "Evidence" (bukan "Evidance") |

## 12. Pertanyaan Terbuka untuk Klien

| # | Pertanyaan | Dampak |
|---|---|---|
| OQ-1 | Laporan diisi real-time sebelum acara atau boleh setelahnya? Ada batas waktu dan pengingat? | Notifikasi, status "terlambat" |
| OQ-2 | Format dan isi Laporan Pelaksanaan? | PDF kedua, template item |
| OQ-3 | Siapa yang mengelola template checklist per jenis acara? Jenis acara apa saja selain Rapat dan Undangan Narasumber? | Modul template |
| OQ-4 | Retensi data dan storage; batas ukuran foto asli? | Biaya infrastruktur |
| OQ-5 | Rebuild total atau lanjutan dari build SIAP-Pro yang sudah ada? | Estimasi dan timeline |
| OQ-6 | Apa isi modul Evaluasi Kegiatan, dan definisi "Ter-Evaluasi"? | Dashboard, scope |
| OQ-7 | Peran Kabag/Kasubbag: hanya memantau, atau memberi catatan/persetujuan? | Alur review |
| OQ-8 | Dua tombol Akses Cepat yang belum berlabel (ikon kamera, koper) untuk apa? | Dashboard |
| OQ-9 | Batas ukuran/jenis file Persidangan dan Humas (video, audio?) | Storage |
| OQ-10 | Siapa yang membuat akun user? | Manajemen user |
| OQ-11 | Perlu tanda tangan digital pembuat laporan atau nama cukup? | PDF |
| OQ-12 | Ada persyaratan lokasi hosting/keamanan dari DEN? | Infrastruktur |

## 13. Ketidaksesuaian di Dokumen Sumber

1. **Foto Humas:** PRD v1.1 menulis "resolusi tinggi" tetapi flow menulis "Max 1MB". Diselesaikan di FR-DOK-3.
2. **Status laporan:** flow v1 hanya punya "Sudah dilaporkan"; rekaman menyebut merah/hijau per fase persiapan dan pelaksanaan.
3. **Akses Cepat:** PRD v1.1 menyebut 4 tombol; manual menampilkan 6.
4. **Contoh laporan:** foto identik untuk item 6 dan 7; item 9 tanpa foto; keterangan item 14 (Stand Mic) berbunyi "sudah disiapkan mic rapat"; item 11 (Proyektor) berbunyi "sudah disiapkan Led". Menjadi dasar validasi evidence dan keterangan wajib.
5. **Istilah:** Protokol/Protokoler dan Humas/Dokumentasi dipakai bergantian.

## 14. Fase Rilis yang Diusulkan [Usulan]

| Fase | Isi |
|---|---|
| **MVP** | Login, Penugasan, Template checklist (dikelola developer), Pelaporan Persiapan, Ekspor PDF + Share, Persidangan, Dokumentasi |
| **Fase 2** | Pelaporan Pelaksanaan + PDF, Manajemen template oleh admin, Dashboard lengkap, Notifikasi |
| **Fase 3** | Evaluasi Kegiatan, tanda tangan digital, pencarian arsip lanjutan |
