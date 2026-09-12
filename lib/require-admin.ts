/**
 * Server-side admin guard.
 * Call this at the top of every admin Server Action or API route.
 * Throws if the current session is not an authenticated admin.
 */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// ── TEMPORARY MANUAL TESTING AUTH BYPASS ──────────────────────────────────────
// Set to false to revoke/re-enable admin security
export const TEMPORARY_DISABLE_ADMIN_AUTH = false;
// ─────────────────────────────────────────────────────────────────────────────

export async function requireAdmin() {
  if (TEMPORARY_DISABLE_ADMIN_AUTH) {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Fallback during CLI testing or non-request contexts
    }
    return (
      session ?? {
        user: {
          id: "test-admin",
          name: "Kishore R (Testing)",
          email: "admin@test.local",
          role: "admin",
        },
      }
    );
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const role = (session.user as typeof session.user & { role?: string }).role;
  if (role !== "admin") {
    redirect("/admin/login");
  }

  return session;
}
