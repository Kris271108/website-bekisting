"use strict";
/**
 * data-loader.js
 * Menandai kesiapan data produk (window.PRODUCT_DATA), dengan DUA sumber:
 *
 * 1. products.js (dimuat lewat tag <script> biasa di <head>) — SELALU jadi
 *    data awal/cadangan, supaya situs tetap berfungsi walau dibuka langsung
 *    dari file explorer (dobel-klik / file://) atau kalau Google Sheets
 *    sedang tidak bisa diakses.
 *
 * 2. Google Sheets (opsional) — kalau SHEET_CSV_URL di bawah diisi, situs
 *    akan coba ambil data terbaru (terutama STOK & HARGA) dari situ saat
 *    dibuka. Kalau berhasil, data dari Sheets MENGGANTIKAN data dari
 *    products.js. Kalau gagal (offline, link salah, dibuka lewat file://),
 *    situs otomatis tetap pakai data dari products.js — tidak pernah error
 *    total ke pengunjung.
 *
 * CARA ISI SHEET_CSV_URL:
 * 1. Buat Google Sheet, isi kolom: ProductName, Category, Description,
 *    Material, Standar, VariantName, SKU, Price, Stock, ImageFileName,
 *    WeightKg (satu baris = satu varian produk).
 * 2. File > Share > Publish to web > pilih sheet-nya > format CSV > Publish.
 * 3. Copy link yang muncul, paste di bawah ini (ganti string kosong "").
 */
const SHEET_CSV_URL = "";

/**
 * APPS_SCRIPT_ORDER_URL — link Web App Google Apps Script yang sama
 * dipakai di admin.html (lihat backend-apps-script/PANDUAN-SETUP.md).
 * Kalau diisi, setiap kali pengunjung checkout (Tambah Keranjang -> WA,
 * atau Pesan Langsung), datanya juga otomatis dikirim & tercatat di
 * Google Sheet ("Orders") supaya bisa dilihat di dashboard admin.
 * Kalau dikosongkan, checkout tetap jalan normal via WA seperti biasa,
 * cuma tidak tercatat di dashboard.
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
    productMap.get(name).variants.push({
      name: (r[idx.variantName] || name).trim(),
      sku: idx.sku !== -1 ? (r[idx.sku] || "").trim() : "",
      price: priceRaw ? parseFloat(priceRaw.replace(/[^\d.]/g, "")) : null,
      stock: stockRaw ? parseInt(stockRaw, 10) || 0 : 0,
      img: idx.img !== -1 ? (r[idx.img] || "").trim() : "",
      weightKg: weightRaw ? parseFloat(weightRaw) || 0 : 0,
    });
  }
  const result = Array.from(productMap.values()).filter(
    (p) => p.variants.length > 0,
  );
  return result.length > 0 ? result : null;
}

function loadFromSheetThenReady() {
  if (!SHEET_CSV_URL) {
    // Belum diisi -> langsung pakai data dari products.js, tanpa fetch sama sekali.
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
        window.PRODUCT_DATA = parsed;
        console.log(
          `Data produk dimuat dari Google Sheets (${parsed.length} produk).`,
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
        "Tidak bisa memuat Google Sheets, tetap pakai products.js sebagai cadangan.",
        err,
      );
    })
    .finally(() => {
      announceProductsReady();
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadFromSheetThenReady);
} else {
  loadFromSheetThenReady();
}
