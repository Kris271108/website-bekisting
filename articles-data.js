"use strict";
/**
 * articles-data.js
 * Artikel bawaan situs (sama konsepnya seperti products.js untuk produk) —
 * SELALU tampil di artikel.html walau belum pernah disimpan ke Google
 * Sheets. Kalau artikel dengan slug yang sama sudah ada & diterbitkan di
 * Google Sheets (lewat dashboard admin), versi Sheets itu yang dipakai
 * (lebih baru/bisa diedit). Artikel baru boleh ditambah langsung di sini,
 * atau lewat dashboard admin tab Artikel.
 */
const ARTICLES_DATA = [
  {
    title: "Apa Itu Bekisting (Formwork) dan Kenapa Penting dalam Konstruksi?",
    slug: "apa-itu-bekisting-formwork-dan-kenapa-penting-dalam-konstruksi",
    summary:
      "Kenali fungsi dasar bekisting dalam proses pengecoran beton, dan kenapa pemilihan material formwork yang tepat menentukan kualitas akhir struktur bangunan Anda.",
    content: `Bekisting, atau yang dikenal juga dengan istilah formwork, adalah cetakan sementara yang digunakan untuk membentuk struktur beton selama proses pengecoran. Cetakan ini bisa berbahan kayu, plywood, maupun logam, dan berfungsi menahan beton cair pada bentuk yang diinginkan — mulai dari kolom, balok, plat lantai, hingga dinding — sampai beton cukup keras untuk menahan bebannya sendiri.

Tanpa bekisting yang tepat, hasil pengecoran bisa melenceng dari desain struktural, bahkan berisiko menyebabkan kebocoran beton cair atau ketidakrataan permukaan yang berdampak pada kekuatan bangunan jangka panjang.

Beberapa fungsi utama bekisting dalam proyek konstruksi:

1. Menentukan bentuk dan dimensi akhir struktur beton sesuai desain.
2. Menahan tekanan beton cair selama proses curing berlangsung.
3. Menjaga kerataan dan presisi permukaan hasil cor.
4. Bisa dipakai berulang kali (reusable) untuk efisiensi biaya proyek dalam skala besar.

Sistem bekisting yang baik juga didukung oleh aksesoris seperti Tie Rod, Wing Nut, dan Beam Clamp yang menjaga kelurusan serta kekuatan cetakan agar tidak melar atau bocor saat menahan tekanan beton. Karena itu, memilih material bekisting berstandar SNI dan aksesoris pendukung yang sesuai spesifikasi proyek adalah langkah penting yang tidak boleh diabaikan kontraktor maupun mandor lapangan.`,
    coverImage: "",
  },
  {
    title: "Kenali Fungsi Tie Rod, Wing Nut, dan Beam Clamp dalam Sistem Bekisting",
    slug: "kenali-fungsi-tie-rod-wing-nut-dan-beam-clamp-dalam-sistem-bekisting",
    summary:
      "Tiga komponen kecil ini punya peran besar menjaga kekuatan dan presisi cetakan beton. Simak fungsi masing-masing sebelum menentukan kebutuhan material proyek Anda.",
    content: `Dalam sistem bekisting, komponen-komponen pendukung sering kali tidak sebesar panel utamanya, tapi perannya sangat krusial untuk memastikan hasil pengecoran beton aman dan presisi. Tiga komponen yang paling sering digunakan adalah Tie Rod, Wing Nut, dan Beam Clamp.

Tie Rod berfungsi sebagai pengikat antar panel bekisting yang berhadapan, menahan agar jarak antar panel tidak melebar akibat tekanan beton cair yang sangat besar saat proses pengecoran. Tie Rod yang berkualitas rendah berisiko putus di tengah proses cor, yang bisa berakibat fatal pada hasil struktur maupun keselamatan pekerja di lokasi.

Wing Nut dipasang pada ujung Tie Rod untuk mengencangkan sambungan antar panel bekisting. Bentuknya yang menyerupai sayap memudahkan pekerja mengencangkan atau melepas sambungan secara manual tanpa alat bantu khusus, sehingga mempercepat proses pemasangan maupun pembongkaran bekisting di lapangan.

Beam Clamp digunakan untuk menjepit dan mengunci posisi balok penyangga (girder) pada sistem bekisting horizontal, seperti pada pengecoran plat lantai. Clamp yang kokoh memastikan balok penyangga tidak bergeser selama proses pengecoran berlangsung, menjaga kerataan permukaan hasil cor.

Ketiga komponen ini bekerja sebagai satu kesatuan sistem. Kekuatan salah satu komponen yang tidak memadai bisa mempengaruhi keseluruhan sistem bekisting, karena itu penting memilih material dari pemasok yang memahami standar dan kebutuhan teknis proyek konstruksi.`,
    coverImage: "",
  },
  {
    title: "Tips Memilih Scaffolding yang Aman untuk Proyek Konstruksi",
    slug: "tips-memilih-scaffolding-yang-aman-untuk-proyek-konstruksi",
    summary:
      "Scaffolding yang tepat bukan cuma soal menopang beban, tapi juga soal keselamatan kerja. Ini beberapa hal yang perlu diperhatikan sebelum menyewa atau membeli material scaffolding untuk proyek Anda.",
    content: `Scaffolding atau perancah adalah struktur sementara yang menopang pekerja, material, dan peralatan selama proses konstruksi berlangsung, terutama untuk pekerjaan di ketinggian seperti pengecoran kolom, pemasangan dinding, hingga finishing fasad gedung bertingkat. Karena berkaitan langsung dengan keselamatan pekerja, pemilihan scaffolding tidak bisa dilakukan asal-asalan.

Berikut beberapa hal yang perlu diperhatikan sebelum menentukan scaffolding untuk proyek Anda:

1. Kapasitas beban. Pastikan scaffolding yang dipilih mampu menahan beban kerja maksimum, termasuk berat pekerja, material, dan peralatan yang akan diletakkan di atasnya, dengan faktor keamanan yang memadai.

2. Kondisi material. Pipa dan sambungan scaffolding harus bebas dari karat berlebih, penyok, atau keretakan yang bisa melemahkan struktur saat menahan beban.

3. Kestabilan pemasangan. Scaffolding harus dipasang di atas permukaan yang rata dan stabil, dengan pengunci (coupler) yang terpasang sempurna di setiap sambungan untuk mencegah pergeseran struktur.

4. Sesuai standar. Gunakan material scaffolding yang sudah teruji dan sesuai standar konstruksi yang berlaku, bukan sekadar material bekas pakai tanpa pengecekan kondisi.

5. Inspeksi berkala. Untuk proyek jangka panjang, scaffolding perlu diperiksa ulang secara berkala selama masa pemakaian, terutama setelah terpapar cuaca ekstrem atau insiden di lapangan.

Investasi pada material scaffolding yang tepat bukan cuma soal kelancaran proyek, tapi yang terpenting adalah keselamatan seluruh tim di lapangan.`,
    coverImage: "",
  },
  {
    title: "Kenapa Material Bekisting Berstandar SNI Itu Penting?",
    slug: "kenapa-material-bekisting-berstandar-sni-itu-penting",
    summary:
      "Bukan sekadar embel-embel di brosur, standar SNI pada material bekisting punya alasan teknis yang berpengaruh langsung ke keamanan dan hasil akhir proyek konstruksi Anda.",
    content: `Standar Nasional Indonesia (SNI) adalah acuan resmi yang menetapkan spesifikasi minimum sebuah produk, termasuk material konstruksi seperti bekisting dan scaffolding, agar aman dan layak digunakan di lapangan. Bagi kontraktor maupun pemilik proyek, memilih material berstandar SNI bukan sekadar formalitas administratif, tapi langkah mitigasi risiko yang nyata.

Beberapa alasan kenapa standar SNI penting dalam pemilihan material bekisting:

Kekuatan material teruji. Produk berstandar SNI sudah melalui pengujian kekuatan sesuai kriteria teknis yang ditetapkan, sehingga risiko kegagalan struktur akibat material yang tidak memadai bisa diminimalkan.

Konsistensi kualitas. Standar yang jelas membuat kualitas material lebih konsisten antar batch produksi, mengurangi risiko mendapat material dengan kualitas berbeda-beda dalam satu proyek.

Kemudahan pengawasan proyek. Proyek pemerintah maupun swasta skala besar umumnya mensyaratkan penggunaan material bersertifikat sebagai bagian dari audit dan pengawasan kualitas konstruksi.

Keamanan kerja jangka panjang. Material yang tidak sesuai standar berisiko mengalami deformasi atau kegagalan struktur, yang bisa membahayakan keselamatan pekerja maupun kelangsungan proyek secara keseluruhan.

Sebelum membeli material bekisting maupun scaffolding, pastikan menanyakan sertifikasi dan standar yang dipenuhi oleh pemasok Anda — jangan hanya tergiur harga murah tanpa memastikan kualitas dan keamanannya.`,
    coverImage: "",
  },
];
