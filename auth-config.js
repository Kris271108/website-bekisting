"use strict";
/**
 * auth-config.js
 * Konfigurasi login Google — dipakai bareng oleh situs utama
 * (Bekisting.html, detail.html) dan dashboard admin (admin.html).
 *
 * CARA ISI:
 * 1. Ikuti panduan di PANDUAN-LOGIN-GOOGLE.md untuk membuat OAuth Client ID
 *    di Google Cloud Console (gratis, sekali setup).
 * 2. Paste Client ID-nya di GOOGLE_CLIENT_ID di bawah ini.
 * 3. Isi daftar email Gmail yang boleh masuk sebagai admin di ADMIN_EMAILS
 *    (boleh lebih dari satu, pisahkan dengan koma).
 *
 * CATATAN KEAMANAN:
 * Login admin di sini dicek di BROWSER (bukan di server Apps Script),
 * supaya simpel & cepat dibuat. Ini cukup untuk menyembunyikan dashboard
 * dari orang random yang tidak tahu daftar emailnya. TAPI, orang yang
 * mengerti cara kerja website tetap bisa mengakses URL Apps Script kamu
 * langsung (fetch API) tanpa lewat halaman admin sama sekali, kalau dia
 * tahu APPS_SCRIPT_URL-nya — ini kondisi yang sama seperti sebelumnya,
 * tidak berubah. Kalau nanti butuh proteksi yang lebih kuat (dicek ulang
 * di server), tinggal bilang saja, itu langkah upgrade berikutnya.
 */
const GOOGLE_CLIENT_ID = "";

const ADMIN_EMAILS = [
  // contoh: "nama.kamu@gmail.com",
];
