
"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";

const days = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

type Availability = {
  volunteer_id: string;
  availability_type: string;
  start_time: string | null;
  end_time: string | null;
};

type Volunteer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  availability: Availability[];
};

export default function AdminAvailabilityPage() {
  const [selectedDay, setSelectedDay] = useState("0");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const [profilesResult, availabilityResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .eq("role", "volunteer")
          .eq("account_status", "approved"),

        supabase
          .from("availability")
          .select(
            "volunteer_id, availability_type, start_time, end_time"
          )
          .eq("day_of_week", Number(selectedDay))
          .eq("repeat_type", "weekly"),
      ]);

      if (profilesResult.error || availabilityResult.error) {
        setError(
          profilesResult.error?.message ||
          availabilityResult.error?.message ||
          "حدث خطأ أثناء تحميل البيانات"
        );
        setVolunteers([]);
        setLoading(false);
        return;
      }

      const availabilityRows = availabilityResult.data || [];

      const result = (profilesResult.data || [])
        .map((profile) => ({
          ...profile,
          availability: availabilityRows.filter(
            (item) => item.volunteer_id === profile.id
          ),
        }))
        .filter((profile) => profile.availability.length > 0);

      setVolunteers(result);
      setLoading(false);
    }

    loadAvailability();
  }, [selectedDay]);

  return (
  <DashboardShell role="admin">
    <div className="dashboard-content">
      <div className="page-header">
        <div>
          <h1>تفرغ المتطوعين</h1>
          <p>اعرف المتطوعين المتاحين حسب يوم الأسبوع.</p>
        </div>
      </div>

      <div className="form-card">
        <label>اختر اليوم</label>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="form-input"
        >
          {days.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>عدد المتطوعين المتاحين</span>
          <strong>{loading ? "..." : volunteers.length}</strong>
        </div>
      </div>

      {loading && <p>جاري تحميل المتطوعين...</p>}

      {error && (
        <p className="error-message" dir="ltr">{error}</p>
      )}

      {!loading && !error && volunteers.length === 0 && (
        <div className="form-card">
          لا يوجد متطوعون سجلوا تفرغهم لهذا اليوم.
        </div>
      )}

      {!loading && !error && volunteers.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المتطوع</th>
                  <th>البريد الإلكتروني</th>
                  <th>رقم الهاتف</th>
                  <th>أوقات التفرغ</th>
                </tr>
              </thead>

              <tbody>
                {volunteers.map((volunteer) => (
                  <tr key={volunteer.id}>
                    <td>{volunteer.full_name}</td>
                    <td>{volunteer.email}</td>
                    <td>{volunteer.phone || "—"}</td>
                    <td>
                      <div className="availability-list">
                        {volunteer.availability.map((item, index) => (
                          <div key={index}>
                            {item.availability_type === "full_day"
                              ? "متاح طوال اليوم"
                              : `من ${item.start_time?.slice(0, 5) || "—"} إلى ${
                                  item.end_time?.slice(0, 5) || "—"
                                }`}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </DashboardShell>
);
}