
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Volunteer = { id: string; full_name: string };
type Task = { id: string; title: string; status: string; starts_at: string | null };

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const db = createClient();

    const [taskResult, volunteerResult] = await Promise.all([
      db.from("tasks").select("id, title, status, starts_at")
        .order("created_at", { ascending: false }),
      db.from("profiles").select("id, full_name")
        .eq("role", "volunteer")
        .eq("account_status", "approved")
        .order("full_name"),
    ]);

    setTasks(taskResult.data || []);
    setVolunteers(volunteerResult.data || []);
  }

  useEffect(() => { load(); }, []);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { error } = await db.from("tasks").insert({
      title,
      description,
      location,
      starts_at: date ? new Date(date).toISOString() : null,
      created_by: user.id,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("تم إنشاء المهمة.");
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    load();
  }

  async function assignTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { error } = await db.from("task_assignments").insert({
      task_id: selectedTask,
      volunteer_id: selectedVolunteer,
      assigned_by: user.id,
      status: "pending",
    });

    if (error) setMessage(error.message);
    else setMessage("تم إسناد المهمة بنجاح.");

  }

  return (
    <DashboardShell role="admin">
      <div className="page-heading">
        <h1>إدارة المهام</h1>
        <p>أنشئ المهام وأسندها إلى المتطوعين.</p>
      </div>

      <div className="content-card">
        <h2>إنشاء مهمة جديدة</h2>
        <form onSubmit={createTask}>
          <div className="form-grid">
            <div className="form-field">
              <label>عنوان المهمة</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>الموقع</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="form-field">
              <label>موعد المهمة</label>
              <input type="datetime-local" value={date}
                onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>الوصف</label>
              <textarea value={description}
                onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <button className="form-button" style={{ marginTop: 20 }}>إنشاء المهمة</button>
        </form>
      </div>

      <div className="content-card">
        <h2>إسناد مهمة إلى متطوع</h2>
        <form onSubmit={assignTask} className="form-grid">
          <div className="form-field">
            <label>المهمة</label>
            <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} required>
              <option value="">اختر المهمة</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>المتطوع</label>
            <select value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)} required>
              <option value="">اختر المتطوع</option>
              {volunteers.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
            </select>
          </div>
          <div>
            <button className="form-button">إسناد المهمة</button>
          </div>
        </form>
        {message && <p className="inline-message">{message}</p>}
      </div>

      <div className="content-card">
        <h2>المهام الحالية</h2>
        <table className="data-table">
          <thead><tr><th>المهمة</th><th>الحالة</th><th>التاريخ</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td><span className="status-pill">{t.status}</span></td>
                <td>{t.starts_at ? new Date(t.starts_at).toLocaleString("ar") : "غير محدد"}</td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan={3}>لا توجد مهام حتى الآن.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
