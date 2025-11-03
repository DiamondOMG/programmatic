"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login user
export async function loginUser(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    // ตรวจสอบ user ในตาราง users
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("email", email)
      .single();

    if (fetchError) {
      // ถ้าไม่พบ user ในตาราง users ลอง login ผ่าน Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);

      const cookieStore = await cookies();

      // ตั้งค่า HttpOnly cookies
      cookieStore.set("access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      cookieStore.set("refresh_token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return { success: true, message: "เข้าสู่ระบบสำเร็จ!", user: data.user };
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await bcrypt.compare(
      password,
      userData.password_hash
    );
    if (!isValidPassword) {
      throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    // Login ผ่าน Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);

    const cookieStore = await cookies();

    // ตั้งค่า HttpOnly cookies
    cookieStore.set("access_token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    cookieStore.set("refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return { success: true, message: "เข้าสู่ระบบสำเร็จ!", user: data.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Register user
export async function registerUser(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    // ตรวจสอบว่า email มีอยู่แล้วหรือไม่
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("อีเมลนี้มีผู้ใช้แล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // สมัครสมาชิกผ่าน Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error(
          "อีเมลนี้มีผู้ใช้แล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ"
        );
      }
      throw new Error(error.message);
    }

    if (data.user) {
      // ถ้าสร้าง user สำเร็จ เก็บข้อมูลเพิ่มเติมในตาราง users
      const { error: insertError } = await supabase.from("users").insert({
        user_id: data.user.id,
        email,
        password_hash: hashedPassword,
        info: {},
      });

      if (insertError) {
        console.error("Error inserting user data:", insertError);
        if (insertError.code === "23505") {
          throw new Error("อีเมลนี้มีผู้ใช้แล้ว กรุณาใช้อีเมลอื่น");
        }
        throw insertError; // เพิ่มบรรทัดนี้เพื่อให้ error ถูกส่งกลับ
      }
    }

    return {
      success: true,
      message: "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Logout user
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);

    const cookieStore = await cookies();

    // ล้าง cookies
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return { success: true, message: "ออกจากระบบสำเร็จ" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      // This will trigger a server-side redirect
      redirect("/");
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      // This will trigger a server-side redirect
      redirect("/");
    }

    return { success: true, user: data.user };
  } catch (error) {
    // This will trigger a server-side redirect
    redirect("/");
  }
}

// Refresh session
export async function refreshSession() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      throw new Error("ไม่มี refresh token");
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw new Error(error.message);

    // อัพเดท cookies
    cookieStore.set("access_token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    cookieStore.set("refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return { success: true, message: "รีเฟรช session สำเร็จ", user: data.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

//ใช้สำหรับ ฉีด Cookie เข้า Header
export async function getAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // สร้าง Client ที่ฉีด JWT จากคุกกี้เข้าไปใน Header
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    },
  });
}

// Get user by ID
export async function getUserById() {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      "User not authenticated"
    );
  }

  const supabaseAuthenticated = await getAuthenticatedSupabaseClient();

  const { error, data } = await supabaseAuthenticated
    .from("users")
    .select("*")
    .eq('user_id', user.id);

  if (error) {
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      `Step 3 (getUserById) failed: Supabase error: ${error.message}`
    );
  }

  return { success: true, data };
}