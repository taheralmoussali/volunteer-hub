
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

const days = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء",
  "الخميس", "الجمعة", "السبت",
];

type Availability = {
  id: string;
  day_of_week: number | null;
  availability_type: "full_day" | "partial";
  start_time: string | null;
  end_time: string | null;
};

export default function AvailabilityPage() {
  const [items, setItems] = useState<Availability[]>([]);
  const [day, setDay] = useState("0");
  const [kind, setKind] = useState<"full_day" | "partial">("full_day");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [message, setMessage] = useState("");

  async function load() {
    const db = createClient();
    const { data } = await db
      .from("availability")
      .select("id, day_of_week, availability_type, start_time, end_time")
      .eq("repeat_type", "weekly")
      .order("day_of_week");

    setItems(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const db = createClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) return;

    const { error } = await db.from("availability").insert({
      volunteer_id: user.id,
      repeat_type: "weekly",
      day_of_week: Number(day),
      availability_type: kind,
      start_time: kind === "partial" ? start : null,
      end_time: kind === "partial" ? end : null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("تم حفظ وقت التفرغ بنجاح.");
    load();
  }

  async function removeItem(id: string) {
    const db = createClient();
    const { error } = await db.from("availability").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setMessage("تم حذف وقت التفرغ.");
      load();
    }
  }

  return (
    <DashboardShell role="volunteer">
      <div className="page-heading">
        <h1>أوقات التفرغ</h1>
        <p>حدد الأيام والفترات التي تستطيع التطوع خلالها.</p>
      </div>

      <div className="content-card">
        <h2>إضافة وقت تفرغ أسبوعي</h2>

        <form onSubmit={addAvailability}>
          <div className="form-grid">
            <div className="form-field">
              <label>اليوم</label>
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {days.map((d, i) => (
                  <option value={i} key={i}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>نوع التفرغ</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "full_day" | "partial")}
              >
                <option value="full_day">اليوم كامل</option>
                <option value="partial">فترة محددة</option>
              </select>
            </div>

            {kind === "partial" && (
              <>
                <div className="form-field">
                  <label>من الساعة</label>
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label>إلى الساعة</label>
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
                </div>
              </>
            )}
          </div>

          <button className="form-button" style={{ marginTop: 20 }}>
            حفظ التفرغ
          </button>
        </form>

        {message && <p className="inline-message">{message}</p>}
      </div>

      <div className="content-card">
        <h2>أوقات التفرغ المسجلة</h2>
        <table className="data-table">
          <thead>
            <tr><th>اليوم</th><th>التفرغ</th><th>الفترة</th><th>إجراء</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="اليوم">{days[item.day_of_week ?? 0]}</td>
                <td data-label="التفرغ">
                  {item.availability_type === "full_day" ? "اليوم كامل" : "جزئي"}
                </td>
                <td data-label="الفترة">
                  {item.start_time
                    ? `${item.start_time.slice(0, 5)} - ${item.end_time?.slice(0, 5)}`
                    : "طوال اليوم"}
                </td>
                <td data-label="إجراء">
                  <button className="form-button" onClick={() => removeItem(item.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4}>لم تضف أوقات تفرغ بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
