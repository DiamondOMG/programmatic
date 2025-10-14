"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "@/app/lib/auth-actions";
import { LogOut } from "lucide-react"; // ✅ icon สวยจาก lucide-react

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/" || pathname === "/auth") return null;

  const handleLogout = async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        router.push("/");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200 h-16 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* ✅ โลโก้ */}
          <Link href="/campaigns" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Digital Ads CMS
          </Link>

          {/* ✅ เมนู */}
          <div className="flex items-center space-x-6">
            <Link
              href="/campaigns"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === "/campaigns"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Campaigns
            </Link>

            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>

            {/* ✅ ปุ่ม Logout สวย ๆ */}
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-200" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
