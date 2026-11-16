
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

export default function VolunteerDashboard() {
  const [stats, setStats] = useState({ availability: 0, skills: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const [availability, skills, tasks] = await Promise.all([
        supabase.from("availability").select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id),
        supabase.from("volunteer_skills").select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id),
        supabase.from("task_assignments").select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id),
      ]);

      setStats({
        availability: availability.count || 0,
        skills: skills.count || 0,
        tasks: tasks.count || 0,
      });
      setLoading(false);
    }

    load();
  }, []);

  return (
    <DashboardShell role="volunteer">
      <div className="page-heading">
        <h1>مرحباً بك في شباب الهمة في جيرود</h1>
        <p>تابع بياناتك ومهامك التطوعية من مكان واحد.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>أوقات التفرغ المسجلة</span>
          <strong>{loading ? "..." : stats.availability}</strong>
        </div>
        <div className="stat-card">
          <span>مهاراتي</span>
          <strong>{loading ? "..." : stats.skills}</strong>
        </div>
        <div className="stat-card">
          <span>المهام المسندة إليّ</span>
          <strong>{loading ? "..." : stats.tasks}</strong>
        </div>
        <div className="stat-card">
          <span>حالة الحساب</span>
          <strong style={{ fontSize: 19, color: "#16804a" }}>نشط</strong>
        </div>
      </div>

      <div className="content-card">
        <h2>استكمل ملفك التطوعي</h2>
        <p>أضف أوقات تفرغك ومهاراتك والإمكانيات التي تستطيع تقديمها.</p>
        <div className="quick-links">
          <Link href="/dashboard/availability">تحديد أوقات التفرغ ←</Link>
          <Link href="/dashboard/skills">إضافة المهارات ←</Link>
          <Link href="/dashboard/resources">إضافة الإمكانيات ←</Link>
          <Link href="/dashboard/tasks">عرض مهامي ←</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
