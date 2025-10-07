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
              Programmatic CMS
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <Link
              href="/content"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/content"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}
            >
              Content
            </Link>
            <Link
              href="/campaign"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/campaign"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}
            >
              Campaign
            </Link>

            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
