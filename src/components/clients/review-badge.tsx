import { Badge } from "@/components/ui/badge";
import { reviewState } from "@/lib/clients";
import { formatShortDate, relativeDays } from "@/lib/dates";

export function ReviewBadge({ date, today }: { date: string | null; today: string }) {
  const s = reviewState(date, today);
  if (s.kind === "none") return <span className="text-muted-foreground">—</span>;
  const tone = s.kind === "overdue" ? "danger" : s.kind === "soon" ? "warning" : "neutral";
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span>{formatShortDate(date, today)}</span>
      {s.kind !== "later" ? <Badge tone={tone}>{s.kind === "overdue" ? `Overdue · ${relativeDays(s.days)}` : s.days === 0 ? "Today" : relativeDays(s.days)}</Badge> : null}
    </span>
  );
}
