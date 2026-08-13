"use strict";
/**
 * auth.js
 * Helper login Google — dipakai bareng oleh situs utama (Bekisting.html,
 * detail.html) dan dashboard admin (admin.html). Login diverifikasi di
 * BROWSER saja (bukan di server). Lihat catatan keamanan di
 * auth-config.js.
 */

const AUTH_STORAGE_KEY = "bekistingGoogleAccount";

// Baca isi token Google (JWT) tanpa perlu library tambahan.
function decodeGoogleCredential(credential) {
  try {
    const payloadBase64 = credential.split(".")[1];
    const payloadJson = decodeURIComponent(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(payloadJson);
  } catch (err) {
    console.error("Gagal membaca data login Google:", err);
    return null;
  }
}

function saveLoggedInAccount(profile) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    /* diam-diam gagal (mis. private browsing memblokir localStorage) */
  }
}

function getLoggedInAccount() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function clearLoggedInAccount() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    /* diam-diam gagal */
  }
}

function isAdminEmail(email) {
  if (!email) return false;
  const target = email.trim().toLowerCase();
  const list = typeof ADMIN_EMAILS !== "undefined" ? ADMIN_EMAILS : [];
  return list.some((e) => String(e).trim().toLowerCase() === target);
}

// ===== Widget akun di pojok kanan atas situs utama =====
// (Bekisting.html & detail.html — tidak dipakai di admin.html, admin
// punya layar login sendiri.)
function initSiteAccountWidget() {
  const widget = document.getElementById("account-widget");
  if (!widget) return; // halaman ini tidak punya widget akun

  const btnContainer = document.getElementById("google-signin-btn");
  const chip = document.getElementById("account-chip");
  const chipAvatar = document.getElementById("account-chip-avatar");
  const chipName = document.getElementById("account-chip-name");
  const menu = document.getElementById("account-menu");
  const menuAvatar = document.getElementById("account-menu-avatar");
  const menuName = document.getElementById("account-menu-name");
  const menuEmail = document.getElementById("account-menu-email");
  const adminLink = document.getElementById("account-admin-link");
  const logoutBtn = document.getElementById("account-logout-btn");

  function renderState() {
    const account = getLoggedInAccount();
    if (account) {
      if (btnContainer) btnContainer.style.display = "none";
      if (chip) chip.style.display = "flex";
      if (chipAvatar) chipAvatar.src = account.picture || "";
      if (chipName) chipName.textContent = (account.name || "").split(" ")[0];
      if (menuAvatar) menuAvatar.src = account.picture || "";
      if (menuName) menuName.textContent = account.name || "";
      if (menuEmail) menuEmail.textContent = account.email || "";
      if (adminLink) {
        adminLink.style.display = isAdminEmail(account.email)
          ? "flex"
          : "none";
      }
      autofillCheckoutFromAccount();
    } else {
      if (btnContainer) btnContainer.style.display = "inline-block";
      if (chip) chip.style.display = "none";
      if (adminLink) adminLink.style.display = "none";
      if (menu) menu.classList.remove("open");
    }
  }

  function handleCredential(response) {
    const profile = decodeGoogleCredential(response.credential);
    if (!profile) return;
    saveLoggedInAccount({
      email: profile.email || "",
      name: profile.name || "",
      picture: profile.picture || "",
    });
    renderState();
  }

  function boot() {
    if (typeof google === "undefined" || !google.accounts) {
      // Library Google (GIS) belum selesai dimuat, coba lagi sebentar lagi.
      setTimeout(boot, 300);
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      if (btnContainer) {
        btnContainer.innerHTML =
          '<span class="account-not-configured" title="GOOGLE_CLIENT_ID belum diisi di auth-config.js"><i class="fa-regular fa-circle-user"></i></span>';
      }
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    });
    if (btnContainer) {
      google.accounts.id.renderButton(btnContainer, {
        type: "icon",
        shape: "circle",
        theme: "filled_blue",
        size: "large",
      });
    }
    renderState();
  }

  if (chip) {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu) menu.classList.toggle("open");
    });
  }
  document.addEventListener("click", () => {
    if (menu) menu.classList.remove("open");
  });
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearLoggedInAccount();
      if (typeof google !== "undefined" && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
      renderState();
    });
  }

  boot();
}

// Isi otomatis nama pemesan di form checkout kalau sudah login & field
// masih kosong (tidak menimpa kalau pengunjung sudah ketik sesuatu).
function autofillCheckoutFromAccount() {
  const account = getLoggedInAccount();
  if (!account) return;
  const nameField = document.getElementById("buyer-name");
  if (nameField && !nameField.value.trim()) {
    nameField.value = account.name || "";
    nameField.classList.remove("input-error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSiteAccountWidget();
  autofillCheckoutFromAccount();
  const cartBtn = document.getElementById("cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      setTimeout(autofillCheckoutFromAccount, 150);
    });
  }
});
