import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Count unread contact messages for the sidebar badge
  const unreadCount = await prisma.contactMessage.count({
    where: { read: false, deletedAt: null, replied: false },
  });

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <AdminSidebar
        unreadMessagesCount={unreadCount}
        userEmail={session.user.email ?? undefined}
        signOutAction={signOutAction}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
