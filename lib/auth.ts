/**
 * Auth.js v5 configuration
 * Uses GitHub OAuth — only the ADMIN_EMAIL is allowed admin access.
 * No passwords. No user table. Session stored as JWT.
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * authorized callback — defines access rules for middleware.
     * Public routes return true; only /admin routes require authenticated admin.
     */
    authorized({ auth, request: { nextUrl } }) {
      if (nextUrl.pathname.startsWith("/admin")) {
        if (nextUrl.pathname === "/admin/login") return true;
        const isLoggedIn = !!auth?.user;
        const role = (auth?.user as { role?: string })?.role;
        return isLoggedIn && role === "admin";
      }
      return true;
    },

    /**
     * signIn callback — only allow the admin email.
     * Anyone else who authenticates with GitHub gets denied.
     */
    async signIn({ profile }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) return false;

      // GitHub profile may have multiple emails; check primary email
      const userEmail = profile?.email as string | undefined;
      return userEmail === adminEmail;
    },

    /**
     * JWT callback — embed the admin role in the token.
     */
    async jwt({ token, profile }) {
      if (profile?.email === process.env.ADMIN_EMAIL) {
        token.role = "admin";
      }
      return token;
    },

    /**
     * Session callback — expose the role to the session object.
     */
    async session({ session, token }) {
      if (token.role) {
        (session.user as typeof session.user & { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
});
