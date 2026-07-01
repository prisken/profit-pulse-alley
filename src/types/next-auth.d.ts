import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
    user: {
      id: string;
      role: Role;
      needsOnboarding?: boolean;
      sessionInvalid?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    needsOnboarding?: boolean;
    sessionInvalid?: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
  }
}
