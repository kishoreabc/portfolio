import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const metadata = {
  title: "Profile & Site Settings | Admin",
};

export default async function AdminProfilePage() {
  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Site Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update hero headlines, personal bio, contact information, resume URL, and SEO tags.
        </p>
      </div>

      <ProfileForm config={config} />
    </div>
  );
}
