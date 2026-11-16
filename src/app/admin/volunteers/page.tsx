
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

type Volunteer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  account_status: string;
  created_at: string;
};

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVolunteers() {
    const db = createClient();
    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, email, phone, account_status, created_at")
      .eq("role", "volunteer")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setVolunteers(data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadVolunteers();
  }, []);

  async function changeStatus(id: string, status: "approved" | "rejected") {
    const db = createClient();
    const { error } = await db
      .from("profiles")
      .update({ account_status: status })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    loadVolunteers();
  }

  return (
    <DashboardShell role="admin">
      <div className="page-heading">
        <h1>إدارة المتطوعين</h1>
        <p>عرض حسابات المتطوعين وإدارة حالتها.</p>
      </div>

      <div className="content-card">
        {error && <p className="inline-message error-message">{error}</p>}

        {loading ? (
          <p>جارٍ تحميل البيانات...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v) => (
                  <tr key={v.id}>
                    <td>{v.full_name}</td>
                    <td>{v.email}</td>
                    <td>{v.phone || "—"}</td>
                    <td>
                      <span className="status-pill">{v.account_status}</span>
                    </td>
                    <td>
                      <select
                        value={v.account_status}
                        onChange={(e) =>
                          changeStatus(
                            v.id,
                            e.target.value as "approved" | "rejected"
                          )
                        }
                      >
                        <option value="approved">نشط</option>
                        <option value="rejected">إيقاف الحساب</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr><td colSpan={5}>لا يوجد متطوعون حتى الآن.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
