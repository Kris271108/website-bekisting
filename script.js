"use strict";
let cart = [];
window.PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23f1f5f9%22/%3E%3Cpath%20d%3D%22M28%2068l16-22%2013%2016%209-11%2016%2022z%22%20fill%3D%22%23cbd5e1%22/%3E%3Ccircle%20cx%3D%2236%22%20cy%3D%2234%22%20r%3D%227%22%20fill%3D%22%23cbd5e1%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2288%22%20font-family%3D%22Arial%2Csans-serif%22%20font-size%3D%229%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C/text%3E%3C/svg%3E";
// Catatan: hasil fungsi ini dikirim sebagai teks pesan WhatsApp (via
// encodeURIComponent), bukan dirender sebagai HTML di DOM manapun. Karena
// itu kita TIDAK memakai HTML-entity escaping (&amp; &lt; dst) — itu akan
// membuat pesan WA menampilkan teks aneh seperti "&amp;" secara literal.
// Cukup buang karakter yang berpotensi disalahgunakan untuk manipulasi
// teks/link, sambil tetap mempertahankan karakter wajar seperti apostrof.
function sanitizeInput(str) {
  if (!str) return "";
  return String(str)
    .replace(/[<>]/g, "")
    .replace(/&/g, "dan")
    .trim();
}

function getStockBadgeClass(stock) {
  if (!stock || stock <= 0) return "stock-out";
  if (stock <= 30) return "stock-limited";
  return "stock-available";
}
function getStockBadgeText(stock) {
  if (!stock || stock <= 0) return "Stok Habis";
  if (stock <= 30) return `Stok Terbatas`;
  return "Stok Tersedia";
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

function formatPriceLabel(price) {
  const num = parseFloat(price);
  if (!price || isNaN(num) || num <= 0) return "Harga: Hubungi Sales";
  return `Harga: ${formatRupiah(num)}`;
}

function safeSetCart(cartArray) {
  try {
    localStorage.setItem("bekisting_cart", JSON.stringify(cartArray));
    return true;
  } catch (err) {
    console.warn(
      "Tidak bisa menyimpan keranjang (mode incognito/private atau storage penuh).",
      err,
    );
    return false;
  }
}

function getCartFromStorage() {
  let localData;
  try {
    localData = localStorage.getItem("bekisting_cart");
  } catch (err) {
    console.warn(
      "localStorage tidak tersedia (mode incognito/private browsing).",
      err,
    );
    return [];
  }
  if (!localData) return [];
  try {
    const parsed = JSON.parse(localData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Data keranjang tersimpan rusak, direset otomatis.", err);
    try {
      localStorage.removeItem("bekisting_cart");
    } catch (e) {
      /* abaikan jika removeItem juga gagal */
    }
    return [];
  }
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function showConfirmModal(message, onConfirm, title) {
  const overlay = document.getElementById("confirm-modal-overlay");
  if (!overlay) {
    if (confirm(message)) onConfirm();
    return;
  }
  const titleEl = document.getElementById("confirm-modal-title");
  const msgEl = document.getElementById("confirm-modal-message");
  const okBtn = document.getElementById("confirm-modal-ok");
  const cancelBtn = document.getElementById("confirm-modal-cancel");
  if (titleEl) titleEl.textContent = title || "Konfirmasi";
  if (msgEl) msgEl.textContent = message;
  overlay.classList.add("show");

  function cleanup() {
    overlay.classList.remove("show");
    okBtn.removeEventListener("click", handleOk);
    cancelBtn.removeEventListener("click", handleCancel);
    overlay.removeEventListener("click", handleOverlayClick);
  }
  function handleOk() {
    cleanup();
    onConfirm();
  }
  function handleCancel() {
    cleanup();
  }
  function handleOverlayClick(e) {
    if (e.target === overlay) cleanup();
  }
  okBtn.addEventListener("click", handleOk);
  cancelBtn.addEventListener("click", handleCancel);
  overlay.addEventListener("click", handleOverlayClick);
}

function syncCartFromLocalStorage() {
  cart = getCartFromStorage();
  updateCart();
}
window.addEventListener("storage", (e) => {
  if (e.key === "bekisting_cart") {
    syncCartFromLocalStorage();
  }
});
function updateCart() {
  const cartBadge = document.getElementById("cart-badge");
  if (cartBadge) {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
  }
  renderCartItems();
  document.dispatchEvent(new Event("cart-updated"));
}
function renderCartItems() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Keranjang belanja Anda masih kosong.</p>
      </div>
    `;
    updateCartSummaryBadge();
    return;
  }
  container.innerHTML = "";
  cart.forEach((item, index) => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item-row";
    const hasNote = item.note && item.note.trim() !== "";
    itemRow.innerHTML = `
      <img src="${item.img}" alt="Material Bekisting - ${item.name}" loading="lazy" class="cart-item-img" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;" />
      <div class="cart-item-info">
        <h5 class="cart-item-name">${item.name}</h5>
        ${item.sku ? `<span class="cart-item-sku">SKU: ${item.sku}</span>` : ""}
        <div class="cart-item-controls-row">
          <div class="qty-selector cart-item-qty-selector">
            <button class="cart-minus-btn" data-index="${index}" aria-label="Kurangi jumlah"><i class="fa-solid fa-minus"></i></button>
            <input type="number" class="cart-qty-input" data-index="${index}" value="${item.qty}" min="1" aria-label="Jumlah item" />
            <button class="cart-plus-btn" data-index="${index}" aria-label="Tambah jumlah"><i class="fa-solid fa-plus"></i></button>
          </div>
          <button class="delete-item-btn" data-index="${index}" aria-label="Hapus item">
            <i class="fa-solid fa-trash-can"></i> Hapus
          </button>
        </div>
        <button type="button" class="item-note-toggle-btn ${hasNote ? "has-note" : ""}" data-index="${index}">
          <i class="fa-solid fa-pen"></i> ${hasNote ? "Ubah Catatan Spesifikasi" : "+ Catatan Spesifikasi"}
        </button>
        <div class="item-note-panel ${hasNote ? "open" : ""}" data-index="${index}">
          <textarea class="item-note-input" data-index="${index}" placeholder="cth: Panjang minta dipotong 2m, minta cat merah, dll." maxlength="150">${hasNote ? item.note : ""}</textarea>
        </div>
      </div>
    `;
    container.appendChild(itemRow);
  });
  updateCartSummaryBadge();
}

function updateCartSummaryBadge() {
  const badge = document.getElementById("cart-summary-badge");
  if (!badge) return;
  if (cart.length === 0) {
    badge.style.display = "none";
    return;
  }
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalWeightKg = cart.reduce(
    (sum, item) => sum + (item.weightKg || 0) * (item.qty || 0),
    0,
  );
  const weightText =
    totalWeightKg >= 1000
      ? `~${(totalWeightKg / 1000).toFixed(2)} Ton`
      : `~${Math.round(totalWeightKg)} Kg`;
  badge.style.display = "flex";
  badge.innerHTML = `
    <span><i class="fa-solid fa-boxes-stacked"></i> ${cart.length} Jenis Material</span>
    <span><i class="fa-solid fa-cubes"></i> ${totalQty} Pcs</span>
    <span><i class="fa-solid fa-weight-hanging"></i> Est. ${weightText}</span>
  `;
}

// Event delegation: satu listener terpasang sekali di kontainer induk,
// bukan dipasang ulang ke tiap tombol setiap kali keranjang di-render.
function initCartItemsDelegation() {
  const container = document.getElementById("cart-items-container");
  if (!container || container.dataset.delegated === "true") return;
  container.dataset.delegated = "true";

  container.addEventListener("click", function (e) {
    const plusBtn = e.target.closest(".cart-plus-btn");
    const minusBtn = e.target.closest(".cart-minus-btn");
    const deleteBtn = e.target.closest(".delete-item-btn");
    const noteToggleBtn = e.target.closest(".item-note-toggle-btn");
    if (!plusBtn && !minusBtn && !deleteBtn && !noteToggleBtn) return;
    e.stopPropagation();

    if (plusBtn) {
      const idx = parseInt(plusBtn.getAttribute("data-index"));
      if (cart[idx]) {
        cart[idx].qty++;
        safeSetCart(cart);
        updateCart();
      }
    } else if (minusBtn) {
      const idx = parseInt(minusBtn.getAttribute("data-index"));
      if (cart[idx] && cart[idx].qty > 1) {
        cart[idx].qty--;
        safeSetCart(cart);
        updateCart();
      }
    } else if (deleteBtn) {
      const idx = parseInt(deleteBtn.getAttribute("data-index"));
      cart.splice(idx, 1);
      safeSetCart(cart);
      updateCart();
    } else if (noteToggleBtn) {
      const idx = noteToggleBtn.getAttribute("data-index");
      const panel = container.querySelector(
        `.item-note-panel[data-index="${idx}"]`,
      );
      if (panel) {
        panel.classList.toggle("open");
        if (panel.classList.contains("open")) {
          const textarea = panel.querySelector(".item-note-input");
          if (textarea) textarea.focus();
        }
      }
    }
  });

  container.addEventListener(
    "focusout",
    function (e) {
      const textarea = e.target.closest(".item-note-input");
      if (!textarea) return;
      const idx = parseInt(textarea.getAttribute("data-index"));
      if (cart[idx]) {
        cart[idx].note = textarea.value.trim();
        safeSetCart(cart);
      }
    },
    true,
  );

  container.addEventListener("click", function (e) {
    if (e.target.closest(".cart-qty-input")) e.stopPropagation();
  });
  container.addEventListener("mousedown", function (e) {
    if (e.target.closest(".cart-qty-input")) e.stopPropagation();
  });
  container.addEventListener("change", function (e) {
    const input = e.target.closest(".cart-qty-input");
    if (!input) return;
    e.stopPropagation();
    const idx = parseInt(input.getAttribute("data-index"));
    let val = Math.max(1, Math.floor(Math.abs(Number(input.value))));
    if (!val || isNaN(val)) val = 1;
    if (val > 9999) val = 9999;
    input.value = val;
    if (cart[idx]) {
      cart[idx].qty = val;
      safeSetCart(cart);
      updateCart();
    }
  });
}
document.addEventListener("DOMContentLoaded", initCartItemsDelegation);
document.addEventListener("DOMContentLoaded", function () {
  const btnOpenCart = document.getElementById("cart-btn");
  const btnCloseCart = document.getElementById("close-cart-btn");
  const btnCloseCart2 = document.getElementById("close-cart-btn-2");
  const overlayCart = document.getElementById("sidebar-overlay");
  const sidebarCart = document.getElementById("cart-sidebar");
  const stepCartView = document.getElementById("step-cart-view");
  const stepLocationView = document.getElementById("step-location-view");
  const nextToLocationBtn = document.getElementById("next-to-location-btn");
  const backToCartBtn = document.getElementById("back-to-cart-btn");
  function resetSidebarStep() {
    if (stepCartView && stepLocationView) {
      stepCartView.style.display = "flex";
      stepLocationView.style.display = "none";
    }
  }
  function openSidebar() {
    if (sidebarCart && overlayCart) {
      resetSidebarStep();
      sidebarCart.classList.add("active");
      overlayCart.classList.add("active");
      syncCartFromLocalStorage();
    }
  }
  function closeSidebar() {
    if (sidebarCart && overlayCart) {
      sidebarCart.classList.remove("active");
      overlayCart.classList.remove("active");
    }
  }
  if (btnOpenCart)
    btnOpenCart.addEventListener("click", (e) => {
      e.preventDefault();
      openSidebar();
    });
  if (btnCloseCart)
    btnCloseCart.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
    });
  if (btnCloseCart2)
    btnCloseCart2.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
    });
  if (overlayCart) overlayCart.addEventListener("click", closeSidebar);
  if (nextToLocationBtn) {
    nextToLocationBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (cart.length === 0) {
        alert(
          "Keranjang belanja Anda kosong, silakan tambah material terlebih dahulu.",
        );
        return;
      }
      stepCartView.style.display = "none";
      stepLocationView.style.display = "flex";
    });
  }
  if (backToCartBtn) {
    backToCartBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      stepLocationView.style.display = "none";
      stepCartView.style.display = "flex";
    });
  }
  const gridContainer = document.getElementById("produk-container");
  function renderProductGrid() {
    if (!gridContainer || typeof PRODUCT_DATA === "undefined") return;
    if (!PRODUCT_DATA.length) {
      if (window.productsLoadFailed) {
        gridContainer.innerHTML = `
          <div class="catalog-empty-state" style="display:flex; grid-column: 1 / -1;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Gagal memuat katalog produk. Silakan muat ulang halaman, atau pastikan situs diakses lewat web server (bukan dibuka langsung dari file).</p>
          </div>
        `;
      }
      return;
    }
    gridContainer.innerHTML = "";
    const gridFragment = document.createDocumentFragment();
    PRODUCT_DATA.forEach((prod) => {
      const defaultVariant =
        prod.variants && prod.variants.length > 0
          ? prod.variants[0]
          : { name: prod.name, img: "" };
      const card = document.createElement("article");
      card.className = "produk-card";
      card.dataset.groupName = prod.name;
      card.dataset.category = prod.category || "";
      card.dataset.selectedVariant = defaultVariant.name;
      const hasMultipleVariants = prod.variants && prod.variants.length > 1;
      let variantSelectorHtml = "";
      if (hasMultipleVariants) {
        variantSelectorHtml = `<select class="variant-dropdown">`;
        prod.variants.forEach((v) => {
          variantSelectorHtml += `<option value="${v.name}" data-img="${v.img}" data-stock="${v.stock || 0}" data-price="${v.price || ""}">${v.name}</option>`;
        });
        variantSelectorHtml += `</select>`;
      }
      card.innerHTML = `
        <div class="produk-img-box">
          <span class="stock-badge ${getStockBadgeClass(defaultVariant.stock)}">${getStockBadgeText(defaultVariant.stock)}</span>
          <img class="main-card-img" src="${defaultVariant.img}" alt="Material Bekisting - ${defaultVariant.name}" loading="lazy" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;" />
        </div>
        <div class="produk-info">
          <h3 class="display-title ${hasMultipleVariants ? "clickable-title" : ""}" tabindex="${hasMultipleVariants ? "0" : "-1"}">${prod.name}${hasMultipleVariants ? ' <i class="fa-solid fa-chevron-down title-caret"></i>' : ""}</h3>
          <p class="price-indicator-text">${formatPriceLabel(defaultVariant.price)}</p>
          <div class="variant-panel">
            ${variantSelectorHtml}
          </div>
          <div class="card-action-row">
            <button class="view-detail-btn" aria-label="Lihat detail produk ${prod.name}">
              <i class="fa-solid fa-eye"></i> Lihat Detail
            </button>
            <button class="add-cart-btn" aria-label="Tambah cepat ke keranjang">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      `;
      const variantToggleBtn = card.querySelector(".display-title.clickable-title");
      const variantPanel = card.querySelector(".variant-panel");
      if (variantToggleBtn && hasMultipleVariants) {
        variantToggleBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          variantPanel.classList.toggle("open");
          variantToggleBtn.classList.toggle("open");
        });
        variantToggleBtn.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.click();
          }
        });
      }
      const dropdown = card.querySelector(".variant-dropdown");
      const imgTarget = card.querySelector(".main-card-img");
      const stockBadgeTarget = card.querySelector(".stock-badge");
      const priceTarget = card.querySelector(".price-indicator-text");
      if (dropdown) {
        dropdown.addEventListener("change", function () {
          const selectedOption = this.options[this.selectedIndex];
          const newImg = selectedOption.getAttribute("data-img");
          const newName = this.value;
          const newStock = parseInt(
            selectedOption.getAttribute("data-stock"),
          );
          const newPrice = selectedOption.getAttribute("data-price");
          if (imgTarget && newImg) imgTarget.src = newImg;
          card.dataset.selectedVariant = newName;
          if (stockBadgeTarget) {
            stockBadgeTarget.className = `stock-badge ${getStockBadgeClass(newStock)}`;
            stockBadgeTarget.textContent = getStockBadgeText(newStock);
          }
          if (priceTarget) priceTarget.textContent = formatPriceLabel(newPrice);
        });
      }
      const detailBtn = card.querySelector(".view-detail-btn");
      if (detailBtn) {
        detailBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          const encodedName = encodeURIComponent(prod.name);
          const selectedVariant = card.dataset.selectedVariant || prod.name;
          let url = `detail.html?product=${encodedName}`;
          if (selectedVariant !== prod.name) {
            url += `&variant=${encodeURIComponent(selectedVariant)}`;
          }
          window.goToPageWithTransition(url);
        });
      }
      gridFragment.appendChild(card);
    });
    gridContainer.appendChild(gridFragment);
    initDynamicKatalogButtons();
    initModernLiveSearch();
  }
  renderProductGrid();
  document.addEventListener("products-ready", renderProductGrid);
  function initHomeFaqAccordion() {
    const faqItems = document.querySelectorAll("#home-faq-list .faq-item");
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      if (!question) return;
      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        faqItems.forEach((other) => {
          other.classList.remove("open");
          const otherBtn = other.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          question.setAttribute("aria-expanded", "true");
        }
      });
    });
  }
  initHomeFaqAccordion();
  function initModernLiveSearch() {
    const searchInput = document.getElementById("live-search-input");
    const clearBtn = document.getElementById("clear-search-btn");
    const bubbles = document.querySelectorAll(".search-bubble");
    const productCards = document.querySelectorAll(".produk-card");
    if (!searchInput) return;
    function updateCatalogEmptyState() {
      const anyVisible = Array.from(productCards).some(
        (card) => card.style.display !== "none",
      );
      let emptyEl = document.getElementById("catalog-empty-state");
      if (!anyVisible) {
        if (!emptyEl) {
          emptyEl = document.createElement("div");
          emptyEl.id = "catalog-empty-state";
          emptyEl.className = "catalog-empty-state";
          emptyEl.innerHTML = `
            <i class="fa-solid fa-box-open"></i>
            <p>Produk tidak ditemukan. Coba kata kunci atau kategori lain.</p>
          `;
          gridContainer.appendChild(emptyEl);
        }
        emptyEl.style.display = "flex";
      } else if (emptyEl) {
        emptyEl.style.display = "none";
      }
    }
    function filterProducts(query) {
      const cleanQuery = query.toLowerCase().trim();
      productCards.forEach((card) => {
        const groupName = card.dataset.groupName.toLowerCase();
        let variantsText = "";
        const dropdown = card.querySelector(".variant-dropdown");
        if (dropdown) {
          Array.from(dropdown.options).forEach((opt) => {
            variantsText += opt.value.toLowerCase() + " ";
          });
        }
        if (
          groupName.includes(cleanQuery) ||
          variantsText.includes(cleanQuery)
        ) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
      updateCatalogEmptyState();
      if (cleanQuery.length > 0) {
        if (clearBtn) clearBtn.style.display = "block";
      } else {
        if (clearBtn) clearBtn.style.display = "none";
      }
    }
    function filterByCategory(category) {
      productCards.forEach((card) => {
        if (category === "all" || card.dataset.category === category) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
      updateCatalogEmptyState();
      if (clearBtn) clearBtn.style.display = "none";
    }
    searchInput.addEventListener("input", function () {
      filterProducts(this.value);
      renderCatalogSearchDropdown(this.value);
      bubbles.forEach((b) => {
        b.classList.remove("active");
        b.style.background = "#ffffff";
        b.style.color = "#475569";
        b.style.borderColor = "#e2e8f0";
        b.style.boxShadow = "none";
      });
      if (this.value === "") {
        const allBubble = document.querySelector(
          '.search-bubble[data-category="all"]',
        );
        if (allBubble) {
          allBubble.classList.add("active");
          allBubble.style.background = "#ef4444";
          allBubble.style.color = "#ffffff";
          allBubble.style.boxShadow = "0 10px 15px -3px rgba(239,68,68,0.3)";
        }
      }
    });

    // ===== Dropdown live search dengan gambar (sama seperti di halaman detail) =====
    const catalogDropdown = document.getElementById("catalog-search-dropdown");
    function renderCatalogSearchDropdown(rawQuery) {
      if (!catalogDropdown || typeof PRODUCT_DATA === "undefined") return;
      const keyword = rawQuery.trim().toLowerCase();
      catalogDropdown.innerHTML = "";
      if (keyword === "") {
        catalogDropdown.classList.remove("show");
        return;
      }
      const matched = PRODUCT_DATA.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          (p.desc || "").toLowerCase().includes(keyword),
      );
      if (matched.length > 0) {
        matched.slice(0, 8).forEach((p) => {
          const defaultImg =
            p.variants && p.variants[0] ? p.variants[0].img : p.img;
          const variantCount = p.variants ? p.variants.length : 1;
          const itemLink = document.createElement("a");
          itemLink.href = `detail.html?product=${encodeURIComponent(p.name)}`;
          itemLink.className = "search-item";
          itemLink.innerHTML = `
            <img src="${defaultImg}" alt="Material Bekisting - ${p.name}" loading="lazy" onerror="this.src=window.PLACEHOLDER_IMG">
            <div class="search-info">
              <span class="search-name">${p.name}</span>
              <span class="search-variant">${variantCount} Pilihan Varian</span>
            </div>
          `;
          catalogDropdown.appendChild(itemLink);
        });
        catalogDropdown.classList.add("show");
      } else {
        catalogDropdown.innerHTML = `<div class="search-no-results">Produk tidak ditemukan...</div>`;
        catalogDropdown.classList.add("show");
      }
    }
    document.addEventListener("click", function (e) {
      if (
        catalogDropdown &&
        !searchInput.contains(e.target) &&
        !catalogDropdown.contains(e.target)
      ) {
        catalogDropdown.classList.remove("show");
      }
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        filterProducts("");
        searchInput.focus();
        const allBubble = document.querySelector(
          '.search-bubble[data-category="all"]',
        );
        if (allBubble) allBubble.click();
      });
    }
    bubbles.forEach((bubble) => {
      bubble.addEventListener("click", function () {
        bubbles.forEach((b) => {
          b.classList.remove("active");
          b.style.background = "#ffffff";
          b.style.color = "#475569";
          b.style.borderColor = "#e2e8f0";
          b.style.boxShadow = "none";
        });
        this.classList.add("active");
        this.style.background = "#ef4444";
        this.style.color = "#ffffff";
        this.style.borderColor = "transparent";
        this.style.boxShadow = "0 10px 15px -3px rgba(239,68,68,0.3)";
        searchInput.value = "";
        if (clearBtn) clearBtn.style.display = "none";
        const category = this.getAttribute("data-category");
        filterByCategory(category);
      });
    });
  }
  function initDynamicKatalogButtons() {
    document.querySelectorAll(".produk-card").forEach((card) => {
      const addBtn = card.querySelector(".add-cart-btn");
      if (addBtn) {
        addBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const imgTarget = card.querySelector(".main-card-img");
          const baseName = card.dataset.groupName || "";
          // Cari data produk asli dari PRODUCT_DATA berdasarkan nama grup di kartu
          // (bug lama: variabel "prod" dipakai di sini padahal sudah di luar
          // scope forEach PRODUCT_DATA di renderProductGrid(), jadi selalu
          // ReferenceError dan tombol "Tambah" gagal total)
          const prodData =
            (typeof PRODUCT_DATA !== "undefined" &&
              PRODUCT_DATA.find((p) => p.name === baseName)) ||
            {};
          const selectedVariant = card.dataset.selectedVariant || baseName;
          const pName =
            selectedVariant && selectedVariant !== baseName
              ? `${baseName} - ${selectedVariant}`
              : baseName;
          const pImg = imgTarget ? imgTarget.getAttribute("src") : "";
          const variantObj =
            (prodData.variants || []).find((v) => v.name === selectedVariant) ||
            (prodData.variants && prodData.variants[0]) ||
            {};
          const pSku = variantObj.sku || "";
          const pWeight = variantObj.weightKg || 0;
          let currentQty = 1; // tambah cepat dari katalog selalu 1 pcs; ubah jumlah bisa di keranjang/detail
          let currentCart = getCartFromStorage();
          const existingIndex = currentCart.findIndex(
            (item) => item.name === pName,
          );
          if (existingIndex > -1) {
            currentCart[existingIndex].qty += currentQty;
          } else {
            currentCart.push({
              name: pName,
              img: pImg,
              qty: currentQty,
              sku: pSku,
              weightKg: pWeight,
            });
          }
          safeSetCart(currentCart);
          syncCartFromLocalStorage();
          const toast = document.getElementById("toast-notification");
          if (toast) {
            toast.style.top = "20px";
            setTimeout(() => {
              toast.style.top = "-100px";
            }, 2500);
          }
          const sidebarCartEl = document.getElementById("cart-sidebar");
          const overlayCartEl = document.getElementById("sidebar-overlay");
          const stepCartViewEl = document.getElementById("step-cart-view");
          const stepLocationViewEl = document.getElementById(
            "step-location-view",
          );
          if (sidebarCartEl && overlayCartEl) {
            if (stepCartViewEl && stepLocationViewEl) {
              stepCartViewEl.style.display = "flex";
              stepLocationViewEl.style.display = "none";
            }
            sidebarCartEl.classList.add("active");
            overlayCartEl.classList.add("active");
          }
        });
      }
    });
  }
  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (cart.length === 0) return;
      showConfirmModal(
        "Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?",
        function () {
          cart = [];
          localStorage.removeItem("bekisting_cart");
          updateCart();
        },
        "Kosongkan Keranjang",
      );
    });
  }
  syncCartFromLocalStorage();
});
const checkoutWaBtn = document.getElementById("checkout-wa-btn");
if (checkoutWaBtn) {
  checkoutWaBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (cart.length === 0) {
      alert("Keranjang belanja Anda kosong.");
      return;
    }
    const nameField = document.getElementById("buyer-name");
    const phoneField = document.getElementById("buyer-phone");
    const buyerName = nameField.value.trim();
    const buyerPhone = phoneField.value.trim();
    const buyerProject = document.getElementById("buyer-project").value.trim();
    const deliveryMethodEl = document.querySelector(
      'input[name="delivery-method"]:checked',
    );
    const deliveryMethod = deliveryMethodEl ? deliveryMethodEl.value : "delivery";
    const warehouseField = document.getElementById("warehouse-select");
    const fleetField = document.getElementById("fleet-type-select");
    const provinceField = document.getElementById("buyer-province");
    const cityField = document.getElementById("buyer-city");
    const streetField = document.getElementById("buyer-street");
    const picNameField = document.getElementById("pic-lapangan-name");
    const picPhoneField = document.getElementById("pic-lapangan-phone");
    const truckAccessNote = document
      .getElementById("truck-access-note")
      .value.trim();
    const truckAccessConfirm = document.getElementById(
      "truck-access-confirm",
    ).checked;
    const deliveryDate = document.getElementById("delivery-date").value;
    const deliveryShift = document.getElementById("delivery-shift").value;
    const urgencyEl = document.querySelector('input[name="urgency"]:checked');
    const urgency = urgencyEl ? urgencyEl.value : "";
    const buyerNotes = document.getElementById("buyer-notes").value.trim();

    let firstInvalidField = null;
    function markInvalid(field) {
      if (!field) return;
      field.classList.add("input-error");
      if (!firstInvalidField) firstInvalidField = field;
    }
    nameField.classList.toggle("input-error", !buyerName);
    if (!buyerName) firstInvalidField = nameField;

    const phonePattern = /^(0|62)[0-9]{8,14}$/;
    const isPhoneInvalid = !phonePattern.test(
      buyerPhone.replace(/\s+/g, ""),
    );
    phoneField.classList.toggle("input-error", isPhoneInvalid);
    const phoneErrorEl = document.getElementById("buyer-phone-error");
    if (phoneErrorEl) {
      if (isPhoneInvalid && buyerPhone !== "") {
        phoneErrorEl.textContent =
          "Format nomor HP tidak valid. Gunakan format 08xx atau 62xx.";
        phoneErrorEl.classList.add("show");
      } else {
        phoneErrorEl.classList.remove("show");
      }
    }
    if (isPhoneInvalid && !firstInvalidField) firstInvalidField = phoneField;

    if (deliveryMethod === "pickup") {
      if (!warehouseField.value) markInvalid(warehouseField);
      else warehouseField.classList.remove("input-error");
    } else {
      if (!provinceField.value.trim()) markInvalid(provinceField);
      else provinceField.classList.remove("input-error");
      if (!cityField.value.trim()) markInvalid(cityField);
      else cityField.classList.remove("input-error");
      if (!streetField.value.trim()) markInvalid(streetField);
      else streetField.classList.remove("input-error");
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
      alert("Mohon lengkapi seluruh formulir pemesanan Anda!");
      return;
    }

    const safeBuyerName = sanitizeInput(buyerName);
    const safeBuyerPhone = sanitizeInput(buyerPhone);
    const safeBuyerProject = sanitizeInput(buyerProject);

    // Simpan data pemesan agar tidak perlu diketik ulang lain kali
    try {
      localStorage.setItem(
        "bekisting_buyer_info",
        JSON.stringify({
          name: buyerName,
          phone: buyerPhone,
          project: buyerProject,
        }),
      );
    } catch (err) {
      /* abaikan jika localStorage tidak tersedia */
    }

    let itemsText = "";
    let totalQty = 0;
    let totalWeightKg = 0;
    cart.forEach((item, i) => {
      totalQty += item.qty || 0;
      totalWeightKg += (item.weightKg || 0) * (item.qty || 0);
      itemsText += `• ${sanitizeInput(item.name)} - ${item.qty} Pcs\n`;
      if (item.note && item.note.trim()) {
        itemsText += `   ↳ Catatan: ${sanitizeInput(item.note.trim())}\n`;
      }
    });
    const weightText =
      totalWeightKg >= 1000
        ? `~${(totalWeightKg / 1000).toFixed(2)} Ton`
        : `~${Math.round(totalWeightKg)} Kg`;

    let logisticsLine;
    if (deliveryMethod === "pickup") {
      logisticsLine = `Ambil Sendiri - ${sanitizeInput(warehouseField.value)}`;
    } else {
      logisticsLine =
        `Armada Kirim Bekisting Indonesia` +
        (fleetField.value ? ` (${sanitizeInput(fleetField.value)})` : "");
    }

    let scheduleLine = "";
    if (deliveryDate) {
      const dateObj = new Date(deliveryDate + "T00:00:00");
      const dateFormatted = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      scheduleLine = dateFormatted + (deliveryShift ? ` (${deliveryShift})` : "");
    } else if (deliveryShift) {
      scheduleLine = deliveryShift;
    }

    let addressBlock = "";
    if (deliveryMethod === "delivery") {
      const fullAddress = sanitizeInput(
        `${streetField.value.trim()}, ${cityField.value.trim()}, ${provinceField.value.trim()}`,
      );
      addressBlock += `📍 *ALAMAT PROYEK:* ${fullAddress}\n`;
      if (picNameField.value.trim() || picPhoneField.value.trim()) {
        addressBlock += `👷 *PIC Lapangan:* ${sanitizeInput(picNameField.value.trim())} ${picPhoneField.value.trim() ? "(" + sanitizeInput(picPhoneField.value.trim()) + ")" : ""}\n`;
      }
      if (truckAccessNote) {
        addressBlock += `📝 *AKSES TRUK:* ${sanitizeInput(truckAccessNote)}\n`;
      }
      addressBlock += `🚛 *Bisa Dilalui Truk Besar:* ${truckAccessConfirm ? "Ya" : "Belum Dikonfirmasi"}\n`;
    }

    const whatsappNumber = "628123651818";
    let textMessage =
      `*ORDER MATERIAL - BEKISTING INDONESIA*\n` +
      `----------------------------------\n` +
      `👤 *Pemesan:* ${safeBuyerName}${safeBuyerProject ? " (" + safeBuyerProject + ")" : ""}\n` +
      `📞 *WA:* ${safeBuyerPhone}\n\n` +
      `📦 *RINCIAN BARANG (${cart.length} Jenis / ${totalQty} Pcs):*\n` +
      `${itemsText}` +
      `⚖️ *Estimasi Berat:* ${weightText}\n\n` +
      `🚚 *METODE LOGISTIK:* ${logisticsLine}\n` +
      (scheduleLine ? `📅 *JADWAL:* ${scheduleLine}\n` : "") +
      (urgency ? `🔥 *URGENSI:* ${sanitizeInput(urgency)}\n` : "") +
      addressBlock +
      (buyerNotes ? `🗒️ *Catatan Lain:* ${sanitizeInput(buyerNotes)}\n` : "") +
      `----------------------------------\n` +
      `Mohon diinfokan penawaran harga resmi & ketersediaan stoknya. Terima kasih!`;

    window.open(
      `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(textMessage)}`,
      "_blank",
      "noopener,noreferrer",
    );

    if (window.logOrderToDashboard) {
      window.logOrderToDashboard({
        type: "Cart",
        customerName: safeBuyerName,
        phone: safeBuyerPhone,
        address:
          deliveryMethod === "delivery"
            ? sanitizeInput(
                `${streetField.value.trim()}, ${cityField.value.trim()}, ${provinceField.value.trim()}`,
              )
            : "Ambil Sendiri",
        items: cart.map((item) => ({
          name: item.name,
          variant: item.variant || "",
          qty: item.qty || 0,
        })),
        totalQty,
        notes: buyerNotes || "",
      });
    }

    setTimeout(() => {
      showConfirmModal(
        "Apakah pesan WhatsApp sudah terkirim? Kosongkan keranjang sekarang supaya tidak menumpuk untuk pesanan berikutnya.",
        function () {
          cart = [];
          localStorage.removeItem("bekisting_cart");
          updateCart();
          const sidebarCart = document.getElementById("cart-sidebar");
          const overlayCart = document.getElementById("sidebar-overlay");
          if (sidebarCart) sidebarCart.classList.remove("active");
          if (overlayCart) overlayCart.classList.remove("active");
        },
        "Pesanan Terkirim?",
      );
    }, 600);
  });
}
const hamburgerBtn = document.getElementById("hamburger-btn");
const navLinksContainer = document.getElementById("nav-links");
const navDrawerOverlay = document.getElementById("nav-drawer-overlay");
const navDrawerClose = document.getElementById("nav-drawer-close");
function closeNavDrawer() {
  if (navLinksContainer) navLinksContainer.classList.remove("mobile-active");
  if (navDrawerOverlay) navDrawerOverlay.classList.remove("show");
}
if (hamburgerBtn && navLinksContainer) {
  hamburgerBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    navLinksContainer.classList.toggle("mobile-active");
    if (navDrawerOverlay)
      navDrawerOverlay.classList.toggle(
        "show",
        navLinksContainer.classList.contains("mobile-active"),
      );
  });
}
if (navDrawerOverlay)
  navDrawerOverlay.addEventListener("click", closeNavDrawer);
if (navDrawerClose) navDrawerClose.addEventListener("click", closeNavDrawer);
if (navLinksContainer) {
  navLinksContainer
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeNavDrawer));
}
document.addEventListener("DOMContentLoaded", function () {
  const mainSearchInput = document.getElementById("main-search-input");
  const mainDropdown = document.getElementById("main-search-dropdown");
  if (mainSearchInput && mainDropdown && typeof PRODUCT_DATA !== "undefined") {
    mainSearchInput.addEventListener(
      "input",
      debounce(function () {
        const keyword = this.value.trim().toLowerCase();
        mainDropdown.innerHTML = "";
        if (keyword === "") {
          mainDropdown.classList.remove("show");
          return;
        }
        const matchedProducts = PRODUCT_DATA.filter(
          (p) =>
            p.name.toLowerCase().includes(keyword) ||
            p.desc.toLowerCase().includes(keyword),
        );
        if (matchedProducts.length > 0) {
          matchedProducts.forEach((p) => {
            const defaultImg =
              p.variants && p.variants[0] ? p.variants[0].img : p.img;
            const variantCount = p.variants ? p.variants.length : 1;
            const itemLink = document.createElement("a");
            itemLink.href = `detail.html?product=${encodeURIComponent(p.name)}`;
            itemLink.className = "search-item";
            itemLink.innerHTML = `
            <img src="${defaultImg}" alt="Material Bekisting - ${p.name}" loading="lazy" onerror="this.src=window.PLACEHOLDER_IMG">
            <div class="search-info">
              <span class="search-name">${p.name}</span>
              <span class="search-variant">${variantCount} Pilihan Varian</span>
            </div>
          `;
            mainDropdown.appendChild(itemLink);
          });
          mainDropdown.classList.add("show");
        } else {
          mainDropdown.innerHTML = `<div class="search-no-results">Produk tidak ditemukan...</div>`;
          mainDropdown.classList.add("show");
        }
      }, 250),
    );
    document.addEventListener("click", function (e) {
      if (
        !mainSearchInput.contains(e.target) &&
        !mainDropdown.contains(e.target)
      ) {
        mainDropdown.classList.remove("show");
      }
    });
    mainSearchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && this.value.trim() !== "") {
        mainDropdown.classList.remove("show");
      }
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const featuredTrack = document.getElementById("featured-slider-track");
  function initFeaturedSlider() {
    if (
      !featuredTrack ||
      typeof PRODUCT_DATA === "undefined" ||
      !PRODUCT_DATA.length ||
      featuredTrack.dataset.initialized === "true"
    )
      return;
    featuredTrack.dataset.initialized = "true";
    const featuredNames = [
      "Tie Rod",
      "Beam Clamp",
      "Push Pull / Push Pull Prop",
      "Besi Kanal UNP",
      "Form Tie",
      "Besi Hollow Galvanized",
      "Steel Column Clamp",
      "Climbing System",
    ];
    const featuredProducts = featuredNames
      .map((n) => PRODUCT_DATA.find((p) => p.name === n))
      .filter(Boolean);
    featuredTrack.innerHTML = "";
    const featuredFragment = document.createDocumentFragment();
    featuredProducts.forEach((prod) => {
      const variant =
        prod.variants && prod.variants[0] ? prod.variants[0] : {};
      const card = document.createElement("article");
      card.className = "featured-slide-card";
      card.innerHTML = `
        <div class="featured-slide-img-box">
          <img src="${variant.img || ""}" alt="Material Bekisting - ${prod.name}" loading="lazy" onerror="this.onerror=null;this.src=window.PLACEHOLDER_IMG;" />
        </div>
        <div class="featured-slide-info">
          <span class="featured-slide-category">${prod.category || "Material Bekisting"}</span>
          <h3 class="featured-slide-name">${prod.name}</h3>
          <p class="featured-slide-price">${variant.price ? formatRupiah(variant.price) + " (Nego Volume Besar)" : "Hubungi Sales (Nego Volume Besar)"}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        window.goToPageWithTransition(`detail.html?product=${encodeURIComponent(prod.name)}`);
      });
      featuredFragment.appendChild(card);
    });
    featuredTrack.appendChild(featuredFragment);
    const prevBtn = document.getElementById("featured-prev-btn");
    const nextBtn = document.getElementById("featured-next-btn");
    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        featuredTrack.scrollBy({ left: -260, behavior: "smooth" });
      });
    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        featuredTrack.scrollBy({ left: 260, behavior: "smooth" });
      });

    let featuredAutoplayTimer = null;
    function startFeaturedAutoplay() {
      stopFeaturedAutoplay();
      featuredAutoplayTimer = setInterval(() => {
        const maxScroll = featuredTrack.scrollWidth - featuredTrack.clientWidth;
        if (featuredTrack.scrollLeft >= maxScroll - 5) {
          featuredTrack.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          featuredTrack.scrollBy({ left: 260, behavior: "smooth" });
        }
      }, 3500);
    }
    function stopFeaturedAutoplay() {
      if (featuredAutoplayTimer) clearInterval(featuredAutoplayTimer);
    }
    startFeaturedAutoplay();
    featuredTrack.addEventListener("mouseenter", stopFeaturedAutoplay);
    featuredTrack.addEventListener("mouseleave", startFeaturedAutoplay);
    featuredTrack.addEventListener("touchstart", stopFeaturedAutoplay, {
      passive: true,
    });
  }
  initFeaturedSlider();
  document.addEventListener("products-ready", initFeaturedSlider);

  const slides = document.querySelectorAll(".project-slide-img");
  let idx = 0;
  setInterval(() => {
    if (slides.length === 0) return;
    slides[idx].classList.remove("slide-active");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("slide-active");
  }, 5000);
  const navHome = document.getElementById("nav-home");
  const navCatalog = document.getElementById("nav-catalog");
  const navAbout = document.getElementById("nav-about");
  const logoHome = document.getElementById("logo-home-trigger");
  const viewHome = document.getElementById("view-home-container");
  const viewCatalog = document.getElementById("view-catalog-container");
  const viewAbout = document.getElementById("view-about-container");

  function setActiveNav(active) {
    [navHome, navCatalog, navAbout].forEach((el) => {
      if (el) el.classList.remove("active");
    });
    if (active) active.classList.add("active");
  }
  function goHome() {
    viewHome.classList.add("active-view");
    viewCatalog.classList.remove("active-view");
    viewAbout.classList.remove("active-view");
    setActiveNav(navHome);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goCatalog() {
    viewCatalog.classList.add("active-view");
    viewHome.classList.remove("active-view");
    viewAbout.classList.remove("active-view");
    setActiveNav(navCatalog);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goAbout() {
    viewAbout.classList.add("active-view");
    viewHome.classList.remove("active-view");
    viewCatalog.classList.remove("active-view");
    setActiveNav(navAbout);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (navHome)
    navHome.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });
  if (logoHome)
    logoHome.addEventListener("click", (e) => {
      e.preventDefault();
      goHome();
    });
  if (navCatalog)
    navCatalog.addEventListener("click", (e) => {
      e.preventDefault();
      goCatalog();
    });
  if (navAbout)
    navAbout.addEventListener("click", (e) => {
      e.preventDefault();
      goAbout();
    });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "katalog") {
    goCatalog();
    const carriedSearch = urlParams.get("search");
    if (carriedSearch) {
      const mainInput = document.getElementById("live-search-input");
      if (mainInput) {
        mainInput.value = carriedSearch;
        mainInput.dispatchEvent(new Event("input"));
      }
    }
  } else if (urlParams.get("view") === "about") {
    goAbout();
  }
  if (urlParams.get("notice") === "not-found") {
    const toast = document.getElementById("toast-notification");
    const toastMsg = document.getElementById("toast-message");
    if (toast && toastMsg) {
      toastMsg.textContent =
        "Produk yang Anda cari tidak ditemukan. Silakan pilih dari katalog di bawah.";
      toast.style.top = "20px";
      setTimeout(() => {
        toast.style.top = "-100px";
      }, 3500);
    }
    const cleanUrl = window.location.pathname + "?view=katalog";
    window.history.replaceState({}, document.title, cleanUrl);
  }

  const homeAboutMoreBtn = document.getElementById("home-about-more-btn");
  if (homeAboutMoreBtn) {
    homeAboutMoreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      goAbout();
    });
  }
  const faqCatalogLink = document.getElementById("faq-catalog-link");
  if (faqCatalogLink) {
    faqCatalogLink.addEventListener("click", (e) => {
      e.preventDefault();
      goCatalog();
    });
  }
  const heroExploreBtn = document.getElementById("hero-explore-catalog-btn");
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      goCatalog();
    });
  }
  const heroWaQuoteBtn = document.getElementById("hero-wa-quote-btn");
  if (heroWaQuoteBtn) {
    heroWaQuoteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const waNumber = "628123651818";
      const waText =
        "Halo, saya ingin meminta penawaran harga material bekisting untuk proyek saya.";
      window.open(
        `https://api.whatsapp.com/send/?phone=${waNumber}&text=${encodeURIComponent(waText)}`,
        "_blank",
            "noopener,noreferrer",
      );
    });
  }

  const footerHomeBtn = document.getElementById("footer-back-to-home-btn");
  if (footerHomeBtn) {
    footerHomeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      goHome();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  const btnOpenCart = document.getElementById("cart-btn");
  const btnCloseCart1 = document.getElementById("close-cart-btn");
  const btnCloseCart2 = document.getElementById("close-cart-btn-2");
  const overlayCart = document.getElementById("sidebar-overlay");
  const sidebarCart = document.getElementById("cart-sidebar");
  function openSidebar() {
    if (sidebarCart && overlayCart) {
      sidebarCart.classList.add("active");
      overlayCart.classList.add("active");
      if (typeof syncCartFromLocalStorage === "function")
        syncCartFromLocalStorage();
    }
  }
  function closeSidebar() {
    if (sidebarCart && overlayCart) {
      sidebarCart.classList.remove("active");
      overlayCart.classList.remove("active");
    }
  }
  if (btnOpenCart)
    btnOpenCart.addEventListener("click", (e) => {
      e.preventDefault();
      openSidebar();
    });
  if (btnCloseCart1)
    btnCloseCart1.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
    });
  if (btnCloseCart2)
    btnCloseCart2.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
    });
  if (overlayCart) overlayCart.addEventListener("click", closeSidebar);
  const waFloatBtn = document.getElementById("wa-float-btn");
  const waMiniPopup = document.getElementById("wa-mini-popup");
  const waMiniClose = document.getElementById("wa-mini-close");
  const waMiniChatBtn = document.getElementById("wa-mini-chat-btn");
  if (waFloatBtn && waMiniPopup) {
    waFloatBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      waMiniPopup.classList.toggle("show");
    });
  }
  if (waMiniClose) {
    waMiniClose.addEventListener("click", function (e) {
      e.stopPropagation();
      waMiniPopup.classList.remove("show");
    });
  }
  if (waMiniChatBtn) {
    waMiniChatBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const waNumber = "628123651818";
      const waText =
        "Halo, saya ingin bertanya tentang produk bekisting untuk kebutuhan proyek saya.";
      window.open(
        `https://api.whatsapp.com/send/?phone=${waNumber}&text=${encodeURIComponent(waText)}`,
        "_blank",
            "noopener,noreferrer",
      );
      waMiniPopup.classList.remove("show");
    });
  }
  document.addEventListener("click", function (e) {
    if (
      waMiniPopup &&
      waMiniPopup.classList.contains("show") &&
      !waMiniPopup.contains(e.target) &&
      e.target !== waFloatBtn
    ) {
      waMiniPopup.classList.remove("show");
    }
  });

  const buyerNameField = document.getElementById("buyer-name");
  const buyerPhoneField = document.getElementById("buyer-phone");
  function wireValidIcon(field) {
    if (!field) return;
    const icon = field.parentElement
      ? field.parentElement.querySelector(".input-valid-icon")
      : null;
    field.addEventListener("input", function () {
      const val = this.value.trim();
      let valid = val.length > 1;
      if (this.id === "buyer-phone") {
        valid = /^(0|62)[0-9]{8,14}$/.test(val.replace(/\s+/g, ""));
      }
      this.classList.toggle("input-valid", valid);
      if (icon) icon.classList.toggle("show", valid);
    });
  }
  wireValidIcon(buyerNameField);
  wireValidIcon(buyerPhoneField);
  document.querySelectorAll(".form-input-modern").forEach((field) => {
    field.addEventListener("input", function () {
      if (this.value.trim() !== "") {
        this.classList.remove("input-error");
        const errEl = document.getElementById(this.id + "-error");
        if (errEl) errEl.classList.remove("show");
      }
    });
  });

  const revealEls = document.querySelectorAll(".reveal-on-scroll");
  if (revealEls.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // ===== Toggle field Ambil Sendiri vs Armada Kirim =====
  const pickupRadio = document.getElementById("method-pickup");
  const deliveryRadio = document.getElementById("method-delivery");
  const pickupFieldsBox = document.getElementById("pickup-fields");
  const deliveryFieldsBox = document.getElementById("delivery-fields");
  function toggleDeliveryFields() {
    if (!pickupFieldsBox || !deliveryFieldsBox) return;
    const isPickup = pickupRadio && pickupRadio.checked;
    pickupFieldsBox.style.display = isPickup ? "block" : "none";
    deliveryFieldsBox.style.display = isPickup ? "none" : "block";
  }
  if (pickupRadio) pickupRadio.addEventListener("change", toggleDeliveryFields);
  if (deliveryRadio)
    deliveryRadio.addEventListener("change", toggleDeliveryFields);
  toggleDeliveryFields();

  // ===== Tanggal kirim minimal H+1 =====
  const deliveryDateInput = document.getElementById("delivery-date");
  if (deliveryDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deliveryDateInput.min = tomorrow.toISOString().split("T")[0];
  }

  // ===== Auto-isi data pemesan yang tersimpan =====
  function restoreBuyerInfo() {
    try {
      const saved = localStorage.getItem("bekisting_buyer_info");
      if (!saved) return;
      const info = JSON.parse(saved);
      const nameF = document.getElementById("buyer-name");
      const phoneF = document.getElementById("buyer-phone");
      const projectF = document.getElementById("buyer-project");
      if (nameF && info.name) nameF.value = info.name;
      if (phoneF && info.phone) phoneF.value = info.phone;
      if (projectF && info.project) projectF.value = info.project;
    } catch (err) {
      /* abaikan jika data tersimpan rusak */
    }
  }
  restoreBuyerInfo();

  // ===== Update ringkasan pesanan (jenis, qty, berat) =====
  function updateOrderSummaryCard() {
    const countEl = document.getElementById("summary-item-count");
    const qtyEl = document.getElementById("summary-qty-total");
    const weightEl = document.getElementById("summary-weight-total");
    if (!countEl || !qtyEl || !weightEl) return;
    if (!cart.length) {
      countEl.textContent = "-";
      qtyEl.textContent = "-";
      weightEl.textContent = "-";
      return;
    }
    const totalQty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const totalWeightKg = cart.reduce(
      (sum, item) => sum + (item.weightKg || 0) * (item.qty || 0),
      0,
    );
    countEl.textContent = `${cart.length} Jenis`;
    qtyEl.textContent = `${totalQty} Pcs`;
    weightEl.textContent =
      totalWeightKg >= 1000
        ? `~${(totalWeightKg / 1000).toFixed(2)} Ton`
        : `~${Math.round(totalWeightKg)} Kg`;
  }
  updateOrderSummaryCard();
  document.addEventListener("cart-updated", updateOrderSummaryCard);

  const autofillBtn = document.getElementById("autofill-maps-btn");
  const addressField = document.getElementById("buyer-street");
  const gpsErrorMsg = document.getElementById("gps-error-msg");
  if (autofillBtn && !navigator.geolocation) {
    autofillBtn.style.display = "none";
  }
  if (autofillBtn && addressField) {
    autofillBtn.addEventListener("click", function () {
      if (gpsErrorMsg) gpsErrorMsg.classList.remove("show");
      autofillBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Mencari Lokasi GPS...';
      autofillBtn.style.opacity = "0.7";
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
            addressField.value = `Koordinat GPS: ${lat}, ${lon}\nLink Lokasi: ${mapsUrl}\n\n(Silakan tambahkan patokan detail ruko/jalan di sini...)`;
            autofillBtn.innerHTML =
              '<i class="fa-solid fa-circle-check"></i> Lokasi Berhasil Didapatkan!';
            autofillBtn.style.backgroundColor = "#dcfce7";
            setTimeout(() => {
              autofillBtn.innerHTML =
                '<i class="fa-solid fa-location-crosshairs"></i> Bantu Isi Otomatis Pakai GPS (Opsional)';
              autofillBtn.style.opacity = "1";
              autofillBtn.style.backgroundColor = "";
            }, 3000);
          },
          function (error) {
            if (gpsErrorMsg) {
              gpsErrorMsg.textContent =
                "Akses lokasi ditolak/gagal. Silakan tulis alamat Anda secara manual di kolom di bawah.";
              gpsErrorMsg.classList.add("show");
            }
            autofillBtn.innerHTML =
              '<i class="fa-solid fa-location-crosshairs"></i> Bantu Isi Otomatis Pakai GPS (Opsional)';
            autofillBtn.style.opacity = "1";
          },
        );
      } else {
        if (gpsErrorMsg) {
          gpsErrorMsg.textContent =
            "Browser Anda tidak mendukung fitur lokasi. Silakan tulis alamat secara manual.";
          gpsErrorMsg.classList.add("show");
        }
        autofillBtn.innerHTML =
          '<i class="fa-solid fa-location-crosshairs"></i> Bantu Isi Otomatis Pakai GPS (Opsional)';
        autofillBtn.style.opacity = "1";
      }
    });
  }
});

/* ============ Aksesibilitas: Tutup Modal/Drawer/Sidebar dengan Esc ============ */
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;

  const sidebarCartEl = document.getElementById("cart-sidebar");
  const overlayCartEl = document.getElementById("sidebar-overlay");
  if (sidebarCartEl && sidebarCartEl.classList.contains("active")) {
    sidebarCartEl.classList.remove("active");
    if (overlayCartEl) overlayCartEl.classList.remove("active");
  }

  if (typeof closeNavDrawer === "function") closeNavDrawer();

  const catalogModal = document.getElementById("checkout-modal");
  if (catalogModal && catalogModal.classList.contains("show")) {
    catalogModal.classList.remove("show");
  }

  const waMiniPopupEl = document.getElementById("wa-mini-popup");
  if (waMiniPopupEl && waMiniPopupEl.classList.contains("show")) {
    waMiniPopupEl.classList.remove("show");
  }

  const catalogDropdownEl = document.getElementById("catalog-nav-dropdown");
  if (catalogDropdownEl && catalogDropdownEl.classList.contains("open")) {
    catalogDropdownEl.classList.remove("open");
  }

  const confirmModalEl = document.getElementById("confirm-modal-overlay");
  if (confirmModalEl && confirmModalEl.classList.contains("show")) {
    confirmModalEl.classList.remove("show");
  }
});

/* ============ Page Transition Loader ============ */
(function () {
  const overlay = document.getElementById("page-transition-overlay");
  if (!overlay) return;

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => overlay.classList.add("fade-out"), 120);
  });

  window.goToPageWithTransition = function (url) {
    overlay.classList.remove("fade-out");
    overlay.classList.add("fade-in");
    setTimeout(() => {
      window.location.href = url;
    }, 280);
  };

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      link.target === "_blank" ||
      link.hasAttribute("data-no-transition")
    ) {
      return;
    }
    if (href.endsWith(".html") || href.includes(".html?")) {
      e.preventDefault();
      window.goToPageWithTransition(href);
    }
  });
})();
