import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // 👈 แยกส่วน client ไปอีกไฟล์

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Programmatic",
  description: "Programmatic System",
  icons: {
    icon: "/screen_icon_3.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ ส่วนนี้เป็น Client Component */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
