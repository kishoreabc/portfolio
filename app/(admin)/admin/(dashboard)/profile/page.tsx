import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { unstable_cache } from "next/cache";

export const metadata = {
  title: "Profile & Site Settings | Admin",
};

const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig.findUnique({
      where: { id: "singleton" },
    });
  },
  ["site-config"],
  { tags: ["site-config"], revalidate: 60 }
);

export default async function AdminProfilePage() {
  const config = await getCachedSiteConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Site Settings</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Update hero headlines, personal bio, contact information, resume URL, and SEO tags.
        </p>
      </div>

      <ProfileForm config={config} />
    </div>
  );
}
