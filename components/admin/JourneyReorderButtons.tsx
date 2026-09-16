"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { moveJourneyEntry } from "@/actions/journey";
import { toast } from "sonner";

interface JourneyReorderButtonsProps {
  id: string;
  index: number;
  total: number;
}

export function JourneyReorderButtons({
  id,
  index,
  total,
}: JourneyReorderButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleMove = (direction: "up" | "down") => {
    startTransition(async () => {
      try {
        const res = await moveJourneyEntry(id, direction);
        if (res?.success) {
          toast.success(`Milestone moved ${direction}`);
        } else {
          toast.error("Could not move milestone");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to reorder milestone"
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={isPending || index === 0}
        onClick={() => handleMove("up")}
        className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
        title="Move Up"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </Button>
      <span className="text-[11px] font-mono text-muted-foreground font-semibold flex items-center justify-center h-4">
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
        ) : (
          index + 1
        )}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={isPending || index === total - 1}
        onClick={() => handleMove("down")}
        className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
        title="Move Down"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
