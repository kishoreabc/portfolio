import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-150">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64 rounded-lg" />
        <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
      </div>

      {/* Stats Cards Skeleton Grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-border/70 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
              <div>
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-3 w-36 rounded mt-2" />
              </div>
              <Skeleton className="h-4 w-20 rounded pt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content / Table Card Skeleton */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
