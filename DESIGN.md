# DESIGN.md: SIAP-Pro (Sistem Aplikasi Protokol)
Dewan Ekonomi Nasional Republik Indonesia

## 1. Identity & Context
- **Organization**: Dewan Ekonomi Nasional Republik Indonesia (DEN RI)
- **Product**: SIAP-Pro (Sistem Informasi & Aplikasi Protokoler)
- **Target Audience**: Pimpinan Lembaga, Sekretariat Eksekutif, Kepala Bagian Protokol, Kasubbag, Staf Protokol Lapangan, Tim Persidangan, dan Humas.
- **Theme**: Light Mode Executive Standard (Bersih, Kontras Tinggi, Terang, Otoritatif Kenegaraan).
- **Mission**: Menyediakan instrumen kerja keprotokolan negara yang tajam, jernih, mudah dibaca di ruangan rapat maupun di lapangan outdoor, bebas distraksi visual.

---

## 2. Personality & Mood
- **Character**: Otoritatif, Resmi Kenegaraan, Jernih, Tertib, Presisi.
- **Mood**: Ruang kerja resmi pemerintahan modern dengan kanvas putih bersih, kartu solid bergaris tepi tegas, tipografi Inter yang terbaca jelas, dan aksen resmi State Brass Gold.
- **Tone of Voice**: Bahasa Indonesia baku kedinasan. Tegas, lugas, mengutamakan data faktual tanpa retorika berlebihan atau emoji kasual.

---

## 3. Visual System & Color Palette (Light Mode Standard)

### 3.1 Palette Token
- **Dominant Base (Crisp Light Canvas)**:
  - Canvas / Page: `#f8fafc` (Slate 50: lembut di mata, kontras tinggi)
  - Surface Card (Primary): `#ffffff` (Pure White)
  - Surface Card (Elevated/Hover): `#f1f5f9` (Slate 100)
  - Surface Muted / Sidebar: `#ffffff` dengan border kanan `#e2e8f0`
  - Border Hairline: `#e2e8f0` (Slate 200: solid 1px border, crisp & subtle)
  - Border Distinct: `#cbd5e1` (Slate 300)
  - Border Strong: `#94a3b8` (Slate 400)
- **Text & Hierarchy (WCAG AAA Legibility)**:
  - Primary Text: `#0f172a` (Slate 900: rasio kontras 15:1 pada latar putih)
  - Secondary Text: `#475569` (Slate 600: rasio kontras 6.5:1)
  - Muted / Caption: `#64748b` (Slate 500: label, penunjuk waktu)
- **Institutional State Gold Brass Accent**:
  - Primary Accent: `#92400e` / `#a16207` (Deep Amber Brass: kontras tajam pada teks)
  - Button Primary: `#b45309` (Amber 700: solid kenegaraan, teks putih `#ffffff`)
  - Accent Subtle Background: `rgba(180, 83, 9, 0.08)`
  - Accent Border: `rgba(180, 83, 9, 0.25)`
  - Hover Accent: `#78350f`
- **Functional Status Indicators (Light Mode)**:
  - Selesai / Terlaksana: `#047857` (Emerald 700) | Bg: `#ecfdf5` | Border: `#a7f3d0`
  - Berlangsung / Aktif: `#1d4ed8` (Blue 700) | Bg: `#eff6ff` | Border: `#bfdbfe`
  - Menunggu / Evaluasi: `#b45309` (Amber 700) | Bg: `#fffbeb` | Border: `#fde68a`
  - Kritis / Belum: `#b91c1c` (Red 700) | Bg: `#fef2f2` | Border: `#fecaca`

### 3.2 Geometry & Elevation
- **Border Radii**:
  - Label / Badge / Tag: `4px`
  - Kontrol interaktif (tombol, input, dropdown): `6px`
  - Kontainer (kartu, panel, drawer): `8px`
  - Larangan bentuk pil seragam (`999px`) kecuali lingkaran avatar inisial.
- **Shadows & Elevation**:
  - Permukaan duduk rata (flat) dengan garis pembatas 1px solid (`#e2e8f0`).
  - Dropdown / modal melayang menggunakan bayangan lembut alami: `0 4px 16px rgba(15, 23, 42, 0.08)`.
  - Zero glowing colored shadows, zero neon halo.
- **Glassmorphism**:
  - Nonaktif. Seluruh permukaan solid matte putih dan slate.

---

## 4. Typography: Inter
- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Monospace / Numerics**: `'JetBrains Mono', Consolas, monospace` dengan format tabular numerals untuk kode waktu, tanggal, dan nomor butir.
- **Hierarchy**:
  - Page Title: 22px / 1.3, font-weight 700, slate-900
  - Section Title: 14px / 1.4, font-weight 600, uppercase letter-spacing 0.05em, slate-700
  - Card Title: 15px / 1.4, font-weight 600, slate-900
  - Body Text: 13px-14px / 1.5, slate-700
  - Meta & Badges: 11px-12px / 1.2, font-weight 600, tabular figures

---

## 5. Antislop Dials
- **ENERGY**: `2` (Resmi kenegaraan, tenang, bersih)
- **RHYTHM**: `3` (Struktur bervariasi antara agenda kalender, tabel checklist, dan kartu dokumen)
- **MOTION**: `2` (Transisi 150ms tajam untuk interaksi tombol dan dialog)
