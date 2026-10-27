import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientsToolbar } from "@/components/clients/clients-toolbar";
import { ReviewBadge } from "@/components/clients/review-badge";
import { CLIENT_STATUS_LABEL, CLIENT_TYPE_LABEL, STATUS_TONE } from "@/lib/clients";
import { countClients, listClients, type ClientSort } from "@/lib/data/clients";
import { formatShortDate, todayISO } from "@/lib/dates";
import { requireTrainer } from "@/lib/auth";

export const metadata: Metadata = { title: "Clients" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  await requireTrainer();
  const sp = await searchParams;
  const sort = first(sp.sort);
  const filters = {
    q: first(sp.q),
    status: first(sp.status),
    archived: first(sp.view) === "archived",
    sort: (sort === "review" || sort === "recent" ? sort : "name") as ClientSort,
  };
  const [clients, counts] = await Promise.all([listClients(filters), countClients()]);
  const today = todayISO();
  const hasFilters = Boolean(filters.q || filters.status || filters.archived);

  return (
    <>
      <PageHeader
        title="Clients"
        description={counts.active ? `${counts.active} active${counts.archived ? ` · ${counts.archived} archived` : ""}` : undefined}
        actions={<Button asChild><Link href="/clients/new"><Plus /> Add client</Link></Button>}
      />

      {counts.active + counts.archived === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed px-6 py-20 text-center">
          <Users aria-hidden className="mb-4 size-8 text-muted-foreground" />
          <h2 className="text-xl">Add your first client</h2>
          <p className="mb-6 mt-2 max-w-sm text-muted-foreground">Create a profile, log a session, and their progress will start to build here.</p>
          <Button asChild><Link href="/clients/new"><Plus /> Add client</Link></Button>
        </div>
      ) : (
        <>
          <ClientsToolbar />
          {clients.length === 0 ? (
            <p className="rounded-lg border border-dashed px-6 py-14 text-center text-muted-foreground">
              {hasFilters ? "No clients match these filters." : "No clients yet."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-subtle text-xs uppercase tracking-wide text-muted-foreground max-md:hidden">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Client</th>
                    <th scope="col" className="px-4 py-3 font-medium">Goal</th>
                    <th scope="col" className="px-4 py-3 font-medium">Next review</th>
                    <th scope="col" className="px-4 py-3 font-medium">Last session</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((c) => (
                    <tr key={c.id} className="relative hover:bg-accent/50 max-md:block max-md:px-4 max-md:py-3">
                      <td className="px-4 py-3 max-md:block max-md:p-0">
                        <Link href={`/clients/${c.id}`} className="font-medium after:absolute after:inset-0 hover:text-primary">{c.full_name}</Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone={STATUS_TONE[c.status]}>{CLIENT_STATUS_LABEL[c.status]}</Badge>
                          <span className="text-xs text-muted-foreground">{CLIENT_TYPE_LABEL[c.client_type]}</span>
                        </div>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground max-md:block max-md:p-0 max-md:pt-2">
                        <span className="line-clamp-2">{c.primary_focus ?? <span aria-label="No goal set">—</span>}</span>
                      </td>
                      <td className="px-4 py-3 max-md:inline-block max-md:p-0 max-md:pr-6 max-md:pt-2">
                        <span className="mr-1 text-xs text-muted-foreground md:hidden">Review </span><ReviewBadge date={c.next_review_date} today={today} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-md:inline-block max-md:p-0 max-md:pt-2">
                        <span className="mr-1 text-xs md:hidden">Last session </span>{formatShortDate(c.last_session_date, today)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
