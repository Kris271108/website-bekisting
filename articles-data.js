"use strict";
/**
 * articles-data.js
 * Artikel bawaan situs (sama konsepnya seperti products.js untuk produk) —
 * SELALU tampil di artikel.html walau belum pernah disimpan ke Google
 * Sheets. Isinya kurasi/ringkasan dari artikel-artikel di situs lain
 * (bukan tulisan asli redaksi Bekisting Indonesia), makanya tiap artikel
 * WAJIB ada sourceName + sourceUrl sebagai kredit & link balik ke sumber
 * aslinya — jangan dihapus.
 *
 * Kalau artikel dengan slug yang sama sudah ada & diterbitkan di Google
 * Sheets (lewat dashboard admin), versi Sheets itu yang dipakai. Artikel
 * baru boleh ditambah langsung di sini, atau lewat dashboard admin tab
 * Artikel (sudah ada kolom Sumber & Link Sumber juga di sana).
 */
const ARTICLES_DATA = [
  {
    title: "Mengenal Jenis-Jenis Formwork dalam Dunia Konstruksi",
    slug: "mengenal-jenis-jenis-formwork-dalam-dunia-konstruksi",
    summary:
      "Ringkasan seputar ragam jenis formwork/bekisting yang dipakai di lapangan, dari sistem tradisional kayu-plywood sampai sistem reusable modular dan insulated.",
    content: `Formwork atau bekisting adalah cetakan sementara (kadang permanen) yang menahan beton selama proses pengecoran sampai cukup kuat menahan bebannya sendiri. Di lapangan, jenis formwork yang dipilih biasanya disesuaikan dengan skala proyek, anggaran, dan tingkat kerumitan bentuk struktur.

Beberapa jenis yang umum dipakai antara lain formwork tradisional berbahan kayu/plywood yang fleksibel untuk bentuk rumit tapi kurang tahan lama, formwork sistem rekayasa berbahan logam (baja/aluminium) yang lebih presisi dan reusable, formwork plastik modular yang ringan dan cocok untuk proyek perumahan skala besar, hingga formwork insulated yang dirakit permanen sebagai bagian dari struktur untuk kebutuhan isolasi.

Artikel aslinya membahas lebih detail karakteristik dan kelebihan-kekurangan tiap jenis formwork ini.`,
    coverImage: "",
    sourceName: "Oruma.id",
    sourceUrl:
      "https://www.oruma.id/blog/formwork-bekisting-pengertian-dan-jenisnya-di-dunia-konstruksi/",
  },
  {
    title: "Memahami Formwork Bagi Pemula",
    slug: "memahami-formwork-bagi-pemula",
    summary:
      "Panduan dasar buat yang baru terjun ke dunia konstruksi — mengenal fungsi formwork/bekisting sebagai cetakan sementara beton dan kenapa pemilihannya penting.",
    content: `Bagi yang baru mengenal dunia konstruksi, formwork sering jadi istilah yang terdengar teknis tapi sebenarnya konsepnya cukup sederhana: cetakan sementara yang menahan beton cair sampai mengeras dan bisa berdiri sendiri.

Pemilihan formwork yang tepat berpengaruh langsung ke efisiensi proyek — mulai dari kecepatan pemasangan dan pembongkaran, ketahanan material saat dipakai berulang kali, sampai hasil akhir permukaan beton. Kesalahan dalam pemilihan atau pemasangan formwork bisa berakibat pada bentuk struktur yang tidak sesuai desain maupun pemborosan waktu dan biaya proyek.

Artikel aslinya mengulas lebih lengkap dasar-dasar formwork yang perlu diketahui pemula di bidang konstruksi.`,
    coverImage: "",
    sourceName: "Indosteger",
    sourceUrl:
      "https://www.indosteger.co.id/berita/detail/memahami-formwork-bagi-pemula",
  },
  {
    title: "Tips Keselamatan Kerja Saat Menggunakan Scaffolding",
    slug: "tips-keselamatan-kerja-saat-menggunakan-scaffolding",
    summary:
      "Sejumlah tips praktis menjaga keselamatan kerja saat memakai scaffolding di lapangan, dari pengecekan kondisi alat sampai pelatihan pekerja.",
    content: `Scaffolding memberi manfaat besar dalam pekerjaan konstruksi dan pemeliharaan infrastruktur, tapi kalau tidak digunakan dengan benar bisa jadi sumber bahaya besar bagi pekerja — mulai dari risiko jatuh, tertimpa material, hingga bahaya kebakaran maupun listrik di sekitar area kerja.

Beberapa hal dasar yang perlu diperhatikan: memastikan kondisi scaffolding baik dan aman (baut, bingkai, penyangga berfungsi normal), memeriksa kondisi lingkungan kerja sebelum pemasangan, memasang scaffolding sesuai standar keselamatan yang berlaku, serta memberi pelatihan ke pekerja soal cara pakai yang benar.

Artikel aslinya membahas lebih lengkap 10 tips keselamatan kerja pada scaffolding yang bisa jadi acuan di lapangan.`,
    coverImage: "",
    sourceName: "Indonesia Safety Center",
    sourceUrl:
      "https://indonesiasafetycenter.org/tips-keselamatan-kerja-pada-scaffolding/",
  },
  {
    title: "Scaffolding: Pengertian, Jenis, dan Standar Keselamatan Kerja",
    slug: "scaffolding-pengertian-jenis-dan-standar-keselamatan-kerja",
    summary:
      "Ulasan tentang regulasi K3 scaffolding di Indonesia, termasuk Permenaker Nomor 9 Tahun 2016 tentang K3 Pekerjaan pada Ketinggian yang mewajibkan pekerjaan dilakukan oleh tenaga kerja kompeten.",
    content: `Hampir seluruh proyek konstruksi, pemeliharaan fasilitas, sampai industri kapal memakai scaffolding sebagai platform kerja di ketinggian. Karena risikonya cukup tinggi, penggunaan scaffolding di Indonesia diatur dalam Permenaker Nomor 9 Tahun 2016 tentang K3 Pekerjaan pada Ketinggian, yang mewajibkan pekerjaan dilakukan secara aman oleh tenaga kerja yang kompeten.

Sebagian besar insiden scaffolding sebenarnya bisa dicegah lewat desain yang tepat, pemilihan material yang layak pakai, pemeriksaan rutin, serta pemasangan dan pembongkaran oleh tenaga kerja yang sudah terlatih/bersertifikat.

Artikel aslinya mengulas lebih lengkap jenis-jenis scaffolding dan detail standar keselamatan kerja yang berlaku di Indonesia.`,
    coverImage: "",
    sourceName: "AKUALITA",
    sourceUrl: "https://akualita.com/news/scaffolding-k3/",
  },
];
