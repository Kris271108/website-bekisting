# Panduan Setup Dashboard Admin (Google Apps Script + Google Sheets)

Dashboard ini memakai Google Sheets sebagai "database", dan Google Apps
Script sebagai "server" gratis yang menjembatani dashboard dengan Sheet-nya.
Tidak perlu bayar hosting server terpisah.

## Langkah 1 — Buat Google Sheet

1. Buka [sheets.google.com](https://sheets.google.com), buat spreadsheet baru.
2. Kasih nama "Data Bekisting Indonesia" (bebas).
3. Kosongkan saja isinya — sheet "Products" dan "Orders" akan **dibuat
   otomatis** oleh kode Apps Script saat pertama kali dijalankan.

## Langkah 2 — Pasang kode Apps Script

1. Di Sheet yang baru dibuat, klik menu **Extensions > Apps Script**.
2. Akan terbuka editor kode baru dengan file `Code.gs` kosong (isinya
   cuma `function myFunction() {}`).
3. **Hapus semua isi default itu**, lalu copy-paste seluruh isi file
   `Code.gs` yang saya siapkan (ada di folder `backend-apps-script/` yang
   saya kirim) ke situ.
4. Klik ikon disket (Save), kasih nama project misalnya "Backend Bekisting".

## Langkah 3 — Deploy sebagai Web App

1. Klik tombol biru **Deploy** (pojok kanan atas) > **New deployment**.
2. Klik ikon gerigi di sebelah "Select type" > pilih **Web app**.
3. Isi:
   - Description: bebas, misal "Backend Dashboard v1"
   - Execute as: **Me**
   - Who has access: **Anyone**  
     (Ini PENTING — kalau tidak "Anyone", situs & dashboard tidak akan
     bisa mengakses datanya. Data tetap aman karena URL-nya cuma kamu
     yang tahu, dan tidak ada info sensitif di dalamnya selain data
     produk & pesanan.)
4. Klik **Deploy**.
5. Google akan minta izin akses — klik **Authorize access**, pilih akun
   Google kamu, klik **Advanced** > **Go to [nama project] (unsafe)** >
   **Allow**. (Ini normal, karena scriptnya belum "diverifikasi" Google —
   wajar untuk script buatan sendiri.)
6. Setelah selesai, akan muncul **Web app URL** — bentuknya seperti:
   `https://script.google.com/macros/s/AKfycb.../exec`
   **Copy link ini**, itu yang dipakai di langkah berikutnya.

## Langkah 4 — Sambungkan ke dashboard.html dan situs

1. Buka file `admin.html`, cari baris:
   ```js
   const APPS_SCRIPT_URL = "";
   ```
   Ganti `""` dengan link Web App yang kamu copy tadi, jadi misalnya:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```

2. Buka file `data-loader.js`, cari baris:
   ```js
   window.APPS_SCRIPT_ORDER_URL = "";
   ```
   Ganti dengan link yang SAMA persis:
   ```js
   window.APPS_SCRIPT_ORDER_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
   Ini yang bikin pesanan dari pengunjung situs otomatis tercatat ke
   dashboard.

3. Upload ulang `admin.html` dan `data-loader.js` yang sudah diedit ke
   GitHub (upload file, replace yang lama).

## Langkah 5 — Isi data produk awal (opsional tapi disarankan)

Supaya dashboard langsung terisi data 51 varian produk yang sudah ada
(bukan mulai dari kosong):

1. Buka Google Sheet yang tadi dibuat, klik tab **Products** di bawah
   (akan muncul otomatis setelah kamu buka `admin.html` sekali, atau
   jalankan fungsi `doGet`/`doPost` apa saja dulu dari editor Apps Script
   untuk memicu sheet-nya dibuat).
2. Import file `products-template.csv` yang saya kirim sebelumnya:
   File > Import > Upload > pilih file > **Insert new sheet(s)** JANGAN
   dipilih — pilih **"Replace data at selected cell"** dengan sel A1 di
   tab Products yang sudah ada, supaya headernya tidak dobel.

## Cara pakai dashboard sehari-hari

Buka `admin.html` di browser (bisa lewat link situs kamu, misalnya
`https://kris271108.github.io/website-bekisting/admin.html`):

- **Tab Produk**: ubah harga/stok langsung di kolomnya, klik ✓ (centang
  hijau) di baris itu untuk simpan. Tombol "Tambah Produk Baru" untuk
  menambah varian baru.
- **Tab Pesanan Masuk**: menampilkan semua pesanan yang masuk lewat
  situs (baik dari Keranjang maupun Pesan Langsung), diurutkan dari yang
  terbaru.

## Catatan keamanan

`admin.html` ini **TIDAK dilindungi password** — siapa pun yang tahu
link-nya bisa mengubah data produk. Untuk penggunaan sekarang (kamu
sendiri yang pegang), ini cukup aman selama kamu tidak membagikan link
`admin.html`-nya ke sembarang orang. Kalau nanti perlu proteksi
password/login yang lebih serius, kabari saya — itu langkah upgrade
berikutnya (butuh sedikit setup tambahan).
