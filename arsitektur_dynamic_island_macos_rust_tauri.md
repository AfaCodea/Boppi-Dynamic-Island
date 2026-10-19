# Rekomendasi Teknologi dan Arsitektur

## Aplikasi Dynamic Island macOS berbasis Rust + Tauri untuk MacBook Intel 2018--2020

**Tujuan dokumen:** merangkum teknologi, library, struktur proyek,
pendekatan native overlay, strategi kompatibilitas, build, keamanan, dan
roadmap pengembangan aplikasi Dynamic Island untuk macOS.

------------------------------------------------------------------------

## 1. Ringkasan keputusan teknis

### Stack utama

  --------------------------------------------------------------------------------
  Lapisan                 Teknologi                        Kegunaan
  ----------------------- -------------------------------- -----------------------
  Bahasa backend          Rust                             State aplikasi, logika
                                                           bisnis, timer, event,
                                                           background tasks

  Desktop framework       Tauri 2                          Membuat aplikasi
                                                           desktop, menghubungkan
                                                           frontend dengan Rust,
                                                           packaging

  Frontend                React + TypeScript               Komponen UI dan
                                                           pengelolaan state
                                                           visual

  Frontend tooling        Vite                             Development server dan
                                                           bundling frontend

  Styling                 CSS                              Kapsul, layout,
                                                           transisi, animasi

  Native macOS            AppKit                           Mengendalikan window,
                                                           posisi layar, Spaces,
                                                           dan perilaku overlay

  Rust-to-Objective-C     `objc2`, `objc2-app-kit`,        Akses API
  bindings                `objc2-foundation`               AppKit/Foundation dari
                                                           Rust

  Serialisasi             `serde`, `serde_json`            Payload command/event
                                                           dan konfigurasi

  Error handling          `thiserror`                      Tipe error yang
                                                           terstruktur

  Logging                 `tracing`, `tracing-subscriber`  Diagnostik startup,
                                                           event, native bridge,
                                                           dan performa

  Pengaturan lokal        `tauri-plugin-store`             Menyimpan preferensi
                                                           pengguna

  Shortcut global         `tauri-plugin-global-shortcut`   Membuka/menutup atau
                                                           mengaktifkan Island
                                                           dengan shortcut

  Startup saat login      `tauri-plugin-autostart`         Menjalankan aplikasi
                                                           saat pengguna login

  Build/package           Tauri CLI, Cargo, Node.js, npm   Build
                                                           development/release dan
                                                           pembuatan paket

  Distribusi              `.app`, `.dmg`, code signing,    Instalasi dan
                          notarization                     distribusi aplikasi
                                                           macOS
  --------------------------------------------------------------------------------

**Pilihan yang direkomendasikan:** Rust + Tauri 2 + React + TypeScript +
Vite + CSS + AppKit melalui `objc2`.

Rust menjadi application core; React mengurus UI; AppKit mengatur
perilaku jendela di desktop macOS.

------------------------------------------------------------------------

## 2. Target perangkat dan sistem operasi

### Perangkat sasaran awal

-   MacBook Intel keluaran 2018--2020.
-   Prioritas pengujian pada perangkat Intel sungguhan, bukan hanya
    simulator.
-   MacBook Intel tidak memiliki notch fisik seperti MacBook Pro 14/16
    inci Apple Silicon generasi baru. Karena itu, desain awal sebaiknya
    berupa kapsul floating di tengah atas layar.

### Strategi dukungan macOS

-   Tetapkan versi minimum yang realistis berdasarkan versi Tauri, Rust,
    WebView, dan API native yang benar-benar digunakan.
-   `10.13` dapat dipertimbangkan sebagai target kompatibilitas
    eksperimental, tetapi jangan menjanjikannya sebelum seluruh
    dependency diuji.
-   Buat matriks uji pada beberapa versi macOS yang benar-benar dapat
    dijalankan oleh perangkat target.
-   macOS terbaru tidak selalu mendukung seluruh model Intel. Verifikasi
    daftar kompatibilitas resmi Apple sebelum menetapkan janji dukungan.
-   Dokumentasikan tiga status: **didukung dan diuji**, **diperkirakan
    kompatibel tetapi belum diuji**, dan **tidak didukung**.

Referensi: - Tauri v2: https://v2.tauri.app/ - Konfigurasi Tauri:
https://v2.tauri.app/reference/config/ - Dokumentasi AppKit:
https://developer.apple.com/documentation/appkit - `objc2-app-kit`:
https://docs.rs/objc2-app-kit/

------------------------------------------------------------------------

## 3. Arsitektur tingkat tinggi

``` text
┌─────────────────────────────────────────────┐
│ Frontend: React + TypeScript + CSS           │
│ IslandShell, Compact, Expanded, Features    │
└──────────────────────┬──────────────────────┘
                       │ Tauri IPC
            ┌──────────┴───────────┐
            │                      │
       Commands                 Events
     Frontend → Rust          Rust → UI
            │                      │
┌───────────┴──────────────────────┴──────────┐
│ Rust Application Core                       │
│ State, timer, settings, services, logging    │
└──────────────────────┬─────────────────────┘
                       │
┌──────────────────────┴─────────────────────┐
│ Native macOS Bridge                         │
│ AppKit, NSWindow, NSScreen, Spaces           │
└─────────────────────────────────────────────┘
```

### Tanggung jawab setiap lapisan

**Frontend** - Menampilkan kapsul compact dan expanded. - Menangani
interaksi, animasi, dan responsivitas. - Mengirim perintah pengguna
melalui Tauri commands. - Mendengarkan event Rust untuk memperbarui UI.

**Rust core** - Menjadi sumber kebenaran untuk state penting aplikasi. -
Menjalankan timer dan tugas latar belakang. - Mengelola konfigurasi,
event, dan error. - Memanggil fungsi native macOS melalui modul
terisolasi.

**Native bridge** - Mengatur level dan posisi window. - Menangani
perilaku Spaces dan monitor. - Mengatur fokus atau interaksi mouse bila
dibutuhkan. - Mengisolasi kode platform-specific dan `unsafe`.

------------------------------------------------------------------------

## 4. Struktur proyek yang direkomendasikan

``` text
dynamic-island/
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── index.html
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── IslandShell.tsx
│   │   ├── IslandCompact.tsx
│   │   ├── IslandExpanded.tsx
│   │   └── IslandContent.tsx
│   ├── features/
│   │   ├── timer/
│   │   ├── music/
│   │   ├── battery/
│   │   └── notifications/
│   ├── hooks/
│   │   ├── useIslandState.ts
│   │   └── useNativeEvents.ts
│   ├── styles/
│   │   ├── island.css
│   │   └── animations.css
│   └── types/
│       └── island.ts
│
├── src-tauri/
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── state.rs
│       ├── events.rs
│       ├── commands/
│       │   ├── island.rs
│       │   ├── settings.rs
│       │   └── system.rs
│       ├── services/
│       │   ├── timer.rs
│       │   ├── music.rs
│       │   └── battery.rs
│       └── native/
│           └── macos/
│               ├── mod.rs
│               ├── overlay.rs
│               └── screen.rs
│
└── docs/
    ├── architecture.md
    └── compatibility.md
```

Gunakan `#[cfg(target_os = "macos")]` untuk kode khusus macOS.
Pertahankan logika inti agar tidak bergantung langsung pada AppKit.

------------------------------------------------------------------------

## 5. Library dan dependency

### Dependency Rust yang disarankan

  Library/crate                    Status                Kegunaan
  -------------------------------- --------------------- -------------------------------------------
  `tauri`                          Wajib                 Runtime desktop, window, commands, events
  `serde`                          Wajib                 Serialize/deserialize data
  `serde_json`                     Wajib                 Payload JSON
  `thiserror`                      Direkomendasikan      Error types
  `tracing`                        Direkomendasikan      Logging terstruktur
  `tracing-subscriber`             Direkomendasikan      Subscriber dan filter log
  `objc2`                          Untuk native bridge   Objective-C runtime bindings
  `objc2-app-kit`                  Untuk native bridge   AppKit bindings
  `objc2-foundation`               Untuk native bridge   Foundation bindings
  `tauri-plugin-store`             Opsional, berguna     Preferensi lokal
  `tauri-plugin-global-shortcut`   Opsional              Shortcut global
  `tauri-plugin-autostart`         Opsional              Startup saat login

### Dependency frontend

-   `react`
-   `react-dom`
-   `typescript`
-   `vite`
-   `@tauri-apps/api`
-   CSS biasa untuk animasi awal
-   Motion for React, hanya jika diperlukan untuk animasi spring yang
    lebih kompleks

Gunakan versi stabil yang saling kompatibel. Setelah build berhasil,
commit `Cargo.lock` dan `package-lock.json` agar build dapat
direproduksi. Jangan menganggap seluruh API atau nama fitur crate sama
pada setiap versi; cek dokumentasi versi yang dipin.

------------------------------------------------------------------------

## 6. Strategi native overlay macOS

### Konfigurasi awal window

Untuk MVP, mulai dari satu window Tauri dengan: - `decorations: false` -
`transparent: true` - `resizable: false` - `alwaysOnTop: true` -
`visible: false` saat startup, lalu tampilkan setelah inisialisasi
selesai - ukuran awal sekitar `240 × 48` logical points - judul dan
dekorasi window disembunyikan - opsi untuk menyembunyikan overlay ketika
aplikasi fullscreen

Contoh baseline `src-tauri/tauri.conf.json`:

``` json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Dynamic Island",
  "version": "0.1.0",
  "identifier": "com.example.dynamicisland",
  "app": {
    "windows": [
      {
        "label": "island",
        "title": "Dynamic Island",
        "width": 240,
        "height": 48,
        "decorations": false,
        "transparent": true,
        "resizable": false,
        "shadow": false,
        "alwaysOnTop": true,
        "visibleOnAllWorkspaces": true,
        "visible": false,
        "focus": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"],
    "macOS": {
      "minimumSystemVersion": "10.13"
    }
  }
}
```

**Penting:** ini hanya konfigurasi awal. Validasi schema dengan versi
Tauri yang digunakan. Nilai minimum macOS bukan bukti bahwa semua
dependency dan API native kompatibel dengan versi tersebut.

### Tugas `overlay.rs`

1.  Mengambil referensi native window Tauri.
2.  Mengatur level window menggunakan API AppKit yang sesuai.
3.  Mengatur `collectionBehavior` untuk perilaku Spaces yang diinginkan.
4.  Menghitung posisi window berdasarkan layar target.
5.  Menangani perubahan resolusi dan monitor.
6.  Mengatur fokus serta mouse interaction bila diperlukan.
7.  Menampilkan window setelah UI siap.

Gunakan `NSWindow` milik Tauri untuk implementasi awal. Jangan melakukan
cast pointer `NSWindow` menjadi `NSPanel`; keduanya adalah kelas yang
berbeda. Bila benar-benar membutuhkan perilaku khusus `NSPanel`,
evaluasi plugin native terpisah yang membuat panel dan WebView sendiri.

### Posisi dan monitor

Gunakan `NSScreen` atau API monitor Tauri untuk menentukan: - layar
target, - ukuran layar dan area menu bar, - titik tengah horizontal, -
jarak vertikal yang aman, - scale factor Retina, - perubahan posisi saat
monitor eksternal dipasang atau dilepas.

Jangan mengunci posisi dengan koordinat piksel tetap. Perhatikan bahwa
AppKit menggunakan logical points dan sistem koordinatnya perlu
ditangani dengan benar.

### Always-on-top, click-through, dan focus

Ketiganya merupakan perilaku berbeda: - **Always-on-top:** window berada
di atas window aplikasi biasa. - **Click-through:** klik pada area
tertentu diteruskan ke aplikasi di belakang. - **Non-activating:**
interaksi dengan overlay tidak selalu mengaktifkan aplikasi utama.

Jangan membuat seluruh window click-through karena kapsul menjadi tidak
bisa diklik. Mulailah tanpa click-through, lalu implementasikan hit
testing native hanya bila dibutuhkan. `pointer-events: none` pada CSS
tidak otomatis meneruskan klik ke aplikasi macOS di belakang WebView.

Untuk fullscreen, sediakan opsi konfigurasi. Default yang aman adalah
menyembunyikan overlay saat aplikasi fullscreen.

### Threading dan keamanan native

-   Jalankan operasi AppKit pada main thread sesuai ketentuan API.
-   Batasi kode `unsafe` dalam satu modul native.
-   Dokumentasikan asumsi ownership/lifetime objek Objective-C.
-   Jangan memanggil API private macOS tanpa alasan kuat.
-   Tambahkan logging untuk kegagalan native bridge.

------------------------------------------------------------------------

## 7. Command dan event IPC

Gunakan **commands** untuk permintaan frontend ke Rust dan **events**
untuk pembaruan Rust ke frontend.

### Contoh commands

-   `expand_island`
-   `collapse_island`
-   `start_timer`
-   `pause_timer`
-   `stop_timer`
-   `get_settings`
-   `set_settings`

### Contoh events

-   `timer-tick`
-   `music-changed`
-   `battery-updated`
-   `island-state-changed`
-   `display-changed`

### Contoh tipe TypeScript

``` typescript
export type IslandMode = "compact" | "expanded" | "hidden";

export interface IslandState {
  mode: IslandMode;
  activeFeature: string | null;
  timerRemainingMs: number | null;
}
```

Gunakan payload yang konsisten dan bertipe. Validasi input pada sisi
Rust, jangan menganggap input frontend tepercaya. Untuk timer, gunakan
`std::time::Instant` atau pendekatan monotonic clock yang sesuai
sehingga hitung mundur tidak bergantung pada frekuensi render UI. Kirim
pembaruan berkala, bukan event setiap frame animasi.

------------------------------------------------------------------------

## 8. Fitur dan urutan implementasi

### MVP

1.  Kapsul floating dengan background transparan.
2.  Animasi compact/expanded.
3.  Klik untuk expand dan collapse.
4.  Timer atau Pomodoro.
5.  Pengaturan posisi dan startup.
6.  Shortcut global.
7.  Logging dan penanganan error.

### Fitur lanjutan

-   Informasi lagu dan kontrol playback.
-   Status baterai.
-   Notifikasi terpilih.
-   Clipboard history, jika memang diperlukan dan dengan kontrol privasi
    yang jelas.
-   Integrasi tambahan melalui API resmi atau mekanisme yang didukung
    macOS.

Jangan membangun semua fitur sekaligus. Pastikan overlay dan native
bridge stabil sebelum menambahkan integrasi sistem yang kompleks.

------------------------------------------------------------------------

## 9. Build environment dan perintah

### Toolchain yang dibutuhkan

-   Mac dengan macOS yang sesuai target pengembangan.
-   Xcode Command Line Tools atau Xcode sesuai kebutuhan build.
-   Rust melalui `rustup`.
-   Node.js versi LTS yang kompatibel dengan dependency frontend.
-   npm (atau package manager lain, tetapi gunakan satu secara
    konsisten).
-   Tauri CLI.
-   Git.
-   Perangkat Intel nyata untuk pengujian performa dan perilaku native.

### Target Intel

``` bash
rustup target add x86_64-apple-darwin
```

Jalankan development build menggunakan script yang didefinisikan di
`package.json`, misalnya:

``` bash
npm run tauri dev
npm run tauri build -- --target x86_64-apple-darwin
```

Pastikan script `tauri` tersedia, misalnya mengarah ke Tauri CLI versi 2
yang digunakan proyek.

### Target Apple Silicon (opsional)

``` bash
rustup target add aarch64-apple-darwin
```

Build universal, jika semua dependency mendukung kedua arsitektur:

``` bash
npm run tauri build -- --target universal-apple-darwin
```

Build universal hanya layak setelah native dependencies, plugin, dan
bridge berhasil dikompilasi serta diuji pada kedua arsitektur.

### Packaging dan distribusi

-   `.app`: pengujian atau distribusi aplikasi.
-   `.dmg`: distribusi yang mudah dipasang.
-   Code signing dan notarization: direkomendasikan untuk distribusi
    publik.
-   Uji instalasi bersih, upgrade, startup, uninstall, dan penanganan
    data konfigurasi.
-   Simpan log diagnostik di lokasi yang sesuai dan jangan mencatat data
    sensitif.

------------------------------------------------------------------------

## 10. Keamanan dan kualitas

-   Terapkan prinsip least privilege pada Tauri capabilities.
-   Izinkan hanya command yang diperlukan oleh frontend.
-   Jangan mengekspos shell command arbitrer kepada WebView.
-   Validasi semua argumen command pada Rust.
-   Hindari menyimpan token atau rahasia dalam konfigurasi plaintext.
-   Minta izin sistem hanya ketika fitur membutuhkannya.
-   Pisahkan kode platform-specific dari core.
-   Gunakan `cargo fmt`, `cargo clippy`, dan test otomatis untuk logic
    Rust.
-   Jalankan build release pada mesin macOS.
-   Uji konsumsi CPU/RAM ketika idle dan setelah aplikasi berjalan lama.

### Target performa awal

Ini merupakan target pengujian, bukan jaminan: - CPU idle mendekati nol
secara rata-rata. - Animasi menargetkan 60 FPS ketika aktif. - Tidak ada
polling agresif ketika Island tersembunyi. - Timer tetap akurat meski UI
tidak dirender setiap frame. - Tidak ada pertumbuhan memori
terus-menerus. - Tidak ada window putih sebelum UI siap.

Utamakan CSS `transform` dan `opacity`, kurangi blur besar, dan jangan
merender ulang seluruh UI setiap kali timer berubah.

------------------------------------------------------------------------

## 11. Roadmap implementasi

### Tahap 1 --- Overlay MVP

-   Buat proyek Tauri 2.
-   Buat window transparan tanpa dekorasi.
-   Buat kapsul React compact/expanded.
-   Implementasikan klik dan animasi.
-   Verifikasi posisi, transparansi, dan always-on-top.

**Kriteria selesai:** kapsul stabil, dapat diklik, tidak berkedip, dan
tidak mengganggu aplikasi lain.

### Tahap 2 --- Rust core

-   Tambahkan state terpusat.
-   Implementasikan command dan event.
-   Tambahkan timer.
-   Tambahkan penyimpanan pengaturan dan logging.

**Kriteria selesai:** state tetap konsisten saat kapsul dibuka dan
ditutup.

### Tahap 3 --- Native bridge

-   Integrasikan AppKit melalui `objc2`.
-   Implementasikan posisi berdasarkan layar.
-   Uji Spaces, monitor eksternal, fokus, dan fullscreen.
-   Isolasi seluruh operasi native di modul khusus.

**Kriteria selesai:** overlay tetap berada di posisi yang benar ketika
konfigurasi layar berubah.

### Tahap 4 --- Release

-   Uji beberapa versi macOS yang benar-benar tersedia.
-   Ukur CPU/RAM.
-   Uji startup, instalasi, upgrade, dan uninstall.
-   Buat `.app` dan `.dmg`.
-   Siapkan signing/notarization jika distribusi publik.

**Kriteria selesai:** paket release dapat diinstal dan digunakan tanpa
tool development.

------------------------------------------------------------------------

## 12. Checklist sebelum rilis

-   [ ] Build Intel `x86_64-apple-darwin` berhasil.
-   [ ] Versi minimum macOS sudah ditentukan berdasarkan pengujian.
-   [ ] Window transparan tidak menampilkan latar putih.
-   [ ] Kapsul berada di posisi benar pada layar Retina.
-   [ ] Perubahan resolusi dan monitor ditangani.
-   [ ] Klik pada kapsul bekerja.
-   [ ] Overlay tidak mengganggu input di luar area kapsul.
-   [ ] Perilaku fullscreen dan Spaces terdokumentasi.
-   [ ] Shortcut global dan startup diuji.
-   [ ] CPU/RAM saat idle diukur.
-   [ ] Command IPC divalidasi.
-   [ ] Error native bridge dicatat tanpa data sensitif.
-   [ ] Build release dan instalasi bersih diuji.
-   [ ] Kompatibilitas yang diklaim sesuai hasil pengujian nyata.

------------------------------------------------------------------------

## 13. Kesimpulan

Arsitektur yang direkomendasikan adalah **Rust + Tauri 2 +
React/TypeScript + CSS + AppKit melalui `objc2`**.

Urutan prioritas: 1. Buat satu window transparan berbasis `NSWindow`. 2.
Stabilkan posisi dan interaksi overlay. 3. Tambahkan Rust state,
commands, dan events. 4. Tambahkan timer sebagai fitur pertama. 5.
Tambahkan fitur sistem secara bertahap. 6. Validasi kompatibilitas dan
performa di MacBook Intel nyata. 7. Siapkan packaging, signing, dan
dokumentasi versi macOS yang didukung.

Kualitas aplikasi ini terutama ditentukan oleh perilaku native window,
kompatibilitas macOS, dan efisiensi saat idle---bukan sekadar pilihan
bahasa pemrograman.
