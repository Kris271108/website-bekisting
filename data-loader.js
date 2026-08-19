"use strict";
/**
 * data-loader.js
 * Menandai kesiapan data produk (window.PRODUCT_DATA), dengan TIGA sumber,
 * dicoba berurutan:
 *
 * 1. products.js (dimuat lewat tag <script> biasa di <head>) — SELALU jadi
 *    data awal/cadangan, supaya situs tetap berfungsi walau dibuka langsung
 *    dari file explorer (dobel-klik / file://) atau kalau Google Sheets
 *    sedang tidak bisa diakses.
 *
 * 2. Google Apps Script (window.APPS_SCRIPT_ORDER_URL di bawah) — sumber
 *    UTAMA kalau sudah diisi. Ini endpoint yang sama dipakai dashboard
 *    admin, jadi produk yang ditambah/diubah lewat admin.html otomatis
 *    ikut muncul di situs. Produk dari products.js yang belum pernah
 *    disimpan ke Dashboard tetap ditampilkan juga (digabung), supaya
 *    tidak ada produk yang hilang selama proses migrasi bertahap.
 *
 * 3. Google Sheets CSV (SHEET_CSV_URL, opsional/lama) — cadangan kalau
 *    APPS_SCRIPT_ORDER_URL belum diisi tapi Sheet sudah di-"Publish to
 *    web" sebagai CSV.
 *
 * Kalau semua sumber gagal (offline, dibuka lewat file://, dsb), situs
 * otomatis tetap pakai data dari products.js — tidak pernah error total
 * ke pengunjung.
 */
const SHEET_CSV_URL = "";

/**
 * APPS_SCRIPT_ORDER_URL — link Web App Google Apps Script yang sama
 * dipakai di admin.html (lihat backend-apps-script/PANDUAN-SETUP.md).
 * Dipakai untuk DUA hal:
 * 1. Mengambil data produk terbaru (harga, stok, produk baru) supaya
 *    situs selalu sinkron dengan yang diubah/ditambah lewat dashboard.
 * 2. Mencatat pesanan (Tambah Keranjang -> WA, atau Pesan Langsung) ke
 *    Google Sheet ("Orders") supaya bisa dilihat di dashboard admin.
 * Kalau dikosongkan, situs tetap pakai data dari products.js dan
 * checkout tetap jalan normal via WA seperti biasa, cuma tidak
 * tersinkron/tercatat ke dashboard.
 */
window.APPS_SCRIPT_ORDER_URL =
  "https://script.google.com/macros/s/AKfycbzep8HXkqiIDlecUEQj8piJCpz1bMH9yxkCLYRXGEkjsRW4U0Jn2q75lbtFKK9W-TY/exec";

function logOrderToDashboard(order) {
  if (!window.APPS_SCRIPT_ORDER_URL) return;
  try {
    fetch(window.APPS_SCRIPT_ORDER_URL, {
      method: "POST",
      body: JSON.stringify({ action: "addOrder", order }),
    }).catch(() => {
      /* diam-diam gagal; checkout WA tetap jalan seperti biasa */
    });
  } catch (err) {
    /* diam-diam gagal; checkout WA tetap jalan seperti biasa */
  }
}
window.logOrderToDashboard = logOrderToDashboard;

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

// Ubah baris-baris flat dari Google Sheets (satu baris = satu varian) jadi
// struktur PRODUCT_DATA yang dikelompokkan per nama produk, sama seperti
// format products.js.
function groupSheetRowsToProducts(rows) {
  const productMap = new Map();
  rows.forEach((r) => {
    // Kalau ProductName kosong tapi VariantName ada isinya, tetap dipakai
    // (pakai VariantName sebagai nama produk) supaya baris data yang belum
    // sempurna diisi tidak hilang begitu saja dari katalog situs.
    const name = (r.ProductName || "").trim() || (r.VariantName || "").trim();
    if (!name) return;
    if (!productMap.has(name)) {
      productMap.set(name, {
        name,
        category: (r.Category || "").trim(),
        desc: (r.Description || "").trim(),
        material: (r.Material || "").trim(),
        standar: (r.Standar || "").trim(),
        variants: [],
      });
    }
    productMap.get(name).variants.push({
      name: (r.VariantName || name).trim(),
      sku: (r.SKU || "").trim(),
      price: r.Price ? parseFloat(r.Price) || null : null,
      stock: r.Stock ? parseInt(r.Stock, 10) || 0 : 0,
      img: (r.ImageFileName || "").trim(),
      weightKg: r.WeightKg ? parseFloat(r.WeightKg) || 0 : 0,
      volumeM3: r.VolumeM3 ? parseFloat(r.VolumeM3) || 0 : 0,
    });
  });
  return Array.from(productMap.values()).filter((p) => p.variants.length > 0);
}

// Gabungkan produk dari Google Sheets (sumber utama & terbaru) dengan
// produk bawaan products.js yang namanya belum ada di Sheets, supaya
// produk lama yang belum "diimpor" lewat dashboard tetap tampil.
function mergeBundledWithSheetProducts(bundled, sheetProducts) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  const sheetNames = new Set(sheetProducts.map((p) => norm(p.name)));
  const onlyBundled = (bundled || []).filter(
    (p) => !sheetNames.has(norm(p.name)),
  );
  return sheetProducts.concat(onlyBundled);
}

// Parser CSV sederhana yang tahan koma/kutip di dalam teks (misal deskripsi produk)
function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // dilewati, ditangani bareng \n
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// Ubah baris-baris CSV (satu baris = satu varian) jadi struktur PRODUCT_DATA
// yang dikelompokkan per nama produk, sama seperti format products.js.
function buildProductsFromCsvRows(rows) {
  if (rows.length < 2) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {
    name: header.indexOf("productname"),
    category: header.indexOf("category"),
    desc: header.indexOf("description"),
    material: header.indexOf("material"),
    standar: header.indexOf("standar"),
    variantName: header.indexOf("variantname"),
    sku: header.indexOf("sku"),
    price: header.indexOf("price"),
    stock: header.indexOf("stock"),
    img: header.indexOf("imagefilename"),
    weight: header.indexOf("weightkg"),
    volume: header.indexOf("volumem3"),
  };
  if (idx.name === -1 || idx.variantName === -1) return null;

  const productMap = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[idx.name] || "").trim();
    if (!name) continue;
    if (!productMap.has(name)) {
      productMap.set(name, {
        name,
        category: (r[idx.category] || "").trim(),
        desc: (r[idx.desc] || "").trim(),
        material: (r[idx.material] || "").trim(),
        standar: (r[idx.standar] || "").trim(),
        variants: [],
      });
    }
    const priceRaw = idx.price !== -1 ? (r[idx.price] || "").trim() : "";
    const stockRaw = idx.stock !== -1 ? (r[idx.stock] || "").trim() : "";
    const weightRaw = idx.weight !== -1 ? (r[idx.weight] || "").trim() : "";
    const volumeRaw = idx.volume !== -1 ? (r[idx.volume] || "").trim() : "";
    productMap.get(name).variants.push({
      name: (r[idx.variantName] || name).trim(),
      sku: idx.sku !== -1 ? (r[idx.sku] || "").trim() : "",
      price: priceRaw ? parseFloat(priceRaw.replace(/[^\d.]/g, "")) : null,
      stock: stockRaw ? parseInt(stockRaw, 10) || 0 : 0,
      img: idx.img !== -1 ? (r[idx.img] || "").trim() : "",
      weightKg: weightRaw ? parseFloat(weightRaw) || 0 : 0,
      volumeM3: volumeRaw ? parseFloat(volumeRaw) || 0 : 0,
    });
  }
  const result = Array.from(productMap.values()).filter(
    (p) => p.variants.length > 0,
  );
  return result.length > 0 ? result : null;
}

// Sumber 3 (cadangan lama): Google Sheets yang di-"Publish to web" sbg CSV.
function loadFromSheetCsvThenReady() {
  if (!SHEET_CSV_URL) {
    announceProductsReady();
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  fetch(SHEET_CSV_URL, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error("Gagal mengambil data Sheets: " + res.status);
      return res.text();
    })
    .then((csvText) => {
      clearTimeout(timeoutId);
      const rows = parseCsvText(csvText);
      const parsed = buildProductsFromCsvRows(rows);
      if (parsed) {
        window.PRODUCT_DATA = mergeBundledWithSheetProducts(
          window.PRODUCT_DATA,
          parsed,
        );
        console.log(
          `Data produk dimuat dari Google Sheets CSV (${parsed.length} produk).`,
        );
      } else {
        console.warn(
          "Data Google Sheets tidak valid/kosong — tetap pakai products.js.",
        );
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.warn(
        "Tidak bisa memuat Google Sheets CSV, tetap pakai products.js sebagai cadangan.",
        err,
      );
    })
    .finally(() => {
      announceProductsReady();
    });
}

// Sumber 2 (utama): Google Apps Script — endpoint yang sama dipakai
// dashboard admin, supaya situs selalu sinkron dengan data terbaru.
function loadFromAppsScriptThenReady() {
  const url = window.APPS_SCRIPT_ORDER_URL;
  if (!url) {
    loadFromSheetCsvThenReady();
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  fetch(`${url}?action=getProducts`, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error("Gagal mengambil data produk: " + res.status);
      return res.json();
    })
    .then((json) => {
      clearTimeout(timeoutId);
      if (json && json.ok && Array.isArray(json.data) && json.data.length > 0) {
        const sheetProducts = groupSheetRowsToProducts(json.data);
        window.PRODUCT_DATA = mergeBundledWithSheetProducts(
          window.PRODUCT_DATA,
          sheetProducts,
        );
        console.log(
          `Data produk disinkronkan dari Dashboard (${sheetProducts.length} produk tersinkron).`,
        );
      } else {
        console.warn(
          "Dashboard belum punya data produk — tetap pakai products.js.",
        );
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.warn(
        "Tidak bisa memuat data dari Dashboard, tetap pakai products.js sebagai cadangan.",
        err,
      );
    })
    .finally(() => {
      announceProductsReady();
    });
}

function loadProductsThenReady() {
  if (window.APPS_SCRIPT_ORDER_URL) {
    loadFromAppsScriptThenReady();
  } else {
    loadFromSheetCsvThenReady();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadProductsThenReady);
} else {
  loadProductsThenReady();
}
