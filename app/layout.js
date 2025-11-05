import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // 👈 แยกส่วน client ไปอีกไฟล์
import { getUserById } from "./lib/auth-actions";

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

export default async function RootLayout({ children }) {
  // เรียกใช้ฟังก์ชัน getUserById เพื่อดึงข้อมูลผู้ใช้
  let userData = null;
  try {
    const result = await getUserById();
//   {
//   "success": true,
//   "data": [
//     {
//       "user_id": "a87cecfd-8439-4836-bd6a-e47fba58d7f0",
//       "email": "omgdigital.developer.02@gmail.com",
//       "password_hash": "$2b$10$CBIFukZdpPXEGggh3MIG0ehYlahekg84LGbUyRiiWHx4ZRnwZLN0i",
//       "create_date": "2025-10-08T08:57:43.788718+00:00",
//       "info": {

//       },
//       "permission_user": 4
//     }
//   ]
// }
    if (result.success) {
      userData = result.data;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ ส่วนนี้เป็น Client Component */}
        <Providers userData={userData}>{children}</Providers>
      </body>
    </html>
  );
}
