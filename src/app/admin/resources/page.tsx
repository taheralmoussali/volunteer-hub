
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/client";
import { Search, RefreshCw, Package, CheckCircle2, XCircle, Trash2 } from "lucide-react";

type Resource = {
  id: string;
  volunteer_id: string;
  title: string;
  resource_type: string | null;
  description: string | null;
  quantity: number | null;
  is_available: boolean;
  created_at: string;
};

type Volunteer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

type ResourceWithVolunteer = Resource & {
  volunteer: Volunteer | null;
};

// أسماء عربية للأنواع الشائعة.
// إذا كان النوع غير موجود هنا، سيظهر الاسم الأصلي من قاعدة البيانات.
const resourceTypeLabels: Record<string, string> = {
  car: "سيارة",
  vehicle: "مركبة",
  bicycle: "دراجة",
  bike: "دراجة",
  motorcycle: "دراجة نارية",
  equipment: "معدات",
  tools: "أدوات",
  computer: "حاسوب",
  laptop: "حاسوب محمول",
  medical: "معدات طبية",
  other: "أخرى",
  transport: "وسائل نقل",
  generator: "مولدة كهرباء",
  tent: "خيمة",
  food: "مواد غذائية",
  clothing: "ملابس",
};

function getResourceTypeLabel(type: string | null) {
  if (!type) return "غير محدد";

  const normalized = type.trim().toLowerCase();
  return resourceTypeLabels[normalized] || type;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceWithVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const [resourcesResult, profilesResult] = await Promise.all([
      supabase
        .from("resources")
        .select(
          "id, volunteer_id, title, resource_type, description, quantity, is_available, created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("role", "volunteer"),
    ]);

    if (resourcesResult.error || profilesResult.error) {
      setError(
        resourcesResult.error?.message ||
          profilesResult.error?.message ||
          "تعذر تحميل البيانات"
      );
      setResources([]);
      setLoading(false);
      return;
    }

    const profiles = profilesResult.data || [];
    const profileMap = new Map(
      profiles.map((profile) => [profile.id, profile as Volunteer])
    );

    const result = (resourcesResult.data || []).map((resource) => ({
      ...resource,
      volunteer: profileMap.get(resource.volunteer_id) || null,
    })) as ResourceWithVolunteer[];

    setResources(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const resourceTypes = useMemo(() => {
    return Array.from(
      new Set(
        resources
          .map((resource) => resource.resource_type)
          .filter((type): type is string => Boolean(type))
      )
    );
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        resource.title.toLowerCase().includes(searchValue) ||
        (resource.description || "").toLowerCase().includes(searchValue) ||
        (resource.volunteer?.full_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        (resource.volunteer?.email || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesType =
        typeFilter === "all" || resource.resource_type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && resource.is_available) ||
        (statusFilter === "unavailable" && !resource.is_available);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, search, typeFilter, statusFilter]);

  const availableCount = resources.filter(
    (resource) => resource.is_available
  ).length;

  const unavailableCount = resources.length - availableCount;

  async function toggleAvailability(resource: ResourceWithVolunteer) {
    setUpdatingId(resource.id);
    setError("");

    const supabase = createClient();
    const newAvailability = !resource.is_available;

    const { error } = await supabase
      .from("resources")
      .update({ is_available: newAvailability })
      .eq("id", resource.id);

    if (error) {
      setError(error.message);
    } else {
      setResources((current) =>
        current.map((item) =>
          item.id === resource.id
            ? { ...item, is_available: newAvailability }
            : item
        )
      );
    }

    setUpdatingId(null);
  }

  async function deleteResource(resource: ResourceWithVolunteer) {
    const confirmed = window.confirm(
      `هل تريد حذف "${resource.title}" من إمكانيات المتطوع؟`
    );

    if (!confirmed) return;

    setUpdatingId(resource.id);
    setError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id);

    if (error) {
      setError(error.message);
    } else {
      setResources((current) =>
        current.filter((item) => item.id !== resource.id)
      );
    }

    setUpdatingId(null);
  }

  return (
    <DashboardShell role="admin">
      <div className="page-content">
        <div className="page-heading">
          <div>
            <h1>إدارة الإمكانيات</h1>
            <p>
              عرض ومتابعة الإمكانيات والموارد التي يقدمها المتطوعون.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <span>إجمالي الإمكانيات</span>
            <strong>{loading ? "..." : resources.length}</strong>
          </div>

          <div className="stat-card">
            <span>الإمكانيات المتاحة</span>
            <strong>{loading ? "..." : availableCount}</strong>
          </div>

          <div className="stat-card">
            <span>الإمكانيات غير المتاحة</span>
            <strong>{loading ? "..." : unavailableCount}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="content-card">
          <h2>البحث والتصفية</h2>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="resource-search">البحث</label>
              <div style={{ position: "relative" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 13,
                    color: "#8793a5",
                  }}
                />
                <input
                  id="resource-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="اسم الإمكانية أو المتطوع..."
                  style={{ paddingRight: 40 }}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="type-filter">نوع الإمكانية</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">جميع الأنواع</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {getResourceTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="status-filter">حالة التوفر</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="available">متاحة</option>
                <option value="unavailable">غير متاحة</option>
              </select>
            </div>
          </div>

          <div className="task-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              إعادة ضبط الفلاتر
            </button>

            <button
              type="button"
              className="form-button"
              onClick={loadResources}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                style={{ verticalAlign: "middle", marginLeft: 6 }}
              />
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message" dir="ltr">
            {error}
          </div>
        )}

        {/* Resources table */}
        <div className="content-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>قائمة الإمكانيات</h2>
            <span className="muted">
              النتائج: {filteredResources.length}
            </span>
          </div>

          {loading ? (
            <div className="loading-page" style={{ minHeight: 180 }}>
              <RefreshCw className="spin" size={24} />
              <p>جاري تحميل الإمكانيات...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 15px" }}>
              <Package
                size={38}
                color="#94a3b8"
                style={{ margin: "0 auto 12px" }}
              />
              <h3>لا توجد إمكانيات</h3>
              <p className="muted">
                لا توجد نتائج تطابق خيارات البحث والتصفية.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الإمكانية</th>
                    <th>النوع</th>
                    <th>المتطوع</th>
                    <th>الكمية</th>
                    <th>الوصف</th>
                    <th>حالة التوفر</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredResources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <strong>{resource.title}</strong>
                      </td>

                      <td>
                        {getResourceTypeLabel(resource.resource_type)}
                      </td>

                      <td>
                        <div>
                          <strong>
                            {resource.volunteer?.full_name || "متطوع غير معروف"}
                          </strong>
                          <div
                            className="muted"
                            style={{ fontSize: 12, marginTop: 4 }}
                          >
                            {resource.volunteer?.phone ||
                              resource.volunteer?.email ||
                              "—"}
                          </div>
                        </div>
                      </td>

                      <td>{resource.quantity ?? "—"}</td>

                      <td style={{ minWidth: 160 }}>
                        {resource.description || "لا يوجد وصف"}
                      </td>

                      <td>
                        {resource.is_available ? (
                          <span
                            className="status-pill"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            متاحة
                          </span>
                        ) : (
                          <span
                            className="status-pill"
                            style={{
                              background: "#fff7df",
                              color: "#946200",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <XCircle size={14} />
                            غير متاحة
                          </span>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={updatingId === resource.id}
                            onClick={() => toggleAvailability(resource)}
                            style={{
                              color: resource.is_available
                                ? "#946200"
                                : "#147a45",
                              fontSize: 12,
                              padding: "7px 10px",
                            }}
                          >
                            {updatingId === resource.id
                              ? "..."
                              : resource.is_available
                                ? "تعطيل"
                                : "تفعيل"}
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            disabled={updatingId === resource.id}
                            onClick={() => deleteResource(resource)}
                            title="حذف الإمكانية"
                            style={{
                              padding: "7px 10px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Trash2 size={14} />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
