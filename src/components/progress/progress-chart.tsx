"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { Point } from "@/lib/progress";

type Props = { series: Point[]; unitLabel: string; target?: number | null; ariaLabel: string };

function Tip({ active, payload, unitLabel }: { active?: boolean; payload?: { payload: Point }[]; unitLabel: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{format(parseISO(p.date), "EEE, MMM d, yyyy")}</p>
      <p className="font-medium">{p.value} <span className="font-normal text-muted-foreground">{unitLabel}</span></p>
    </div>
  );
}

export function ProgressChart({ series, unitLabel, target, ariaLabel }: Props) {
  const values = series.map((p) => p.value);
  const lo = Math.min(...values, target ?? Infinity);
  const hi = Math.max(...values, target ?? -Infinity);
  const pad = Math.max((hi - lo) * 0.15, 2);
  const domain: [number, number] = [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)];
  const sameYear = series[0]?.date.slice(0, 4) === series[series.length - 1]?.date.slice(0, 4);

  return (
    <div role="img" aria-label={ariaLabel} className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 300 }}>
        <LineChart data={series} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d: string) => format(parseISO(d), sameYear ? "MMM d" : "MMM d, yy")} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={28} />
          <YAxis domain={domain} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
          <Tooltip content={<Tip unitLabel={unitLabel} />} cursor={{ stroke: "var(--border)" }} />
          {target != null ? (
            <ReferenceLine y={target} stroke="var(--chart-3)" strokeDasharray="5 4"
              label={{ value: `Goal ${target}`, position: "insideTopRight", fill: "var(--chart-3)", fontSize: 12 }} />
          ) : null}
          <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3.5, fill: "var(--chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 5.5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
