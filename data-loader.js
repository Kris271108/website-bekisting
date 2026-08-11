"use strict";
/**
 * data-loader.js
 * Menandai kesiapan data produk (window.PRODUCT_DATA) yang sudah dimuat
 * oleh products.js lewat tag <script> biasa di <head>.
 *
 * Kenapa TIDAK pakai fetch("products.json")? Karena banyak pengguna
 * (termasuk pemilik situs ini) membuka file HTML langsung dengan
 * dobel-klik dari file explorer (URL file://...). Semua browser modern
 * MEMBLOKIR fetch() ke file lokal di situasi itu (kebijakan CORS) —
 * tidak ada cara mengakalinya dari sisi kode. Tag <script src="products.js">
 * TIDAK kena batasan itu, jadi katalog tetap tampil baik dibuka langsung
 * maupun lewat web server/hosting.
 *
 * products.json tetap tersedia sebagai salinan data untuk kebutuhan
 * integrasi API/backend di masa depan, tapi products.js (dimuat sebelum
 * file ini) adalah sumber data yang sesungguhnya dipakai situs.
 */
window.productsLoadFailed = typeof window.PRODUCT_DATA === "undefined";
if (window.productsLoadFailed) {
  window.PRODUCT_DATA = [];
  console.error(
    "products.js gagal dimuat — pastikan file products.js ada satu folder dengan HTML ini.",
  );
}

function announceProductsReady() {
  document.dispatchEvent(new Event("products-ready"));
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", announceProductsReady);
} else {
  announceProductsReady();
}
