
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HeartHandshake, LayoutDashboard, Users, CalendarDays,
  Award, Package, ClipboardList, LogOut, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "admin" | "volunteer";

export default function DashboardShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, account_status")
        .eq("id", user.id)
        .single();

      if (!profile || profile.account_status !== "approved") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (profile.role !== role) {
        router.replace(profile.role === "admin" ? "/admin" : "/dashboard");
        return;
      }

      if (active) {
        setName(profile.full_name);
        setLoading(false);
      }
    }

    checkUser();

    return () => {
      active = false;
    };
  }, [pathname, role, router, supabase]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const adminLinks = [
    { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/volunteers", label: "المتطوعون", icon: Users },
    { href: "/admin/tasks", label: "إدارة المهام", icon: ClipboardList },
    { href: "/admin/availability",  label: "تفرغ المتطوعين", icon: CalendarDays },
    { href: "/admin/resources", label: "الموارد", icon: Package },
  ];

  const volunteerLinks = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/dashboard/availability", label: "أوقات التفرغ", icon: CalendarDays },
    { href: "/dashboard/skills", label: "المهارات", icon: Award },
    { href: "/dashboard/resources", label: "الإمكانيات", icon: Package },
    { href: "/dashboard/tasks", label: "مهامي", icon: ClipboardList },
  ];

  const links = role === "admin" ? adminLinks : volunteerLinks;

  if (loading) {
    return (
      <div className="loading-page" dir="rtl">
        <Loader2 className="spin" size={30} />
        <p>جارٍ تحميل حسابك...</p>
      </div>
    );
  }

  return (
    <div className="app-layout" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <HeartHandshake size={30} />
          <span>Volunteer Hub</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {name.charAt(0) || "م"}
          </div>
          <div>
            <strong>{name}</strong>
            <small>{role === "admin" ? "مدير النظام" : "متطوع"}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button className="logout-button" onClick={logout}>
          <LogOut size={19} />
          تسجيل الخروج
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>{role === "admin" ? "لوحة الإدارة" : "مساحة المتطوع"}</span>
          <span className="topbar-user">{name}</span>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
