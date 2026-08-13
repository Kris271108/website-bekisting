# Panduan Setup Login Google (Admin & Pengunjung)

Situs ini sekarang punya login pakai akun Google:

- **Admin** — buka `admin.html`, akan diminta login Google dulu. Kalau
  emailnya ada di daftar admin, dashboard langsung terbuka.
- **Pengunjung/pembeli** — ada tombol akun kecil di pojok kanan atas
  `Bekisting.html` & `detail.html`. Kalau login, nama pemesan di form
  checkout otomatis terisi.

Supaya tombol "Login dengan Google" ini bisa jalan, kamu perlu bikin
**OAuth Client ID** dulu di Google Cloud Console. Gratis, sekali setup,
tidak perlu kartu kredit.

## Langkah 1 — Buat project di Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com/),
   login pakai akun Google kamu (boleh akun yang sama dengan yang dipakai
   untuk Google Sheets di PANDUAN-SETUP.md, boleh juga beda).
2. Di bagian atas, klik dropdown nama project > **New Project**.
3. Kasih nama misalnya "Website Bekisting", klik **Create**. Tunggu
   sebentar sampai project selesai dibuat, lalu pastikan project ini
   yang aktif/dipilih (cek dropdown di atas).

## Langkah 2 — Setup "OAuth consent screen"

Ini layar yang muncul ke pengunjung saat pertama kali klik "Login dengan
Google" (menunjukkan nama situs kamu).

1. Di menu kiri (bisa cari lewat kolom search di atas), buka **APIs &
   Services > OAuth consent screen**.
2. Pilih **User Type: External**, klik **Create**.
3. Isi yang wajib saja:
   - **App name**: `Bekisting Indonesia` (atau nama situs kamu)
   - **User support email**: pilih email kamu
   - **Developer contact information**: isi email kamu lagi
4. Klik **Save and Continue** terus sampai ke halaman **Summary**, lalu
   klik **Back to Dashboard**. Scope dan test user boleh dilewati/default
   saja untuk website publik seperti ini.
5. Kalau muncul status "Testing", klik **Publish App** supaya semua
   orang (bukan cuma test user) bisa pakai tombol login-nya. Untuk app
   sederhana seperti ini biasanya tidak perlu verifikasi tambahan dari
   Google.

## Langkah 3 — Buat OAuth Client ID

1. Masih di **APIs & Services**, buka menu **Credentials** di kiri.
2. Klik **+ Create Credentials** > **OAuth client ID**.
3. **Application type**: pilih **Web application**.
4. **Name**: bebas, misal "Login Situs Bekisting".
5. Di bagian **Authorized JavaScript origins**, klik **+ Add URI**, lalu
   masukkan alamat situs kamu, misalnya:
   ```
   https://kris271108.github.io
   ```
   (isi domain situsmu saja, TANPA path/nama file setelahnya — kalau
   pakai GitHub Pages, biasanya formatnya `https://namauser.github.io`)
6. Bagian **Authorized redirect URIs** boleh dikosongkan (tidak dipakai
   di sini).
7. Klik **Create**. Akan muncul popup berisi **Client ID** — bentuknya
   panjang, diakhiri `.apps.googleusercontent.com`. **Copy** ID ini.

## Langkah 4 — Pasang Client ID & daftar admin ke situs

1. Buka file `auth-config.js`.
2. Cari baris:
   ```js
   const GOOGLE_CLIENT_ID = "";
   ```
   Ganti jadi:
   ```js
   const GOOGLE_CLIENT_ID = "xxxxxxxxxx.apps.googleusercontent.com";
   ```
3. Masih di file yang sama, cari:
   ```js
   const ADMIN_EMAILS = [
     // contoh: "nama.kamu@gmail.com",
   ];
   ```
   Isi dengan email Gmail yang boleh akses dashboard admin, misalnya:
   ```js
   const ADMIN_EMAILS = [
     "kamu@gmail.com",
     "partner-kamu@gmail.com",
   ];
   ```
4. Upload ulang file `auth-config.js` ke GitHub (replace yang lama).

## Langkah 5 — Coba

1. Buka `admin.html` di situs kamu — akan muncul layar login dengan
   tombol Google. Login pakai salah satu email yang ada di
   `ADMIN_EMAILS`, dashboard akan langsung terbuka.
2. Buka `Bekisting.html` — cek pojok kanan atas, akan ada ikon bulat
   kecil untuk login Google. Setelah login, ikonnya berubah jadi foto
   profil + nama kamu, dan kalau buka keranjang, nama pemesan otomatis
   terisi.

## Kalau tombol login tidak muncul / error

- Pastikan `GOOGLE_CLIENT_ID` di `auth-config.js` sudah keisi (bukan
  string kosong `""`).
- Pastikan domain di **Authorized JavaScript origins** (Langkah 3.5)
  persis sama dengan domain situs kamu, termasuk `https://`-nya.
- Kalau situs dites lewat `file://` (dobel-klik file HTML langsung dari
  komputer), tombol Google Sign-In **tidak akan muncul** — ini
  keterbatasan dari Google sendiri, harus diakses lewat domain web
  asli (GitHub Pages dsb).

## Catatan keamanan

Login admin di sini dicek di **browser**, bukan di server — jadi lebih
simpel & cepat dibuat, cukup untuk mencegah orang random membuka
dashboard. Tapi ini bukan proteksi tingkat bank: orang yang paham cara
kerja website tetap bisa mengakses data lewat URL Apps Script langsung
kalau tahu linknya (kondisi ini sama seperti sebelum ada login, tidak
berubah). Kalau nanti butuh proteksi yang lebih kuat (dicek ulang di
server Apps Script), tinggal minta upgrade — itu langkah lanjutan yang
terpisah.
