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
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/");
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
    return null
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* <a
                  href="/content"
                  className="p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block"
                >
                  <h3 className="font-medium text-blue-900">Add Content</h3>
    
                </a>

                <a
                  href="/campaign"
                  className="p-4 bg-green-50 rounded-md hover:bg-green-100 transition-colors block"
                >
                  <h3 className="font-medium text-green-900">Update Campaign</h3>
          
                </a> */}
                <a
                  href="/campaigns"
                  className="p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block flex justify-center"
                >
                  <h3 className="font-medium text-blue-900">Campaigns</h3>
          
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}