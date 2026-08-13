/**
 * Code.gs — Backend Dashboard Bekisting Indonesia
 * ==================================================
 * Ini kode untuk Google Apps Script (BUKAN untuk diupload ke GitHub).
 * Cara pakainya dijelaskan lengkap di PANDUAN-SETUP.md.
 *
 * Fungsinya jadi "server" gratis yang menghubungkan dashboard.html
 * (di situs kamu) dengan Google Sheet data produk & pesanan.
 *
 * Sheet yang dipakai (harus persis nama ini, dibuat otomatis kalau belum ada):
 *  - "Products": ProductName, Category, Description, Material, Standar,
 *                VariantName, SKU, Price, Stock, ImageFileName, WeightKg
 *  - "Orders":   Timestamp, Type, CustomerName, Phone, Address, ItemsJSON,
 *                TotalQty, Notes
 */

const PRODUCTS_SHEET_NAME = "Products";
const ORDERS_SHEET_NAME = "Orders";
const PRODUCTS_HEADER = [
  "ProductName", "Category", "Description", "Material", "Standar",
  "VariantName", "SKU", "Price", "Stock", "ImageFileName", "WeightKg",
];
const ORDERS_HEADER = [
  "Timestamp", "Type", "CustomerName", "Phone", "Address", "ItemsJSON",
  "TotalQty", "Notes",
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

// ============ GET: baca data ============
function doGet(e) {
  const action = e.parameter.action;
  const productsSheet = getSheet_(PRODUCTS_SHEET_NAME, PRODUCTS_HEADER);
  const ordersSheet = getSheet_(ORDERS_SHEET_NAME, ORDERS_HEADER);

  if (action === "getProducts") {
    return jsonOutput_({ ok: true, data: sheetToObjects_(productsSheet) });
  }
  if (action === "getOrders") {
    const orders = sheetToObjects_(ordersSheet).reverse(); // terbaru dulu
    return jsonOutput_({ ok: true, data: orders });
  }
  return jsonOutput_({ ok: false, error: "Aksi tidak dikenal" });
}

// ============ POST: tambah/ubah/hapus data ============
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const productsSheet = getSheet_(PRODUCTS_SHEET_NAME, PRODUCTS_HEADER);
  const ordersSheet = getSheet_(ORDERS_SHEET_NAME, ORDERS_HEADER);

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
      ]);
      return jsonOutput_({ ok: true });
    }

    return jsonOutput_({ ok: false, error: "Aksi tidak dikenal" });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}
