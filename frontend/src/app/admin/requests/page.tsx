"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getServiceRequests,
  updateServiceRequest,
  type ServiceRequestItem,
  type ServiceRequestStatus,
} from "@/lib/admin-api";

const FILTERS = ["pending", "contacted", "completed", "all"] as const;

function requestLabel(type: ServiceRequestItem["request_type"]): string {
  if (type === "class_booking") return "Free class";
  if (type === "test_booking") return "Test booking";
  return "Counsellor call";
}

export default function AdminRequestsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getServiceRequests(filter));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => {}), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function setStatus(id: string, status: ServiceRequestStatus) {
    const updated = await updateServiceRequest(id, status);
    setItems((current) => current.map((item) => item.id === id ? updated : item));
    if (filter !== "all" && filter !== status) {
      setItems((current) => current.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Request inbox</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1B1916]">Calls and bookings</h1>
          <p className="mt-1 text-sm text-[#8A847B]">Every confirmation is stored here until your team closes it.</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#E8E5DD] bg-white p-1">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold capitalize transition ${filter === value ? "bg-[#1B1916] text-white" : "text-[#6B655C] hover:bg-[#F4F2EC]"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-[#E8E5DD] bg-white">
        {loading ? (
          <p className="p-8 text-center text-sm text-[#8A847B]">Loading requests...</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#8A847B]">No {filter === "all" ? "" : filter} requests.</p>
        ) : (
          <div className="divide-y divide-[#EFECE4]">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#ECF5EF] px-2 py-0.5 text-[10px] font-bold text-[#0A6E45]">{requestLabel(item.request_type)}</span>
                    <span className="text-[11px] text-[#8A847B]">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <Link href={`/admin/students/${item.student_id}`} className="mt-2 inline-block truncate text-[14px] font-bold text-[#1B1916] hover:text-[#0A6E45]">
                    {item.full_name}
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-[#6B655C]">{item.phone || "No phone"} · {item.email}</p>
                  {(item.test_type || item.preferred_time) && (
                    <p className="mt-2 text-[12px] font-semibold text-[#3F3A33]">
                      {[item.test_type, item.preferred_time].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" && (
                    <button type="button" onClick={() => setStatus(item.id, "contacted")} className="rounded-md bg-[#12244A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1F3D78]">Mark contacted</button>
                  )}
                  {item.status !== "completed" && (
                    <button type="button" onClick={() => setStatus(item.id, "completed")} className="rounded-md border border-[#D5EADD] bg-[#ECF5EF] px-3 py-2 text-[11px] font-bold text-[#0A6E45] hover:bg-[#E0F0E6]">Complete</button>
                  )}
                  <span className="self-center text-[10px] font-bold uppercase tracking-[0.06em] text-[#8A847B]">{item.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
