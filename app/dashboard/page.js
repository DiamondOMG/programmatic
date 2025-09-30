"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/app/lib/auth-actions";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        router.push("/auth");
      }
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">ข้อมูลผู้ใช้</h2>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p>
                  <strong>อีเมล:</strong> {user.email}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">เมนู</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/library"
                  className="p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block"
                >
                  <h3 className="font-medium text-blue-900">อัปโหลด Asset</h3>
                  <p className="text-sm text-blue-700 mt-1">จัดการไฟล์และ assets</p>
                </a>

                <a
                  href="/sequence"
                  className="p-4 bg-green-50 rounded-md hover:bg-green-100 transition-colors block"
                >
                  <h3 className="font-medium text-green-900">อัปเดต Sequence</h3>
                  <p className="text-sm text-green-700 mt-1">จัดการลำดับข้อมูล</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}