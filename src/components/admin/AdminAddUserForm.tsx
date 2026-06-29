"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";

import { createAdminUserAction } from "@/lib/admin-user-actions";
import { invokeAdminAction } from "@/lib/admin/action-result";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { translateAuthMessage } from "@/lib/i18n/auth-ui";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const fieldClass = `mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60 sm:text-sm ${focusRing}`;

const buttonClass = `inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

type Props = {
  onSuccess?: () => void;
};

export default function AdminAddUserForm({ onSuccess }: Readonly<Props>) {
  const { t, locale } = useTranslations();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setWarning(null);
    startTransition(async () => {
      await invokeAdminAction(
        () =>
          createAdminUserAction({
            email,
            name,
            contactNumber,
            role,
            password: password || undefined,
          }),
        {
          onSuccess: (successMessage, successWarning) => {
            setIsError(false);
            setMessage(successMessage ?? t("auth.admin.users.userCreated"));
            setWarning(successWarning ?? null);
            setEmail("");
            setName("");
            setContactNumber("");
            setRole("USER");
            setPassword("");
            onSuccess?.();
          },
          onError: (error) => {
            setIsError(true);
            setWarning(null);
            setMessage(error);
          },
        },
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-sm font-semibold text-zinc-100">
        {t("auth.admin.users.addTitle")}
      </h3>
      <p className="mt-1 text-sm text-zinc-400">{t("auth.admin.users.addSubtitle")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-300">{t("auth.login.email")}</span>
          <input
            type="email"
            required
            autoComplete="off"
            className={fieldClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
            placeholder="member@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            {t("auth.admin.users.nameOptional")}
          </span>
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            {t("auth.admin.users.contactOptional")}
          </span>
          <input
            className={fieldClass}
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">{t("auth.admin.users.role")}</span>
          <select
            className={fieldClass}
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            disabled={isPending}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-300">
            {t("auth.admin.users.tempPassword")}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            placeholder={t("auth.admin.users.passwordPlaceholder")}
          />
        </label>
      </div>

      <div className="mt-4">
        <button type="submit" className={buttonClass} disabled={isPending}>
          {isPending ? t("auth.admin.users.creating") : t("auth.admin.users.addButton")}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm font-medium ${
            isError ? "text-red-400" : "text-emerald-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {translateAuthMessage(locale, message)}
        </p>
      ) : null}
      {warning ? (
        <p
          className="mt-2 text-sm font-medium text-amber-300"
          role="status"
          aria-live="polite"
        >
          {warning}
        </p>
      ) : null}
    </form>
  );
}
