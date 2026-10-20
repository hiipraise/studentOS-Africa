import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const adminEmails = () =>
  new Set(
    [...(process.env.ADMIN_EMAILS ?? "").split(","), ...(process.env.EDITOR_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

/**
 * One Auth.js instance serves both audiences. Anyone with a verified Google
 * account may sign in as a student; admin routes additionally check the
 * `role` against ADMIN_EMAILS/EDITOR_EMAILS in authz.ts and middleware.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    async signIn({ user, profile }) {
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      const email = (user.email ?? googleProfile?.email ?? "").toLowerCase();
      return Boolean(googleProfile?.email_verified && email);
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email ?? "").toString().toLowerCase();
      if (email) token.email = email;
      token.role = adminEmails().has(email) ? "admin" : "student";
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email);
        session.user.id = String(token.sub ?? token.email);
        session.user.role = token.role === "admin" ? "admin" : "student";
      }
      return session;
    },
  },
});
