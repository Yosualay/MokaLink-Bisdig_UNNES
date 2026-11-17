# MokaLink

Dashboard MokaLink untuk mencari UMKM sekitar, membuat pesanan, dan melihat
riwayat transaksi. Antarmuka dibuat dengan Next.js dan autentikasi serta data
pelanggan memakai Supabase.

## Menjalankan aplikasi

1. Instal dependensi dengan `npm install`.
2. Salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL`
   serta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari proyek Supabase.
3. Terapkan migration secara berurutan melalui Supabase CLI atau SQL Editor:
   `20261110183840_customer_accounts_and_orders.sql`, lalu
   `20261117200000_umkm_catalog_and_owner_registration.sql`.
4. Aktifkan konfirmasi email di pengaturan Supabase Auth sesuai kebutuhan.
   Untuk login Google, aktifkan provider Google dan atur kredensial serta URL
   redirect aplikasi pada konfigurasi Supabase.
5. Jalankan `npm run dev`, kemudian buka `http://localhost:3000`.

Gunakan hanya publishable/anon key pada variabel `NEXT_PUBLIC_*`. Jangan
meletakkan `service_role` key di aplikasi browser atau file yang dikomit.

Supabase Auth menyimpan akun dan waktu login; buka **Authentication → Users**
untuk memantau akun pelanggan dan pemilik. `profiles` menyimpan profil,
`businesses` dan `products` menyimpan katalog, `business_owners` menyimpan data
pemilik secara privat, dan `orders`/`order_items` menyimpan pesanan. RLS
membatasi data profil dan pemilik ke akun masing-masing.

Pendaftaran dari menu **Daftar UMKM** langsung menampilkan toko di katalog.
Untuk menambah toko melalui Supabase, masukkan baris ke `public.businesses`
(minimal nama dan kategori), lalu tambahkan menu ke `public.products` dengan
`business_id` toko tersebut. Kolom ID dan kolom katalog lain memiliki nilai
default; jika `starting_price` dibiarkan 0, web memakai harga menu termurah.
Perubahan katalog dikirim ke web secara realtime. Toko contoh dan menunya sudah
di-seed ke database. Pembayaran belum terhubung ke payment gateway.
