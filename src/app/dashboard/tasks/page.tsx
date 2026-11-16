
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  status: string;
  task: {
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string | null;
  } | null;
};

export default function VolunteerTasksPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { data, error } = await db
      .from("task_assignments")
      .select(`
        id,
        status,
        task:tasks (
          title,
          description,
          location,
          starts_at
        )
      `)
      .eq("volunteer_id", user.id)
      .order("assigned_at", { ascending: false });

    if (error) setMessage(error.message);
    else setItems((data || []) as unknown as Assignment[]);
  }

  useEffect(() => { load(); }, []);

  async function respond(id: string, status: "accepted" | "rejected") {
    const db = createClient();
    const { error } = await db
      .from("task_assignments")
      .update({ status })
      .eq("id", id);

    if (error) setMessage(error.message);
    else {
      setMessage(status === "accepted" ? "تم قبول المهمة." : "تم رفض المهمة.");
      load();
    }
  }

  return (
    <DashboardShell role="volunteer">
      <div className="page-heading">
        <h1>مهامي التطوعية</h1>
        <p>راجع المهام المسندة إليك وأكد مشاركتك.</p>
      </div>

      {message && <p className="inline-message">{message}</p>}

      {items.map((item) => (
        <div className="content-card" key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <h2>{item.task?.title || "مهمة"}</h2>
            <span className="status-pill">{item.status}</span>
          </div>

          <p>{item.task?.description || "لا يوجد وصف."}</p>
          <p>الموقع: {item.task?.location || "غير محدد"}</p>
          <p>
            الموعد: {item.task?.starts_at
              ? new Date(item.task.starts_at).toLocaleString("ar")
              : "غير محدد"}
          </p>

          {item.status === "pending" && (
            <div className="task-actions">
              <button className="form-button" onClick={() => respond(item.id, "accepted")}>
                قبول المهمة
              </button>
              <button className="secondary-button" onClick={() => respond(item.id, "rejected")}>
                رفض المهمة
              </button>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <div className="content-card">لا توجد مهام مسندة إليك حالياً.</div>
      )}
    </DashboardShell>
  );
}
