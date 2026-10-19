import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = () => new Set([...(process.env.ADMIN_EMAILS ?? "").split(","), ...(process.env.EDITOR_EMAILS ?? "").split(",")].map((email) => email.trim().toLowerCase()).filter(Boolean));

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      const email = (user.email ?? googleProfile?.email ?? "").toLowerCase();
      return Boolean(googleProfile?.email_verified && email && allowedEmails().has(email));
    },
    async jwt({ token, user }) { if (user?.email) token.email = user.email.toLowerCase(); return token; },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = String(token.email);
        session.user.id = String(token.sub ?? token.email);
      }
      return session;
    },
  },
});
