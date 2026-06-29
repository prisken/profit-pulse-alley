import type { Role } from "@prisma/client";

export default function AdminRoleBadge({ role }: Readonly<{ role: Role }>) {
  const isAdmin = role === "ADMIN";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isAdmin
          ? "bg-amber-500/15 text-amber-200 ring-amber-500/30"
          : "bg-zinc-800 text-zinc-300 ring-zinc-700"
      }`}
    >
      {role}
    </span>
  );
}
