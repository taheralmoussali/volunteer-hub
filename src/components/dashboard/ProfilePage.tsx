"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "volunteer";

export default function ProfilePage({ role }: { role: Role }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        if (active) {
          setError(userError.message);
          setLoading(false);
        }
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(user.email || "");
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim() || !phone.trim()) {
      setError("الاسم الكامل ورقم الهاتف مطلوبان.");
      return;
    }

    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || "تعذر التحقق من الحساب. يرجى تسجيل الدخول مجدداً.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setFullName(fullName.trim());
    setPhone(phone.trim());
    setMessage("تم تحديث معلوماتك الشخصية بنجاح.");
    window.dispatchEvent(new Event("profile-updated"));
  }

  if (loading) {
    return (
      <div className="loading-page" dir="rtl">
        <Loader2 className="spin" size={30} />
        <p>جارٍ تحميل معلوماتك...</p>
      </div>
    );
  }

  return (
    <DashboardShell role={role}>
      <div className="page-heading">
        <h1>معلوماتي الشخصية</h1>
        <p>حدّث بيانات التواصل الخاصة بحسابك.</p>
      </div>

      <section className="form-card">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="full-name">الاسم الكامل</label>
              <input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="profile-email">البريد الإلكتروني</label>
              <input id="profile-email" type="email" value={email} readOnly />
            </div>

            <div className="form-field">
              <label htmlFor="phone">رقم الهاتف</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button className="form-button" type="submit" disabled={saving}>
            {saving ? "جارٍ حفظ التغييرات..." : "حفظ التغييرات"}
          </button>
        </form>
      </section>
    </DashboardShell>
  );
}
