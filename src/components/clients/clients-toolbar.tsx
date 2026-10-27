"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { CLIENT_STATUS_LABEL } from "@/lib/clients";

/** Filters live in the URL so views can be refreshed, bookmarked and shared with the back button. */
export function ClientsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const archived = params.get("view") === "archived";
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1 sm:max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search clients"
          placeholder="Search by name or goal"
          className="pl-9"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => update("q", e.target.value.trim()), 250);
          }}
        />
      </div>
      <Select aria-label="Filter by status" className="w-auto min-w-36" value={params.get("status") ?? ""} onChange={(e) => update("status", e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Select aria-label="Sort clients" className="w-auto min-w-44" value={params.get("sort") ?? "name"} onChange={(e) => update("sort", e.target.value === "name" ? "" : e.target.value)}>
        <option value="name">Sort: name</option>
        <option value="review">Sort: next review</option>
        <option value="recent">Sort: latest session</option>
      </Select>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={archived} onChange={(e) => update("view", e.target.checked ? "archived" : "")} />
        Archived
      </label>
    </div>
  );
}
