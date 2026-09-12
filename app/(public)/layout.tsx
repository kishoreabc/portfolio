import { Navbar } from "@/components/public/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-full">
      <Navbar />
      <div className="flex-1 flex flex-col w-full">{children}</div>
    </div>
  );
}
