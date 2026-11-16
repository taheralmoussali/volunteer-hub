
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Skill = { id: string; name: string };
type MySkill = { id: string; skill_id: string; skill: Skill | null };

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<MySkill[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;

    const [all, mine] = await Promise.all([
      db.from("skills").select("id, name").order("name"),
      db.from("volunteer_skills")
        .select("id, skill_id, skill:skills(id, name)")
        .eq("volunteer_id", user.id),
    ]);

    setSkills(all.data || []);
    setMySkills((mine.data || []) as unknown as MySkill[]);
  }

  useEffect(() => { load(); }, []);

  async function addSkill(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || !selected) return;

    const { error } = await db.from("volunteer_skills").insert({
      volunteer_id: user.id,
      skill_id: selected,
    });

    setMessage(error ? error.message : "تمت إضافة المهارة.");
    if (!error) load();
  }

  async function removeSkill(id: string) {
    const db = createClient();
    const { error } = await db.from("volunteer_skills").delete().eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  const available = skills.filter(
    (s) => !mySkills.some((m) => m.skill_id === s.id)
  );

  return (
    <DashboardShell role="volunteer">
      <div className="page-heading">
        <h1>مهاراتي</h1>
        <p>اختر المهارات التي تستطيع تقديمها للفريق.</p>
      </div>

      <div className="content-card">
        <h2>إضافة مهارة</h2>
        <form onSubmit={addSkill} className="form-grid">
          <div className="form-field">
            <label>اختر المهارة</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
              <option value="">اختر مهارة...</option>
              {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="form-button" disabled={!selected}>إضافة</button>
          </div>
        </form>
        {message && <p className="inline-message">{message}</p>}
      </div>

      <div className="content-card">
        <h2>المهارات المسجلة</h2>
        <div className="skill-list">
          {mySkills.map((item) => (
            <div className="skill-item" key={item.id}>
              <span>{item.skill?.name || "مهارة"}</span>
              <button onClick={() => removeSkill(item.id)}>حذف</button>
            </div>
          ))}
          {mySkills.length === 0 && <p>لم تسجل أي مهارات بعد.</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
