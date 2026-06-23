import "server-only";

import { auth } from "@/auth";

export type AdminSession = {
  userId: string;
  email: string;
};

export async function requireAdminSession(): Promise<AdminSession | null> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}
