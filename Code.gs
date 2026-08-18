/**
 * Code.gs — Backend Dashboard Bekisting Indonesia
 * ==================================================
 * Ini kode untuk Google Apps Script (BUKAN untuk diupload ke GitHub).
 * Cara pakainya dijelaskan lengkap di PANDUAN-SETUP.md.
 *
 * Fungsinya jadi "server" gratis yang menghubungkan dashboard.html
 * (di situs kamu) dengan Google Sheet data produk, pesanan, & artikel.
 *
 * Sheet yang dipakai (harus persis nama ini, dibuat otomatis kalau belum ada):
 *  - "Products": ProductName, Category, Description, Material, Standar,
 *                VariantName, SKU, Price, Stock, ImageFileName, WeightKg
 *  - "Orders":   Timestamp, Type, CustomerName, Phone, Address, ItemsJSON,
 *                TotalQty, Notes, Status
 *  - "Articles": Title, Slug, Summary, Content, CoverImage, Status,
 *                CreatedAt, UpdatedAt, SourceName, SourceUrl
 */

const PRODUCTS_SHEET_NAME = "Products";
const ORDERS_SHEET_NAME = "Orders";
const ARTICLES_SHEET_NAME = "Articles";
const PRODUCTS_HEADER = [
  "ProductName", "Category", "Description", "Material", "Standar",
  "VariantName", "SKU", "Price", "Stock", "ImageFileName", "WeightKg",
];
const ORDERS_HEADER = [
  "Timestamp", "Type", "CustomerName", "Phone", "Address", "ItemsJSON",
  "TotalQty", "Notes", "Status",
];
const ARTICLES_HEADER = [
  "Title", "Slug", "Summary", "Content", "CoverImage", "Status",
  "CreatedAt", "UpdatedAt", "SourceName", "SourceUrl",
];

function getSheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0];
  const rows = values.slice(1);
  return rows
    .filter((r) => r.some((c) => c !== "" && c !== null))
    .map((r, i) => {
      const obj = { _row: i + 2 }; // nomor baris asli di sheet (buat update/hapus)
      header.forEach((h, idx) => (obj[h] = r[idx]));
      return obj;
    });
}

// Ubah judul artikel jadi slug URL (huruf kecil, spasi jadi strip).
function slugify_(text) {
  const base = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "artikel-" + Date.now();
}

// ============ GET: baca data ============
function doGet(e) {
  const action = e.parameter.action;
  const productsSheet = getSheet_(PRODUCTS_SHEET_NAME, PRODUCTS_HEADER);
  const ordersSheet = getSheet_(ORDERS_SHEET_NAME, ORDERS_HEADER);
  const articlesSheet = getSheet_(ARTICLES_SHEET_NAME, ARTICLES_HEADER);

  if (action === "getProducts") {
    return jsonOutput_({ ok: true, data: sheetToObjects_(productsSheet) });
  }
  if (action === "getOrders") {
    const orders = sheetToObjects_(ordersSheet).reverse(); // terbaru dulu
    return jsonOutput_({ ok: true, data: orders });
  }
  if (action === "getArticles") {
    // Dipakai dashboard admin — semua artikel termasuk yang masih Draft.
    return jsonOutput_({
      ok: true,
      data: sheetToObjects_(articlesSheet).reverse(),
    });
  }
  if (action === "getPublishedArticles") {
    // Dipakai halaman publik artikel.html — cuma yang statusnya Terbit.
    const all = sheetToObjects_(articlesSheet).reverse();
    const published = all.filter((a) => a.Status === "Terbit");
    return jsonOutput_({ ok: true, data: published });
  }
  return jsonOutput_({ ok: false, error: "Aksi tidak dikenal" });
}

// ============ POST: tambah/ubah/hapus data ============
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const productsSheet = getSheet_(PRODUCTS_SHEET_NAME, PRODUCTS_HEADER);
  const ordersSheet = getSheet_(ORDERS_SHEET_NAME, ORDERS_HEADER);
  const articlesSheet = getSheet_(ARTICLES_SHEET_NAME, ARTICLES_HEADER);

  try {
    if (action === "addProduct") {
      productsSheet.appendRow(
        PRODUCTS_HEADER.map((h) => body.product[h] || ""),
      );
      return jsonOutput_({ ok: true });
    }

    if (action === "updateProduct") {
      // body.row = nomor baris asli (_row), body.product = field yang diubah
      const rowNum = body.row;
      PRODUCTS_HEADER.forEach((h, idx) => {
        if (body.product[h] !== undefined) {
          productsSheet.getRange(rowNum, idx + 1).setValue(body.product[h]);
        }
      });
      return jsonOutput_({ ok: true });
    }

    if (action === "deleteProduct") {
      productsSheet.deleteRow(body.row);
      return jsonOutput_({ ok: true });
    }

    if (action === "addOrder") {
      const o = body.order;
      ordersSheet.appendRow([
        new Date(),
        o.type || "",
        o.customerName || "",
        o.phone || "",
        o.address || "",
        JSON.stringify(o.items || []),
        o.totalQty || 0,
        o.notes || "",
        "Baru",
      ]);
      return jsonOutput_({ ok: true });
    }

    if (action === "updateOrderStatus") {
      const rowNum = body.row;
      const statusColIdx = ORDERS_HEADER.indexOf("Status") + 1;
      ordersSheet.getRange(rowNum, statusColIdx).setValue(body.status || "Baru");
      return jsonOutput_({ ok: true });
    }

    if (action === "addArticle") {
      const a = body.article;
      const now = new Date();
      articlesSheet.appendRow([
        a.Title || "",
        slugify_(a.Title || ""),
        a.Summary || "",
        a.Content || "",
        a.CoverImage || "",
        a.Status || "Draft",
        now,
        now,
        a.SourceName || "",
        a.SourceUrl || "",
      ]);
      return jsonOutput_({ ok: true });
    }

    if (action === "updateArticle") {
      const rowNum = body.row;
      const a = body.article;
      ARTICLES_HEADER.forEach((h, idx) => {
        if (h === "UpdatedAt") {
          articlesSheet.getRange(rowNum, idx + 1).setValue(new Date());
        } else if (h === "Slug") {
          // Slug ikut diperbarui otomatis kalau judul berubah.
          if (a.Title !== undefined) {
            articlesSheet
              .getRange(rowNum, idx + 1)
              .setValue(slugify_(a.Title));
          }
        } else if (a[h] !== undefined) {
          articlesSheet.getRange(rowNum, idx + 1).setValue(a[h]);
        }
      });
      return jsonOutput_({ ok: true });
    }

    if (action === "deleteArticle") {
      articlesSheet.deleteRow(body.row);
      return jsonOutput_({ ok: true });
    }

    return jsonOutput_({ ok: false, error: "Aksi tidak dikenal" });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}
