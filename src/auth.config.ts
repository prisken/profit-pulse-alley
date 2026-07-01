import type { NextAuthConfig } from "next-auth";

export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.needsOnboarding = Boolean(token.needsOnboarding);
        session.user.sessionInvalid = Boolean(token.sessionInvalid);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
