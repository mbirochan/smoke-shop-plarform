import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const adminRoutes = path.startsWith("/admin");
      const storeRoutes = path.startsWith("/store");
      const accountRoutes = path.startsWith("/account");
      const authRoutes = path.startsWith("/login") || path.startsWith("/register");

      if (authRoutes) {
        if (isLoggedIn) {
          const role = auth?.user?.role;
          if (role === "platform_admin") return Response.redirect(new URL("/admin", nextUrl));
          if (role === "store_owner" || role === "store_staff")
            return Response.redirect(new URL("/store", nextUrl));
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (adminRoutes) {
        if (!isLoggedIn) return false;
        return auth?.user?.role === "platform_admin";
      }

      if (storeRoutes) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        return role === "store_owner" || role === "store_staff";
      }

      if (accountRoutes) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
