import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* Form Cards Skeleton */}
      <div className="space-y-6">
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="p-6 border-b border-border/40 space-y-2">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3.5 w-72 rounded" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
