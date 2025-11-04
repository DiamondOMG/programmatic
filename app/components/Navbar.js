"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "@/app/lib/auth-actions";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useState } from "react";

export default function Navbar({ userData }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
          <Link
            href="/campaigns"
            className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            Digital Ads CMS
          </Link>

          {/* ✅ เมนู */}
          <div className="flex items-center space-x-6 relative">
            {/* ✅ List User Button - แสดงเฉพาะเมื่อ permission_user === 4 */}
            {userData?.[0]?.permission_user === 4 && (
              <Link
                href="/list-user"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  pathname && pathname === "/list-user"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                List User
              </Link>
            )}
            {userData?.[0]?.permission_user >= 3 && (
              <Link
                href="/logs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  pathname && pathname === "/logs"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Logs
              </Link>
            )}
            {userData?.[0]?.permission_user >= 4 && (
              <Link
                href="/sequence"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  pathname && pathname === "/sequence"
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Sequence
              </Link>
            )}

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

            {/* ✅ Dropdown เมนูโปรไฟล์ */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                <User size={18} />
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
                  {/* ✅ แสดงข้อมูลผู้ใช้ */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors duration-150"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
