"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = [
  { id: "Makanan", icon: "/category-food.png" },
  { id: "Minuman", icon: "/category-drink.png" },
  { id: "Laundry", icon: "/category-laundry.png" },
  { id: "Bengkel", icon: "/category-repair.png" },
  { id: "Cetak", icon: "/category-print.png" },
];

const categoryImages = new Map(categories.map((category) => [category.id, category.icon]));

function mapBusinessRecord(record) {
  const products = (record.products || []).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
  }));
  const productPrices = products.map((product) => product.price);

  return {
    id: record.id,
    name: record.name,
    category: record.category,
    image: record.image_path || categoryImages.get(record.category) || categories[0].icon,
    price: Number(record.starting_price) || (productPrices.length ? Math.min(...productPrices) : 0),
    distance: Number(record.distance_km),
    rating: Number(record.rating),
    queue: Number(record.queue_count),
    openUntil: record.open_until,
    description: record.description,
    address: record.address,
    products,
  };
}

const navItems = [
  { id: "home", label: "Beranda" },
  { id: "compare", label: "Bandingkan" },
  { id: "history", label: "History" },
  { id: "profile", label: "Profil" },
  { id: "owner-registration", label: "Daftar UMKM" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatOrderDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Logo() {
  return (
    <a className="brand" href="#beranda" aria-label="MokaLink, beranda">
      <svg viewBox="0 0 52 60" fill="none" aria-hidden="true">
        <path
          d="M25 5V1m13 9 3-3M12 10 9 7m16 13v25m-8-16v19m16-25v22m8-16v13M25 46l15-14a4 4 0 0 1 6 6L30 54a15 15 0 0 1-10 4h-3A14 14 0 0 1 3 44V34a4 4 0 0 1 8 0v8-13a4 4 0 0 1 8 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>MokaLink</span>
    </a>
  );
}

function BasketIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 12h22l-2 16H7L5 12Zm5 0 6-8 6 8M12 16v7m8-7v7M3 12h26"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 15s5.5-5.8 5.5-9.4a5.5 5.5 0 1 0-11 0C2.5 9.2 8 15 8 15Zm0-7.3a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m8 1.5 2 4.1 4.5.7-3.3 3.2.8 4.5L8 11.9l-4 2.1.8-4.5L1.5 6.3 6 5.6l2-4.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.22c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.49 4.49 0 0 1-1.94 2.95v2.46h3.14c1.84-1.7 2.91-4.2 2.91-7.28Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.46c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.84a5.86 5.86 0 0 1 0-3.68V7.63H3.29a9.75 9.75 0 0 0 0 8.74l3.25-2.53Z" />
      <path fill="#EA4335" d="M12 6.13c1.43 0 2.72.49 3.73 1.47l2.8-2.8C16.84 3.2 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.25 2.53C7.31 7.85 9.46 6.13 12 6.13Z" />
    </svg>
  );
}

function DialogFrame({ children, className = "", onClose, label }) {
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className={`dialog-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </section>
    </div>
  );
}

function LoginDialog({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitCredentials(event) {
    event.preventDefault();
    setNotice("");
    setErrorMessage("");
    if (!supabase) {
      setErrorMessage("Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated(data.user);
        } else {
          setNotice("Pendaftaran berhasil. Periksa email untuk konfirmasi akun sebelum masuk.");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onAuthenticated(data.user);
      }
    } catch (error) {
      setErrorMessage(error.message || "Autentikasi gagal. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setNotice("");
    setErrorMessage("");
    if (!supabase) {
      setErrorMessage("Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message || "Login Google gagal dimulai.");
      setBusy(false);
    }
  }

  return (
    <DialogFrame className="login-dialog" label={mode === "signup" ? "Daftar akun MokaLink" : "Masuk ke MokaLink"} onClose={onClose}>
      <button className="dialog-close" type="button" aria-label="Tutup login" onClick={onClose}>×</button>
      <Logo />
      <span className="eyebrow">{mode === "signup" ? "BUAT AKUN" : "SELAMAT DATANG"}</span>
      <h2>{mode === "signup" ? "Mulai dukung UMKM sekitar." : "Belanja dekat, dukung hebat."}</h2>
      <p className="muted-copy">Akunmu dipakai untuk menyimpan profil dan riwayat pesanan secara pribadi.</p>
      <button className="google-login" type="button" disabled={busy} onClick={signInWithGoogle}>
        <GoogleIcon /> Lanjutkan dengan Google
      </button>
      <div className="form-divider"><span>{mode === "signup" ? "atau daftar dengan email" : "atau masuk dengan email"}</span></div>
      <form className="dialog-form" onSubmit={submitCredentials}>
        {mode === "signup" && <>
          <label htmlFor="register-name">Nama lengkap</label>
          <input id="register-name" type="text" autoComplete="name" maxLength={120} placeholder="Nama lengkap" value={name} onChange={(event) => setName(event.target.value)} required />
        </>}
        <label htmlFor="login-email">Alamat email</label>
        <input id="login-email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="login-password">Kata sandi</label>
        <input id="login-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} placeholder={mode === "signup" ? "Minimal 8 karakter" : "Masukkan kata sandi"} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Memproses..." : mode === "signup" ? "Daftar akun" : "Masuk"}</button>
      </form>
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {errorMessage && <p className="inline-notice error-notice" role="alert">{errorMessage}</p>}
      <p className="muted-copy auth-mode-switch">
        {mode === "signup" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setNotice(""); setErrorMessage(""); }}>
          {mode === "signup" ? "Masuk" : "Daftar sekarang"}
        </button>
      </p>
    </DialogFrame>
  );
}

function BusinessImage({ business, className = "" }) {
  return (
    <Image
      className={`business-image ${className}`}
      src={business.image}
      alt={business.name}
      width={500}
      height={280}
      sizes="(max-width: 700px) 90vw, 260px"
    />
  );
}

function StoreCard({ business, onOpen, onToggleSave, saved }) {
  return (
    <article className="store-card">
      <button className="store-photo-button" type="button" onClick={() => onOpen(business)} aria-label={`Lihat menu ${business.name}`}>
        <BusinessImage business={business} />
      </button>
      <div className="store-card-copy">
        <button className="store-name" type="button" onClick={() => onOpen(business)}>{business.name}</button>
        <p>Mulai {formatCurrency(business.price)} · {business.distance.toFixed(1).replace(".", ",")} km · <StarIcon /> {business.rating.toFixed(1).replace(".", ",")}</p>
        <div className="store-actions">
          <button className="primary-button small-button" type="button" onClick={() => onOpen(business)}>Lihat informasi</button>
          <button className={`secondary-button small-button${saved ? " is-saved" : ""}`} type="button" aria-pressed={saved} onClick={() => onToggleSave(business.id)}>{saved ? "Ditandai" : "Tandai"}</button>
        </div>
      </div>
    </article>
  );
}

function HomeView({ businessesToShow, businessLoading, search, setSearch, onCategory, onOpen, onToggleSave, savedIds, onNavigate, orders }) {
  return (
    <>
      <div className="search-bar">
        <input aria-label="Cari UMKM" placeholder="Cari UMKM atau jasa yang kamu tahu di sini" value={search} onChange={(event) => setSearch(event.target.value)} />
        <span aria-hidden="true">⌕</span>
      </div>
      <section className="dashboard-section category-section">
        <div className="section-title-row">
          <div><h1>Kategori</h1><p>5 kategori tersedia</p></div>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button key={category.id} className="category-card" type="button" onClick={() => onCategory(category.id)}>
              <Image src={category.icon} alt="" width={54} height={54} />
              <span>{category.id}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-title-row">
          <div><h2>UMKM terdekat</h2><p>Urut dari yang paling murah</p></div>
          <button className="text-button" type="button" onClick={() => onCategory("")}>Lihat semua</button>
        </div>
        <div className="store-grid">
          {businessesToShow.slice(0, 3).map((business) => (
            <StoreCard key={business.id} business={business} onOpen={onOpen} onToggleSave={onToggleSave} saved={savedIds.includes(business.id)} />
          ))}
          {businessLoading
            ? <p className="empty-message">Memuat UMKM dari database...</p>
            : businessesToShow.length === 0 && <p className="empty-message">Belum ada UMKM yang cocok. Daftarkan usaha atau coba pencarian lain.</p>}
        </div>
      </section>
      <section className="dashboard-section history-preview">
        <div className="section-title-row"><div><h2>Riwayat pesanan</h2><p>{orders.length} pesanan tersimpan</p></div></div>
        <div className="orders-table">
          <div className="orders-row orders-head"><span>UMKM</span><span>No. pesanan</span><span>Jumlah</span><span>Status</span></div>
          {orders.slice(0, 2).map((order) => <div className="orders-row" key={order.id}><span>{order.businessNames}</span><span>{order.order_number}</span><span>{formatCurrency(order.total)}</span><span><b className={`status-tag ${order.status === "Selesai" ? "status-done" : "status-progress"}`}>{order.status}</b></span></div>)}
        </div>
        {orders.length === 0 && <p className="empty-message">Pesanan yang kamu buat akan muncul di sini.</p>}
        <button className="text-button history-link" type="button" onClick={() => onNavigate("history")}>Lihat semua riwayat</button>
      </section>
    </>
  );
}

function MenuView({ business, cart, onAdd }) {
  return (
    <section className="page-view menu-view">
      <div className="page-heading">
        <h1>{business.name}</h1>
        <p>{business.distance.toFixed(1).replace(".", ",")} km · ★ {business.rating.toFixed(1).replace(".", ",")} · antre {business.queue} · buka sampai {business.openUntil}</p>
        {business.description && <p>{business.description}</p>}
        {business.address && <p>{business.address}</p>}
      </div>
      <h2 className="view-subheading">Menu</h2>
      <div className="menu-list">
        {business.products.map((product) => {
          const item = cart.find((entry) => entry.businessId === business.id && entry.productId === product.id);
          return (
            <article className="menu-card" key={product.id}>
              <div><h3>{product.name}</h3><p>{formatCurrency(product.price)}</p><button className="primary-button add-button" type="button" onClick={() => onAdd(business, product)}>{item ? `Tambah × ${item.quantity}` : "Tambah"}</button></div>
              <BusinessImage business={business} />
            </article>
          );
        })}
        {business.products.length === 0 && <p className="empty-message">Menu atau layanan belum ditambahkan.</p>}
      </div>
    </section>
  );
}

function CategoryView({ category, stores, onOpen, onToggleSave, savedIds }) {
  const [sortBy, setSortBy] = useState("price");
  const sortedStores = useMemo(() => [...stores].sort((a, b) => sortBy === "rating" ? b.rating - a.rating : sortBy === "distance" ? a.distance - b.distance : a.price - b.price), [sortBy, stores]);
  return (
    <section className="page-view category-view">
      <div className="page-heading"><h1>{category || "Semua UMKM"}</h1><p>{stores.length} UMKM di sekitarmu</p></div>
      <div className="sort-chips">{[{ value: "price", label: "Termurah" }, { value: "distance", label: "Terdekat" }, { value: "rating", label: "Rating tertinggi" }].map((item) => <button key={item.value} className={`filter-chip${sortBy === item.value ? " active" : ""}`} type="button" onClick={() => setSortBy(item.value)}>{item.label}</button>)}</div>
      <div className="category-store-list">{sortedStores.map((business) => (
        <article className="category-store-row" key={business.id}>
          <BusinessImage business={business} />
          <div><h2>{business.name}</h2><p>Mulai {formatCurrency(business.price)} · {business.distance.toFixed(1).replace(".", ",")} km · ★ {business.rating.toFixed(1).replace(".", ",")}</p></div>
          <button className="secondary-button small-button" type="button" onClick={() => onToggleSave(business.id)}>{savedIds.includes(business.id) ? "Ditandai" : "Tandai"}</button>
          <button className="primary-button small-button" type="button" onClick={() => onOpen(business)}>Lihat informasi</button>
        </article>
      ))}</div>
    </section>
  );
}

function CompareView({ savedStores, selectedIds, setSelectedIds, onOpen }) {
  const compareStores = savedStores.filter((item) => selectedIds.includes(item.id)).slice(0, 2);
  const filters = ["Semua", "Makanan", "Laundry", "Bengkel"];
  const [filter, setFilter] = useState("Semua");
  const shownStores = filter === "Semua" ? savedStores : savedStores.filter((item) => item.category === filter);
  return (
    <section className="page-view compare-view">
      <div className="page-heading"><h1>Tersimpan</h1><p>{savedStores.length} UMKM yang kamu tandai. Centang dua untuk dibandingkan.</p></div>
      <div className="sort-chips">{filters.map((item) => <button className={`filter-chip${filter === item ? " active" : ""}`} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="saved-store-list">{shownStores.map((business) => (
        <article className="saved-store-row" key={business.id}>
          <input type="checkbox" aria-label={`Bandingkan ${business.name}`} checked={selectedIds.includes(business.id)} onChange={() => setSelectedIds((current) => current.includes(business.id) ? current.filter((id) => id !== business.id) : current.length < 2 ? [...current, business.id] : [current[1], business.id])} />
          <BusinessImage business={business} />
          <div className="saved-copy"><h2>{business.name}</h2><p>Mulai {formatCurrency(business.price)} · {business.distance.toFixed(1).replace(".", ",")} km · ★ {business.rating.toFixed(1).replace(".", ",")}</p></div>
          <button className="secondary-button small-button" type="button" onClick={() => onOpen(business)}>Lihat informasi</button>
        </article>
      ))}</div>
      {!savedStores.length && <div className="empty-card"><h2>Belum ada UMKM tersimpan</h2><p>Tandai usaha dari halaman beranda untuk membandingkannya.</p></div>}
      <div className="compare-summary"><h2>Bandingkan ({compareStores.length})</h2>{compareStores.length === 2 ? <div className="compare-table">{compareStores.map((business) => <strong key={business.id}>{business.name}</strong>)}{["Harga mulai", "Jarak", "Rating", "Antrean"].map((label, index) => <Fragment key={label}><span>{label}</span>{compareStores.map((business) => <span key={business.id}>{index === 0 ? formatCurrency(business.price) : index === 1 ? `${business.distance.toFixed(1)} km` : index === 2 ? business.rating.toFixed(1) : business.queue}</span>)}</Fragment>)}</div> : <p>Centang dua UMKM untuk membandingkan.</p>}</div>
    </section>
  );
}

function HistoryView({ orders, loading, businesses }) {
  const [filter, setFilter] = useState("Semua");
  const visibleOrders = orders.filter((order) =>
    filter === "Semua" ||
    (filter === "Diproses" && ["Dipesan", "Diproses", "Siap diambil"].includes(order.status)) ||
    order.status === filter,
  );
  return (
    <section className="page-view history-view">
      <div className="page-heading"><h1>Riwayat pesanan</h1><p>{orders.length} pesanan dari akunmu</p></div>
      <div className="sort-chips">{["Semua", "Diproses", "Selesai", "Dibatalkan"].map((item) => <button key={item} className={`filter-chip${filter === item ? " active" : ""}`} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="order-history-list">{visibleOrders.map((order) => {
        const business = businesses.find((item) => item.id === order.items[0]?.business_id);
        const detail = order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(", ");
        return <article className="history-order-card" key={order.id}>{business && <BusinessImage business={business} />}<div className="history-order-copy"><h2>{order.businessNames}</h2><p>{order.order_number} · {formatOrderDate(order.created_at)}</p><p>{detail}</p></div><div className="history-order-total"><strong>{formatCurrency(order.total)}</strong><span className={`status-tag ${order.status === "Selesai" ? "status-done" : "status-progress"}`}>{order.status}</span></div></article>;
      })}</div>
      {loading && <p className="empty-message">Memuat riwayat pesanan...</p>}
      {!loading && visibleOrders.length === 0 && <div className="empty-card"><h2>Belum ada pesanan</h2><p>Pesanan yang kamu buat akan tersimpan di akun dan tampil di sini.</p></div>}
    </section>
  );
}

function ProfileView({ user, profile, onChangeProfile, onLogout, onSaveProfile, savedCount, saveNotice, saving }) {
  return (
    <section className="page-view profile-view">
      <div className="page-heading"><h1>Profil</h1></div>
      <div className="profile-identity"><div className="avatar">{(profile.full_name || user.email || "U").slice(0, 1).toUpperCase()}</div><div><h2>{profile.full_name || "Pengguna MokaLink"}</h2><p>{user.email}</p></div></div>
      <form className="profile-form" onSubmit={(event) => { event.preventDefault(); onSaveProfile(); }}>
        <label htmlFor="profile-name">Nama</label><input id="profile-name" maxLength={120} value={profile.full_name} onChange={(event) => onChangeProfile("full_name", event.target.value)} required />
        <label htmlFor="profile-phone">Nomor HP</label><input id="profile-phone" maxLength={40} inputMode="tel" placeholder="08xx xxxx xxxx" value={profile.phone} onChange={(event) => onChangeProfile("phone", event.target.value)} />
        <label htmlFor="profile-address">Alamat antar</label><input id="profile-address" maxLength={500} placeholder="Tulis alamat antar" value={profile.address} onChange={(event) => onChangeProfile("address", event.target.value)} />
        <div className="profile-setting"><span>Notifikasi pesanan</span><span>Aktif</span></div>
        <div className="profile-setting"><span>UMKM ditandai</span><span>{savedCount}</span></div>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan perubahan"}</button>
        <button className="secondary-button" type="button" onClick={onLogout}>Keluar</button>
      </form>
      {saveNotice && <p className="inline-notice" role={saveNotice.startsWith("Gagal") ? "alert" : "status"}>{saveNotice}</p>}
    </section>
  );
}

function OwnerRegistrationView({ user, profile, onLogin, onRegister, saving, notice, error }) {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState(null);
  const [phone, setPhone] = useState(null);
  const [products, setProducts] = useState([{ name: "", price: "" }]);

  async function submitRegistration(event) {
    event.preventDefault();
    const saved = await onRegister({
      name: businessName,
      category,
      description,
      address,
      ownerName: ownerName ?? profile.full_name ?? user.user_metadata?.full_name ?? "",
      phone: phone ?? profile.phone ?? "",
      products: products.map((product) => ({
        name: product.name,
        price: Number(product.price),
      })),
    });

    if (saved) {
      setBusinessName("");
      setCategory("Makanan");
      setDescription("");
      setAddress("");
      setOwnerName(null);
      setPhone(null);
      setProducts([{ name: "", price: "" }]);
    }
  }

  return (
    <section className="page-view owner-registration-view">
      <div className="page-heading">
        <h1>Daftarkan UMKM</h1>
        <p>Lengkapi profil usaha dan menu atau layanan agar langsung tampil di MokaLink.</p>
      </div>
      {!user ? (
        <div className="empty-card">
          <h2>Masuk sebagai pemilik UMKM</h2>
          <p>Gunakan akun MokaLink untuk menghubungkan usaha dengan pemiliknya.</p>
          <button className="primary-button" type="button" onClick={onLogin}>Masuk / Daftar</button>
        </div>
      ) : (
        <>
          <form className="owner-registration-form" onSubmit={submitRegistration}>
            <div className="owner-form-grid">
              <label className="owner-field" htmlFor="owner-business-name">Nama usaha
                <input id="owner-business-name" maxLength={120} value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
              </label>
              <label className="owner-field" htmlFor="owner-business-category">Kategori
                <select id="owner-business-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
                </select>
              </label>
              <label className="owner-field owner-field-wide" htmlFor="owner-business-description">Deskripsi usaha
                <textarea id="owner-business-description" maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ceritakan produk atau layanan utama" />
              </label>
              <label className="owner-field owner-field-wide" htmlFor="owner-business-address">Alamat usaha
                <input id="owner-business-address" maxLength={500} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Alamat atau patokan lokasi" />
              </label>
              <label className="owner-field" htmlFor="owner-name">Nama pemilik
                <input id="owner-name" maxLength={120} value={ownerName ?? profile.full_name ?? user.user_metadata?.full_name ?? ""} onChange={(event) => setOwnerName(event.target.value)} required />
              </label>
              <label className="owner-field" htmlFor="owner-phone">Nomor WhatsApp
                <input id="owner-phone" type="tel" inputMode="tel" maxLength={40} value={phone ?? profile.phone ?? ""} onChange={(event) => setPhone(event.target.value)} required />
              </label>
            </div>
            <div className="owner-products">
              <div className="section-title-row">
                <div><h2>Menu atau layanan</h2><p>Minimal satu item wajib diisi.</p></div>
                <button className="secondary-button small-button" type="button" disabled={products.length >= 30} onClick={() => setProducts((current) => [...current, { name: "", price: "" }])}>Tambah menu</button>
              </div>
              {products.map((product, index) => (
                <div className="owner-product-row" key={index}>
                  <label className="owner-field" htmlFor={`owner-product-${index}`}>Nama menu / layanan
                    <input id={`owner-product-${index}`} maxLength={120} value={product.name} onChange={(event) => setProducts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} required />
                  </label>
                  <label className="owner-field" htmlFor={`owner-price-${index}`}>Harga (Rp)
                    <input id={`owner-price-${index}`} type="number" min="0" max="2147483647" step="1" value={product.price} onChange={(event) => setProducts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} required />
                  </label>
                  <button className="secondary-button small-button owner-remove-product" type="button" aria-label={`Hapus menu ${index + 1}`} disabled={products.length === 1} onClick={() => setProducts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Hapus</button>
                </div>
              ))}
            </div>
            <button className="primary-button owner-submit-button" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Daftarkan dan tampilkan usaha"}</button>
          </form>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          {error && <p className="inline-notice error-notice" role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}

function CheckoutView({ cartEntries, onBack, onPlaceOrder, profile, onChangeProfile, fulfillment, promoApplied, submitting }) {
  const [note, setNote] = useState("");
  const [pickupTime, setPickupTime] = useState("now");
  const [payment, setPayment] = useState("QRIS");
  const subtotal = cartEntries.reduce((total, entry) => total + entry.product.price * entry.quantity, 0);
  const deliveryFee = fulfillment === "Antar" ? 4000 : 0;
  const discount = promoApplied ? Math.min(2000, subtotal) : 0;
  return (
    <section className="page-view checkout-view">
      <div className="page-heading"><h1>Data diri</h1></div>
      <form id="checkout-form" className="checkout-form" onSubmit={(event) => { event.preventDefault(); onPlaceOrder({ buyerName: profile.full_name, phone: profile.phone, address: profile.address, note, pickupTime, payment }); }}>
        <label htmlFor="checkout-name">Nama</label><input id="checkout-name" autoComplete="name" maxLength={120} value={profile.full_name} onChange={(event) => onChangeProfile("full_name", event.target.value)} required />
        <label htmlFor="checkout-phone">Nomor HP</label><input id="checkout-phone" autoComplete="tel" maxLength={40} placeholder="08xx xxxx xxxx" inputMode="tel" value={profile.phone} onChange={(event) => onChangeProfile("phone", event.target.value)} required />
        {fulfillment === "Antar" && <><label htmlFor="checkout-address">Alamat antar</label><input id="checkout-address" autoComplete="street-address" maxLength={500} value={profile.address} onChange={(event) => onChangeProfile("address", event.target.value)} required /></>}
        <label htmlFor="pickup-time">Waktu pengambilan</label><select id="pickup-time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)}><option value="now">Ambil sekarang</option><option value="later">Ambil nanti</option></select>
        <label htmlFor="checkout-note">Catatan</label><textarea id="checkout-note" maxLength={1000} placeholder="Tulis catatan untuk penjual" rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
        <span className="form-label">Metode pembayaran</span>
        <div className="payment-options">{["QRIS", "Tunai", "E-Wallet"].map((item) => <button key={item} type="button" className={`filter-chip${payment === item ? " active" : ""}`} onClick={() => setPayment(item)}>{item}</button>)}</div>
        <button className="primary-button mobile-submit" type="submit" disabled={submitting || cartEntries.length === 0}>{submitting ? "Menyimpan pesanan..." : `Bayar sekarang · ${formatCurrency(subtotal + deliveryFee - discount)}`}</button>
      </form>
      <button className="text-button back-link" type="button" onClick={onBack}>← Kembali ke keranjang</button>
    </section>
  );
}

function Sidebar({ activePage, setActivePage, onLogin, onLogout, user }) {
  return (
    <aside className="app-sidebar">
      <Logo />
      <nav className="side-nav" aria-label="Menu utama">
        {navItems.map((item) => <button className={`side-nav-link${activePage === item.id ? " active" : ""}`} key={item.id} type="button" onClick={() => setActivePage(item.id)}>{item.label}</button>)}
      </nav>
      {user ? <div className="sidebar-account"><span title={user.email}>{user.email}</span><button className="sidebar-login" type="button" onClick={onLogout}>Keluar</button></div> : <button className="sidebar-login" type="button" onClick={onLogin}>Masuk / Daftar</button>}
      <span className="sidebar-version">MokaLink</span>
    </aside>
  );
}

function CartPanel({ entries, onChangeQuantity, fulfillment, setFulfillment, promo, setPromoApplied, promoApplied, setPromo, promoMessage, setPromoMessage, subtotal, onCheckout, activePage, savedStores, comparedStores, onClearSaved, onLogin, onSaveProfile, filters, setFilters, user, orders, profile, submittingOrder }) {
  const deliveryFee = fulfillment === "Antar" && entries.length ? 4000 : 0;
  const discount = promoApplied ? Math.min(2000, subtotal) : 0;
  const total = subtotal + deliveryFee - discount;
  if (activePage === "compare") {
    const compared = comparedStores.slice(0, 2);
    return (
      <aside className="cart-panel detail-side-panel">
        <h2 className="cart-panel-title">Bandingkan ({compared.length})</h2>
        <div className="compare-table">
          <div className="compare-table-header"><span />{compared.map((business) => <strong key={business.id}>{business.name.split(" ").slice(-1)[0]}</strong>)}</div>
          {["Harga mulai", "Jarak", "Rating", "Antrean"].map((label, index) => (
            <div className="compare-table-row" key={label}>
              <span>{label}</span>
              {compared.map((business) => <span key={business.id}>{index === 0 ? formatCurrency(business.price) : index === 1 ? `${business.distance.toFixed(1).replace(".", ",")} km` : index === 2 ? business.rating.toFixed(1).replace(".", ",") : business.queue}</span>)}
            </div>
          ))}
        </div>
        <button className="primary-button side-panel-action" type="button" onClick={onClearSaved}>Hapus tanda</button>
      </aside>
    );
  }
  if (activePage === "history") {
    const latestOrder = orders[0];
    if (!latestOrder) {
      return (
        <aside className="cart-panel detail-side-panel">
          <h2 className="cart-panel-title">Pesanan terbaru</h2>
          <p className="cart-empty-copy">Pesanan baru akan tampil di sini setelah checkout.</p>
        </aside>
      );
    }
    return (
      <aside className="cart-panel detail-side-panel">
        <h2 className="cart-panel-title">Detail {latestOrder.order_number}</h2>
        <p className="history-side-subtitle">{latestOrder.businessNames}</p>
        <div className="order-timeline">
          {["Dipesan", "Diproses", "Siap diambil"].map((step) => <div className={`timeline-step${["Dipesan", "Diproses", "Siap diambil", "Selesai"].indexOf(latestOrder.status) >= ["Dipesan", "Diproses", "Siap diambil"].indexOf(step) ? " complete" : ""}`} key={step}><span />{step}</div>)}
        </div>
        <div className="cart-totals history-side-total"><div className="cart-total"><strong>Total</strong><strong>{formatCurrency(latestOrder.total)}</strong></div></div>
        <button className="primary-button cart-submit" type="button" onClick={() => onCheckout()}>Buat pesanan baru</button>
      </aside>
    );
  }
  if (activePage === "profile") {
    return (
      <aside className="cart-panel detail-side-panel">
        <h2 className="cart-panel-title">Ringkasan</h2>
        <div className="profile-stats">
          <div><span>Total pesanan</span><strong>{orders.length}</strong></div>
          <div><span>Sedang diproses</span><strong>{orders.filter((order) => ["Dipesan", "Diproses", "Siap diambil"].includes(order.status)).length}</strong></div>
          <div><span>UMKM ditandai</span><strong>{savedStores.length}</strong></div>
        </div>
        <button className="primary-button side-panel-action" type="button" onClick={onSaveProfile}>Simpan perubahan</button>
        {user && <p className="cart-empty-copy">{user.email}</p>}
        <button className="secondary-button side-panel-action" type="button" onClick={onLogin}>{user ? "Kelola akun" : "Masuk / Daftar"}</button>
      </aside>
    );
  }
  if (activePage === "category") {
    return (
      <aside className="cart-panel detail-side-panel">
        <h2 className="cart-panel-title">Filter</h2>
        <div className="filter-group"><label>Harga</label><div>{[{ label: "Semua", value: null }, { label: "< Rp 5.000", value: 5000 }, { label: "< Rp 10.000", value: 10000 }].map((item) => <button key={item.label} type="button" className={`side-filter-chip${filters.maxPrice === item.value ? " active" : ""}`} onClick={() => setFilters((current) => ({ ...current, maxPrice: item.value }))}>{item.label}</button>)}</div></div>
        <div className="filter-group"><label>Jarak</label><div>{[{ label: "Semua", value: null }, { label: "< 500 m", value: 0.5 }, { label: "< 1 km", value: 1 }].map((item) => <button key={item.label} type="button" className={`side-filter-chip${filters.maxDistance === item.value ? " active" : ""}`} onClick={() => setFilters((current) => ({ ...current, maxDistance: item.value }))}>{item.label}</button>)}</div></div>
        <div className="filter-group"><label>Rating</label><div>{[{ label: "Semua", value: null }, { label: "4,5 ke atas", value: 4.5 }].map((item) => <button key={item.label} type="button" className={`side-filter-chip${filters.minRating === item.value ? " active" : ""}`} onClick={() => setFilters((current) => ({ ...current, minRating: item.value }))}>{item.label}</button>)}</div></div>
        <button className="primary-button side-panel-action" type="button" disabled={filters.maxPrice === null && filters.maxDistance === null && filters.minRating === null}>Filter diterapkan</button>
      </aside>
    );
  }
  const showAddress = activePage !== "checkout";
  return (
    <aside className="cart-panel">
      {showAddress && <div className="address-card"><strong>Alamat pesanan</strong><span>{profile.address || "Tambahkan alamat melalui Profil"}</span><small>Estimasi 20 menit <button type="button" onClick={() => onLogin()}>{user ? "Ubah" : "Masuk"}</button></small></div>}
      <h2 className="cart-panel-title">{activePage === "checkout" ? "Pesanan" : "Keranjang"}{entries.length > 0 && <span>{entries.reduce((sum, item) => sum + item.quantity, 0)}</span>}</h2>
      {activePage !== "checkout" && <div className="fulfillment-switch">{["Antar", "Ambil sendiri"].map((item) => <button key={item} className={fulfillment === item ? "active" : ""} type="button" onClick={() => setFulfillment(item)}>{item}</button>)}</div>}
      <div className="cart-panel-items">
        {entries.length ? entries.map((entry) => (
          <article className="cart-panel-item" key={`${entry.business.id}-${entry.product.id}`}>
            <BusinessImage business={entry.business} />
            <div className="cart-item-copy"><strong>{entry.product.name}</strong><span>{entry.business.name}</span><b>{formatCurrency(entry.product.price * entry.quantity)}</b></div>
            {activePage !== "checkout" && <div className="cart-quantity"><button type="button" aria-label={`Kurangi ${entry.product.name}`} onClick={() => onChangeQuantity(entry, -1)}>−</button><span>× {entry.quantity}</span><button type="button" aria-label={`Tambah ${entry.product.name}`} onClick={() => onChangeQuantity(entry, 1)}>+</button></div>}
          </article>
        )) : <p className="cart-empty-copy">Keranjang masih kosong. Pilih menu UMKM untuk mulai memesan.</p>}
      </div>
      {activePage === "home" && <><form className="promo-field" onSubmit={(event) => { event.preventDefault(); const valid = promo.trim().toUpperCase() === "MAHASISWA"; setPromoApplied(valid); setPromoMessage(valid ? "Promo berhasil diterapkan." : "Kode promo tidak valid."); }}><input aria-label="Kode promo" placeholder="Kode promo" value={promo} onChange={(event) => { setPromo(event.target.value); setPromoApplied(false); setPromoMessage(""); }} /><button type="submit">{promoApplied ? "AKTIF" : "MAHASISWA"}</button></form>{promoMessage && <p className={`promo-message${promoApplied ? "" : " error-notice"}`} role={promoApplied ? "status" : "alert"}>{promoMessage}</p>}</>}
      {activePage === "checkout" && <p className="checkout-estimate">Estimasi siap 15 menit</p>}
      <div className="cart-totals"><div><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>{activePage !== "checkout" && <div><span>Ongkir</span><span>{formatCurrency(deliveryFee)}</span></div>}      {promoApplied && <div><span>Promo</span><span>− {formatCurrency(discount)}</span></div>}<div className="cart-total"><strong>Total</strong><strong>{formatCurrency(total)}</strong></div></div>
      <button className="primary-button cart-submit" type={activePage === "checkout" ? "submit" : "button"} form={activePage === "checkout" ? "checkout-form" : undefined} disabled={!entries.length || (activePage === "checkout" && submittingOrder)} onClick={activePage === "checkout" ? undefined : onCheckout}>{activePage === "checkout" ? submittingOrder ? "Menyimpan pesanan..." : "Bayar sekarang" : "Pesan sekarang"}</button>
      <p className="prototype-caption cart-prototype-note">{user ? "Pesanan akan tersimpan di akunmu." : "Masuk untuk checkout dan simpan riwayat pesanan."}</p>
    </aside>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState("home");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [businessLoading, setBusinessLoading] = useState(Boolean(supabase));
  const [businessError, setBusinessError] = useState(
    supabase ? "" : "Supabase belum dikonfigurasi. Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
  const [businessRefresh, setBusinessRefresh] = useState(0);
  const [cart, setCart] = useState([]);
  const [savedIds, setSavedIds] = useState(["ayam-geprek-arnold", "laundry-al-barokah", "cahaya-motor", "bakso-pak-kumis"]);
  const [selectedIds, setSelectedIds] = useState(["ayam-geprek-arnold", "laundry-al-barokah"]);
  const [fulfillment, setFulfillment] = useState("Antar");
  const [promo, setPromo] = useState("MAHASISWA");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountRefresh, setAccountRefresh] = useState(0);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [ownerNotice, setOwnerNotice] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const [savingOwnerBusiness, setSavingOwnerBusiness] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: null, maxDistance: null, minRating: null });

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAccountError(`Gagal memeriksa sesi akun: ${error.message}`);
      setAuthUser(data.session?.user ?? null);
    }).catch((error) => {
      if (!active) return;
      setAccountError(`Gagal memeriksa sesi akun: ${error.message}`);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthUser(session?.user ?? null);
      if (!session) {
        setOrders([]);
        setProfile({ full_name: "", phone: "", address: "" });
        setAccountLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    let refreshTimer;

    async function loadBusinesses() {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, category, description, address, image_path, starting_price, distance_km, rating, queue_count, open_until, products(id, name, price)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error) {
        setBusinessError(`Gagal memuat UMKM dari Supabase: ${error.message}`);
        setBusinessLoading(false);
        return;
      }

      const mappedBusinesses = (data || []).map(mapBusinessRecord);
      setBusinesses(mappedBusinesses);
      setActiveBusiness((current) =>
        mappedBusinesses.find((business) => business.id === current?.id) || mappedBusinesses[0] || null,
      );
      setBusinessError("");
      setBusinessLoading(false);
    }

    function scheduleRefresh() {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadBusinesses, 120);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadBusinesses();
    }

    loadBusinesses();
    const channel = supabase
      .channel("mokalink-business-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, scheduleRefresh)
      .subscribe((status) => {
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          setBusinessError("Pembaruan langsung katalog tidak tersedia. Data akan diperbarui saat halaman dibuka kembali.");
        }
      });

    window.addEventListener("focus", loadBusinesses);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", loadBusinesses);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      supabase.removeChannel(channel);
    };
  }, [businessRefresh]);

  useEffect(() => {
    if (!authUser || !supabase) return;

    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return null;
      setAccountLoading(true);
      return Promise.all([
        supabase.from("profiles").select("full_name, phone, address").eq("id", authUser.id).maybeSingle(),
        supabase
          .from("orders")
          .select("id, order_number, created_at, total, status, order_items(id, business_id, product_id, business_name, product_name, unit_price, quantity)")
          .order("created_at", { ascending: false }),
      ]);
    }).then((results) => {
      if (!active || !results) return;
      const [profileResult, ordersResult] = results;
      const errors = [profileResult.error, ordersResult.error].filter(Boolean);
      setAccountError(errors.map((error) => error.message).join(" · "));
      setProfile(profileResult.data || {
        full_name: authUser.user_metadata?.full_name || "",
        phone: "",
        address: "",
      });
      if (ordersResult.data) {
        setOrders(ordersResult.data.map((order) => ({
          ...order,
          items: order.order_items || [],
          businessNames: [...new Set((order.order_items || []).map((item) => item.business_name))].join(", "),
        })));
      } else {
        setOrders([]);
      }
      setAccountLoading(false);
    }).catch((error) => {
      if (!active) return;
      setAccountError(`Gagal memuat data akun: ${error.message}`);
      setAccountLoading(false);
    });

    return () => {
      active = false;
    };
  }, [authUser, accountRefresh]);

  const cartEntries = useMemo(() => cart.flatMap((entry) => {
    const business = businesses.find((item) => item.id === entry.businessId);
    const product = business?.products.find((item) => item.id === entry.productId);
    return business && product ? [{ ...entry, business, product }] : [];
  }), [businesses, cart]);
  const subtotal = cartEntries.reduce((total, entry) => total + entry.product.price * entry.quantity, 0);
  const savedStores = businesses.filter((business) => savedIds.includes(business.id));
  const visibleBusinesses = businesses.filter((business) =>
    (!activeCategory || business.category === activeCategory) &&
    `${business.name} ${business.category}`.toLocaleLowerCase("id").includes(search.trim().toLocaleLowerCase("id")) &&
    (activePage !== "category" || filters.maxPrice === null || business.price < filters.maxPrice) &&
    (activePage !== "category" || filters.maxDistance === null || business.distance < filters.maxDistance) &&
    (activePage !== "category" || filters.minRating === null || business.rating >= filters.minRating),
  );

  function addToCart(business, product) {
    setCart((current) => {
      const item = current.find((entry) => entry.businessId === business.id && entry.productId === product.id);
      return item
        ? current.map((entry) => entry === item ? { ...entry, quantity: entry.quantity + 1 } : entry)
        : [...current, { businessId: business.id, productId: product.id, quantity: 1 }];
    });
  }

  function changeQuantity(entry, amount) {
    setCart((current) => current.map((item) => item.businessId === entry.businessId && item.productId === entry.productId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function toggleSaved(id) {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function setCategory(category) {
    setActiveCategory(category);
    setActivePage("category");
  }

  function openBusiness(business) {
    setActiveBusiness(business);
    setActivePage("menu");
  }

  function handleAuthenticated(user) {
    setAuthUser(user);
    setLoginOpen(false);
    setOrderNotice("");
    if (pendingCheckout) {
      setPendingCheckout(false);
      setActivePage("checkout");
    }
  }

  async function registerOwnerBusiness(details) {
    if (!supabase || !authUser) {
      setOwnerError("Masuk ke akun MokaLink sebelum mendaftarkan UMKM.");
      return false;
    }

    setSavingOwnerBusiness(true);
    setOwnerNotice("");
    setOwnerError("");
    try {
      const { error } = await supabase.rpc("register_owner_business", {
        p_name: details.name.trim(),
        p_category: details.category,
        p_description: details.description.trim(),
        p_address: details.address.trim(),
        p_owner_name: details.ownerName.trim(),
        p_contact_phone: details.phone.trim(),
        p_products: details.products,
      });
      if (error) throw error;

      setProfile((current) => ({
        ...current,
        full_name: details.ownerName.trim(),
        phone: details.phone.trim(),
      }));
      setOwnerNotice("UMKM berhasil didaftarkan dan langsung tampil di katalog.");
      setBusinessRefresh((current) => current + 1);
      return true;
    } catch (error) {
      setOwnerError(`Gagal mendaftarkan UMKM: ${error.message}`);
      return false;
    } finally {
      setSavingOwnerBusiness(false);
    }
  }

  function beginCheckout() {
    if (!authUser) {
      setPendingCheckout(true);
      setLoginOpen(true);
      setOrderNotice("Masuk atau daftar terlebih dahulu untuk melanjutkan checkout.");
      return;
    }
    setOrderNotice("");
    setActivePage("checkout");
  }

  async function saveProfile() {
    if (!supabase || !authUser) {
      setProfileNotice("Gagal menyimpan: masuk ke akun Supabase terlebih dahulu.");
      return;
    }

    setSavingProfile(true);
    setProfileNotice("");
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
      }, { onConflict: "id" });
      if (error) throw error;
      setProfileNotice("Profil berhasil disimpan.");
    } catch (error) {
      setProfileNotice(`Gagal menyimpan profil: ${error.message}`);
    } finally {
      setSavingProfile(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setOrderNotice(`Gagal keluar: ${error.message}`);
      return;
    }
    setLoginOpen(false);
    setActivePage("home");
    setOrderNotice("");
  }

  async function placeOrder(details) {
    if (!authUser || !supabase) {
      setOrderNotice("Masuk dengan Supabase sebelum membuat pesanan.");
      setLoginOpen(true);
      return;
    }
    if (cartEntries.length === 0) {
      setOrderNotice("Keranjang masih kosong.");
      return;
    }

    setSubmittingOrder(true);
    setOrderNotice("");
    try {
      const { data, error } = await supabase.rpc("create_customer_order", {
        p_buyer_name: details.buyerName.trim(),
        p_phone: details.phone.trim(),
        p_address: details.address.trim(),
        p_fulfillment: fulfillment,
        p_payment_method: details.payment,
        p_pickup_time: details.pickupTime,
        p_note: details.note.trim(),
        p_promo_code: promoApplied ? promo : "",
        p_items: cartEntries.map((entry) => ({
          business_id: entry.business.id,
          product_id: entry.product.id,
          quantity: entry.quantity,
        })),
      });
      if (error) throw error;
      setCart([]);
      setPromoApplied(false);
      setPromoMessage("");
      setActivePage("history");
      setAccountRefresh((current) => current + 1);
      setOrderNotice(`Pesanan ${data} berhasil disimpan ke akunmu.`);
    } catch (error) {
      setOrderNotice(`Gagal menyimpan pesanan: ${error.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage === "menu" || activePage === "category" ? "home" : activePage} setActivePage={(page) => { setActivePage(page); setActiveCategory(""); }} onLogin={() => setLoginOpen(true)} onLogout={signOut} user={authUser} />
      <main className="main-content">
        {accountError && <p className="order-notice error-notice" role="alert">{accountError}</p>}
        {businessError && <p className="order-notice error-notice" role="alert">{businessError}</p>}
        {activePage === "home" && <HomeView businessesToShow={visibleBusinesses} businessLoading={businessLoading} search={search} setSearch={setSearch} onCategory={setCategory} onOpen={openBusiness} onToggleSave={toggleSaved} savedIds={savedIds} onNavigate={setActivePage} orders={orders} />}
        {activePage === "menu" && activeBusiness && <MenuView business={activeBusiness} cart={cart} onAdd={(business, product) => addToCart(business, product)} />}
        {activePage === "menu" && !activeBusiness && <div className="page-view empty-card"><h2>UMKM tidak tersedia</h2><p>Usaha ini sudah tidak tersedia di katalog.</p></div>}
        {activePage === "category" && <CategoryView category={activeCategory} stores={visibleBusinesses} onOpen={openBusiness} onToggleSave={toggleSaved} savedIds={savedIds} />}
        {activePage === "compare" && <CompareView savedStores={savedStores} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpen={openBusiness} />}
        {activePage === "history" && <HistoryView orders={orders} loading={accountLoading} businesses={businesses} />}
        {activePage === "profile" && authUser
          ? <ProfileView user={authUser} profile={profile} onChangeProfile={(field, value) => setProfile((current) => ({ ...current, [field]: value }))} onLogout={signOut} onSaveProfile={saveProfile} savedCount={savedIds.length} saveNotice={profileNotice} saving={savingProfile} />
          : activePage === "profile" && <div className="page-view empty-card"><h2>Masuk untuk melihat profil</h2><p>Daftar akun agar profil dan pesanan tersimpan secara pribadi.</p><button className="primary-button" type="button" onClick={() => setLoginOpen(true)}>Masuk / Daftar</button></div>}
        {activePage === "checkout" && <CheckoutView cartEntries={cartEntries} onBack={() => setActivePage("home")} onPlaceOrder={placeOrder} profile={profile} onChangeProfile={(field, value) => setProfile((current) => ({ ...current, [field]: value }))} fulfillment={fulfillment} promoApplied={promoApplied} submitting={submittingOrder} />}
        {activePage === "owner-registration" && <OwnerRegistrationView user={authUser} profile={profile} onLogin={() => setLoginOpen(true)} onRegister={registerOwnerBusiness} saving={savingOwnerBusiness} notice={ownerNotice} error={ownerError} />}
        {orderNotice && <p className={`order-notice${orderNotice.startsWith("Gagal") ? " error-notice" : ""}`} role={orderNotice.startsWith("Gagal") ? "alert" : "status"}><span>{orderNotice}</span><button type="button" onClick={() => setOrderNotice("")}>Tutup</button></p>}
      </main>
      <CartPanel entries={cartEntries} onChangeQuantity={changeQuantity} fulfillment={fulfillment} setFulfillment={setFulfillment} promo={promo} setPromo={setPromo} promoApplied={promoApplied} setPromoApplied={setPromoApplied} promoMessage={promoMessage} setPromoMessage={setPromoMessage} subtotal={subtotal} activePage={activePage} savedStores={savedStores} comparedStores={savedStores.filter((business) => selectedIds.includes(business.id))} onClearSaved={() => { setSavedIds([]); setSelectedIds([]); }} onLogin={() => authUser ? setActivePage("profile") : setLoginOpen(true)} onSaveProfile={saveProfile} filters={filters} setFilters={setFilters} onCheckout={beginCheckout} user={authUser} orders={orders} profile={profile} submittingOrder={submittingOrder} />
      {loginOpen && <LoginDialog onClose={() => { setLoginOpen(false); setPendingCheckout(false); }} onAuthenticated={handleAuthenticated} />}
    </div>
  );
}
