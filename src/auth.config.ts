import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "media-dashboard-dev-secret",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.status = (user as { status?: string }).status;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? "";
        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : "client_viewer";
        (session.user as { status?: string }).status =
          typeof token.status === "string" ? token.status : "active";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
