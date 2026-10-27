"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import { METRIC_LABEL, type Metric, type Range } from "@/lib/progress";
import { cn } from "@/lib/utils";

const RANGES: { value: Range; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "all", label: "All" },
];

type Props = { exercises: { id: string; name: string }[]; exerciseId: string; metrics: Metric[]; metric: Metric; range: Range };

export function ProgressControls({ exercises, exerciseId, metrics, metric, range }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    if (patch.exercise) next.delete("metric");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <Select aria-label="Exercise" className="w-auto min-w-52" value={exerciseId} onChange={(e) => set({ exercise: e.target.value })}>
        {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </Select>
      {metrics.length > 1 ? (
        <Select aria-label="Measure" className="w-auto min-w-48" value={metric} onChange={(e) => set({ metric: e.target.value })}>
          {metrics.map((m) => <option key={m} value={m}>{METRIC_LABEL[m]}</option>)}
        </Select>
      ) : null}
      <div role="group" aria-label="Date range" className="ml-auto inline-flex rounded-md border bg-card p-0.5 shadow-sm">
        {RANGES.map((r) => (
          <button key={r.value} type="button" aria-pressed={range === r.value} onClick={() => set({ range: r.value })}
            className={cn("rounded px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", range === r.value && "bg-accent text-accent-foreground")}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
