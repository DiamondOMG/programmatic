'use client'

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();

  // ไม่แสดง navbar ในหน้าแรก (/)
  if (pathname === "/" || pathname === "/auth") {
    return null;
  }

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Asset CMS
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <Link
              href="/library"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/library"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}
            >
              Upload Asset
            </Link>

            <Link
              href="/auth"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/auth"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Login / Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
