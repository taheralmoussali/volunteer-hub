
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HeartHandshake, User, Mail, Lock, Phone } from "lucide-react";

export default function RegisterPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
      return;
    }

    if (!phone.trim()) {
      setError("رقم الهاتف مطلوب.");
      return;
    }

    setLoading(true);

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone.trim(),
        },
      },
    });

    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setMessage(
        "تم إنشاء حسابك بنجاح. يرجى تأكيد بريدك الإلكتروني من خلال الرسالة التي أرسلناها إليك، وبعدها يمكنك تسجيل الدخول مباشرة."
        );
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card">
        <div className="brand-icon">
          <HeartHandshake size={34} />
        </div>

        <h1>Volunteer Hub</h1>
        <p className="auth-subtitle">انضم إلى فريق المتطوعين</p>

        <h2>إنشاء حساب</h2>
        <p className="muted">أدخل بياناتك للانضمام إلى الفريق.</p>

        <form onSubmit={handleRegister}>
          <label htmlFor="name">الاسم الكامل</label>
          <div className="input-wrap">
            <User size={18} />
            <input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم الكامل"
              required
            />
          </div>

          <label htmlFor="email">البريد الإلكتروني</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <label htmlFor="phone">رقم الهاتف</label>
          <div className="input-wrap">
            <Phone size={18} />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف"
              required
            />
          </div>

          <label htmlFor="password">كلمة المرور</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 أحرف على الأقل"
              minLength={8}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="auth-footer">
          لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link>
        </p>
      </section>
    </main>
  );
}
