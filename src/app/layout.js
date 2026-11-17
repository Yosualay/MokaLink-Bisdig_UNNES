import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MokaLink — Dukung UMKM Sekitar",
  description:
    "Temukan makanan, minuman, dan jasa UMKM di sekitar kamu dengan MokaLink.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      data-theme="colorful"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
