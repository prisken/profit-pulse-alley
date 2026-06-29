"use client";

import { useRouter } from "next/navigation";

import AdminAddUserForm from "@/components/admin/AdminAddUserForm";
import AdminMembersTable, {
  type AdminMemberRow,
} from "@/components/admin/AdminMembersTable";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateWith } from "@/lib/i18n/messages";

type Props = {
  members: AdminMemberRow[];
  currentAdminUserId: string;
};

export default function AdminUserManagement({
  members,
  currentAdminUserId,
}: Readonly<Props>) {
  const router = useRouter();
  const { t, locale } = useTranslations();

  const countLabel =
    members.length === 1
      ? translateWith(locale, "auth.admin.users.count", { count: members.length })
      : translateWith(locale, "auth.admin.users.countPlural", {
          count: members.length,
        });

  return (
    <section aria-labelledby="user-management-heading" className="space-y-5">
      <div>
        <h2
          id="user-management-heading"
          className="text-lg font-semibold text-foreground sm:text-xl"
        >
          {t("auth.admin.users.title")}
        </h2>
        <p className="mt-1 text-sm text-foreground/65">
          {t("auth.admin.users.subtitle")}
        </p>
      </div>

      <AdminAddUserForm onSuccess={() => router.refresh()} />

      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t("auth.admin.users.allMembers")}
        </h3>
        <p className="mt-1 text-sm text-foreground/65">{countLabel}</p>
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
