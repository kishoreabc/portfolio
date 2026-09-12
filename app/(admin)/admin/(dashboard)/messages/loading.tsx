import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export default function MessagesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>

        {/* View Filter Tabs Skeleton */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border/70 bg-muted/40">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* Messages Table Card Skeleton */}
      <Card className="border-border/70 bg-card/60">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded ml-auto" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 grid grid-cols-4 gap-4 items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded" />
                  <Skeleton className="h-3 w-64 rounded" />
                </div>
                <Skeleton className="h-3 w-24 rounded" />
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
