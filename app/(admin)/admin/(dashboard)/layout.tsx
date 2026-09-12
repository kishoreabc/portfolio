import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";
import { TEMPORARY_DISABLE_ADMIN_AUTH } from "@/lib/require-admin";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getUnreadMessageCount = unstable_cache(
  async () => {
    return prisma.contactMessage.count({
      where: { read: false, deletedAt: null, replied: false },
    });
  },
  ["admin-unread-messages-count"],
  { tags: ["messages", "unread-messages-count"], revalidate: 30 }
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user && !TEMPORARY_DISABLE_ADMIN_AUTH) {
    redirect("/admin/login");
  }

  const userEmail = session?.user?.email ?? "kishorehp134@gmail.com";

  // Fast cached count for the sidebar badge — avoids blocking child page load
  const unreadCount = await getUnreadMessageCount();

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-background flex flex-col lg:flex-row lg:overflow-hidden">
      <AdminSidebar
        unreadMessagesCount={unreadCount}
        userEmail={userEmail}
        signOutAction={signOutAction}
      />
      <main className="flex-1 min-h-0 lg:h-full lg:overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0 overscroll-contain">
        {children}
      </main>
    </div>
  );
}
