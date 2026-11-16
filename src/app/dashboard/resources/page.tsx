
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Resource = {
  id: string;
  title: string;
  resource_type: string;
  description: string | null;
  quantity: number;
  is_available: boolean;
};

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("سيارة");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  async function load() {
    const db = createClient();
    const { data } = await db.from("resources")
      .select("id, title, resource_type, description, quantity, is_available")
      .order("created_at", { ascending: false });
    setItems(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addResource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const { error } = await db.from("resources").insert({
      volunteer_id: user.id,
      title,
      resource_type: type,
      description,
      quantity: Number(quantity),
    });

    if (error) setMessage(error.message);
    else {
      setMessage("تمت إضافة الإمكانية بنجاح.");
      setTitle("");
      setDescription("");
      setQuantity("1");
      load();
    }
  }

  async function removeResource(id: string) {
    const db = createClient();
    const { error } = await db.from("resources").delete().eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  return (
    <DashboardShell role="volunteer">
      <div className="page-heading">
        <h1>الإمكانيات والموارد</h1>
        <p>أضف الموارد التي تستطيع تقديمها لدعم الأنشطة التطوعية.</p>
      </div>

      <div className="content-card">
        <h2>إضافة مورد جديد</h2>
        <form onSubmit={addResource}>
          <div className="form-grid">
            <div className="form-field">
              <label>نوع المورد</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option>سيارة</option>
                <option>دراجة</option>
                <option>معدات</option>
                <option>حاسوب</option>
                <option>أدوات</option>
                <option>أخرى</option>
              </select>
            </div>
            <div className="form-field">
              <label>اسم المورد</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: سيارة خاصة" required />
            </div>
            <div className="form-field">
              <label>الكمية</label>
              <input type="number" min="1" value={quantity}
                onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>الوصف</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="تفاصيل إضافية (اختياري)" />
            </div>
          </div>
          <button className="form-button" style={{ marginTop: 20 }}>إضافة المورد</button>
        </form>
        {message && <p className="inline-message">{message}</p>}
      </div>

      <div className="content-card">
        <h2>مواردي المسجلة</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th><th>النوع</th><th>الكمية</th><th>الوصف</th><th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="الاسم">{item.title}</td>
                  <td data-label="النوع">{item.resource_type}</td>
                  <td data-label="الكمية">{item.quantity}</td>
                  <td data-label="الوصف">{item.description || "—"}</td>
                  <td data-label="الإجراء">
                    <button className="form-button" onClick={() => removeResource(item.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5}>لا توجد موارد مسجلة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
