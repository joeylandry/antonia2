"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/sessions`, label: "Sessions" },
    { href: `${base}/progress`, label: "Progress" },
    { href: `${base}/goals`, label: "Goals" },
  ];
  return (
    <nav aria-label="Client sections" className="-mx-4 mb-8 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "border-primary text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
