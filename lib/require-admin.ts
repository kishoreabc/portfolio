/**
 * Server-side admin guard.
 * Call this at the top of every admin Server Action or API route.
 * Throws if the current session is not an authenticated admin.
 */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
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
