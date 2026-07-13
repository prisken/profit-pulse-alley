"use client";

import { useRouter } from "next/navigation";

import AdminAddUserForm from "@/components/admin/AdminAddUserForm";
import AdminMembersTable from "@/components/admin/AdminMembersTable";
import type { AdminMemberRow } from "@/lib/admin/members-types";
import { useTranslations } from "@/components/providers/LocaleProvider";

type Props = {
  members: AdminMemberRow[];
  currentAdminUserId: string;
};

export default function AdminUserManagement({
  members,
  currentAdminUserId,
}: Readonly<Props>) {
  const router = useRouter();
  const { t } = useTranslations();

  return (
    <section aria-labelledby="user-management-heading" className="space-y-8">
      <div>
        <h2
          id="user-management-heading"
          className="text-lg font-semibold text-zinc-50 sm:text-xl"
        >
          {t("auth.admin.users.title")}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {t("auth.admin.users.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-4 sm:p-5">
        <AdminAddUserForm onSuccess={() => router.refresh()} />
      </div>

      <div className="border-t border-zinc-800 pt-8">
        <h3 className="text-base font-semibold text-zinc-100">
          {t("auth.admin.users.allMembers")}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {t("auth.admin.users.membersTableHint")}
        </p>
        <div className="mt-4">
          <AdminMembersTable
            members={members}
            currentAdminUserId={currentAdminUserId}
          />
        </div>
      </div>
    </section>
  );
}
