
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartHandshake, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError("تعذر العثور على ملف المستخدم. يرجى التواصل مع الإدارة.");
      setLoading(false);
      return;
    }

    if (profile.account_status === "pending") {
      router.push("/pending");
      router.refresh();
      return;
    }

    if (profile.account_status !== "approved") {
      await supabase.auth.signOut();
      setError("حسابك غير معتمد. يرجى التواصل مع الإدارة.");
      setLoading(false);
      return;
    }

    router.push(profile.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card">
        <div className="brand-icon">
          <HeartHandshake size={34} />
        </div>

        <h1>Volunteer Hub</h1>
        <p className="auth-subtitle">
          منصة إدارة المتطوعين والمهام
        </p>

        <h2>تسجيل الدخول</h2>
        <p className="muted">أهلاً بعودتك! أدخل بيانات حسابك.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">البريد الإلكتروني</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="password">كلمة المرور</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              id="password"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? (
              <Loader2 className="spin" size={20} />
            ) : (
              "دخول"
            )}
          </button>
        </form>

        <p className="auth-footer">
          ليس لديك حساب؟ <Link href="/register">إنشاء حساب جديد</Link>
        </p>
      </section>
    </main>
  );
}
