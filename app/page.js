import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Asset CMS
          </h1>
          <p className="text-lg text-gray-600">
            ระบบจัดการ Asset และข้อมูล
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>

          <p className="text-sm text-gray-500">
            เริ่มต้นใช้งานระบบจัดการ Asset ของคุณ
          </p>
        </div>
      </div>
    </div>
  );
}
