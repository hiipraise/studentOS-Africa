import { formatDeadline, isUrgent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DeadlineBadgeProps {
  deadline: Date | null;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  const urgent = isUrgent(deadline);
  const expired = deadline && new Date(deadline) < new Date();

  if (expired) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-red-500", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
        Closed
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        urgent ? "text-gold-dark" : "text-muted",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          urgent ? "bg-gold animate-pulse-slow" : "bg-border"
        )}
        aria-hidden="true"
      />
      {formatDeadline(deadline)}
    </span>
  );
}
