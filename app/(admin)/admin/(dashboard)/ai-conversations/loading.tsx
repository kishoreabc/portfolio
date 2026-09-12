import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export default function AiConversationsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Top Tabs Bar Skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/70 pb-4">
        <div className="inline-flex p-1 rounded-xl bg-card/80 border border-border/80 gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>

      {/* Monitor Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-60 rounded" />
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
