# MokaLink dashboard

Beranda dan layar aplikasi mengikuti referensi terbaru di folder `../digigiidi/`.
Layout desktop menggunakan tiga area: navigasi ungu di kiri, konten utama di
tengah, dan panel keranjang atau ringkasan di kanan. Pada layar kecil navigasi
berpindah ke bagian bawah.

## Tema visual

| Token | Nilai |
| --- | --- |
| Grape / navigasi / aksi utama | `#431858` |
| Lilac / panel keranjang | `#D3A7E7` |
| Kanvas konten | `#FBF7FC` |
| Surface kartu | `#FFFFFF` |
| Border | `#E8DCEF` |
| Teks sekunder | `#84718E` |

Gunakan kartu putih ber-border tipis, radius sekitar `18–20px`, kontrol pill
untuk filter dan pilihan pengantaran, serta tombol utama grape. Tipografi UI
memakai Geist sans.

## Layar

- **Beranda**: pencarian, lima kategori, kartu UMKM terdekat, ringkasan pesanan,
  keranjang dan kode promo.
- **Detail/menu UMKM**: informasi usaha dan daftar menu dengan aksi tambah ke
  keranjang.
- **Bandingkan**: daftar usaha tersimpan, pilihan dua usaha, dan ringkasan
  perbandingan.
- **Kategori**: daftar usaha, urutan harga/jarak/rating, dan filter samping.
- **Checkout**: data penerima, waktu pengambilan, catatan, pilihan pembayaran,
  dan ringkasan pesanan.
- **History dan Profil**: riwayat/status pesanan dan data profil.
- **Login**: dialog email dan Google.

## Aset dan implementasi

CSS dan layout dashboard berada di `src/app/globals.css`, sedangkan state UI dan
konten layar berada di `src/app/page.js`. Ikon kategori dan thumbnail contoh
berasal dari referensi desain di `../digigiidi/` dan disalin ke `public/`.

Daftar UMKM dan menu masih berupa katalog contoh di sisi aplikasi. Login email,
pendaftaran, login Google, profil, dan riwayat pesanan menggunakan Supabase.
Checkout menyimpan pesanan beserta snapshot nama/harga produk ke database; RPC
database menghitung ulang harga dari katalog yang di-seed dan menerapkan RLS
agar pengguna hanya dapat membaca data akunnya sendiri. Pembayaran QRIS, tunai,
dan e-wallet masih pilihan/pencatatan saja—aplikasi belum memproses pembayaran
atau mengirim pesanan ke UMKM.

## Supabase

1. Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan publishable
   key (atau anon key) dari Supabase. Jangan pernah menggunakan atau
   mengekspos `service_role` key di browser.
2. Jalankan SQL di
   `supabase/migrations/20261110183840_customer_accounts_and_orders.sql` melalui
   Supabase SQL Editor. Migrasi membuat profil, contoh katalog, pesanan, item
   pesanan, trigger pembuatan profil, RPC checkout, serta kebijakan RLS.
3. Aktifkan provider Google di **Authentication → Providers → Google** bila
   login Google diperlukan. Isi kredensial OAuth Google di Supabase, lalu
   tambahkan URL lokal dan URL produksi aplikasi ke daftar redirect URL Supabase.
4. Jalankan ulang aplikasi setelah mengubah `.env.local`. Supabase Auth menyimpan
   akun/email dan menangani password; tabel `profiles` menyimpan nama, nomor HP,
   dan alamat. Tabel `orders`/`order_items` menyimpan data transaksi pelanggan.
