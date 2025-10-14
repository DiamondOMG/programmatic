"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "@/app/lib/auth-actions";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบว่า user มี session หรือไม่
    const checkUser = async () => {
      const result = await getCurrentUser();
      if (result.success) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setMessage("");

    try {
      const action = isLogin ? loginUser : registerUser;
      const result = await action(formData);

      if (!result.success) {
        throw new Error(result.message);
      }

      if (isLogin) {
        setMessage("Login Success !");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setMessage("Register Success !, Please Check Email");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
      <img src="actmedia.png" alt="" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Digital Ads CMS
          </h1>
        </div>
        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (at least 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Loading..." : isLogin ? "Login" : "Register"}
            </button>
          </div>

          {message && (
            <div
              className={`text-center text-sm p-3 rounded-md ${
                message.includes("Login Success !") || message.includes("Register Success !, Please Check Email")
                  ? "text-green-600 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? "Register?" : "Login?"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
