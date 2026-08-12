import type { ReactNode } from "react";

import AdminNav from "@/components/admin/AdminNav";

/**
 * Persistent admin navigation for every /admin route — dashboard, Market
 * Pulse (incl. approvals / cycle builder / guided launch), Matching Pulse
 * (incl. request detail), Pitch Meeting leads and Workshop leads.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 [--admin-nav-h:3.5rem]">
      <AdminNav />
      {children}
    </div>
  );
}
