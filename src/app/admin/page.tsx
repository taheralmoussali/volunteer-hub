
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    volunteers: 0,
    tasks: 0,
    assignments: 0,
    resources: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = createClient();

      const [v, t, a, r] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true })
          .eq("role", "volunteer"),
        db.from("tasks").select("*", { count: "exact", head: true }),
        db.from("task_assignments").select("*", { count: "exact", head: true }),
        db.from("resources").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        volunteers: v.count || 0,
        tasks: t.count || 0,
        assignments: a.count || 0,
        resources: r.count || 0,
      });
      setLoading(false);
    }

    load();
  }, []);

  return (
    <DashboardShell role="admin">
      <div className="page-heading">
        <h1>لوحة إدارة المتطوعين</h1>
        <p>نظرة عامة على نشاط الفريق والمهام.</p>
      </div>

      <div className="stats-grid">
        {[
          ["إجمالي المتطوعين", stats.volunteers],
          ["إجمالي المهام", stats.tasks],
          ["إسنادات المهام", stats.assignments],
          ["الموارد المسجلة", stats.resources],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{loading ? "..." : value}</strong>
          </div>
        ))}
      </div>

      <div className="content-card">
        <h2>الإدارة السريعة</h2>
        <div className="quick-links">
          <Link href="/admin/volunteers">إدارة المتطوعين ←</Link>
          <Link href="/admin/tasks">إنشاء وتوزيع المهام ←</Link>
          <Link href="/admin/availability">  تفرغ المتطوعين ←</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
