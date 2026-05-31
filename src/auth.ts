import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail, updateUser } from "@/lib/accessStore";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "media-dashboard-dev-secret",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        accessKey: { label: "Access key", type: "text" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const accessKey =
          typeof credentials?.accessKey === "string" ? credentials.accessKey : "";

        if (!email || !accessKey) {
          return null;
        }

        const user = await getUserByEmail(email);

        if (!user || user.status === "deactivated") {
          return null;
        }

        if (!verifyPassword(accessKey, user.passwordHash)) {
          return null;
        }

        await updateUser({ userId: user.id });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
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
});
