import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CircleCheck, Hourglass, Plus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { QuickLog } from "@/components/dashboard/quick-log";
import { requireTrainer } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listGoalsDueBy, listRecentSessions } from "@/lib/data/dashboard";
import { GOAL_WINDOW_DAYS, buildAttention, greeting } from "@/lib/dashboard";
import { addDaysISO, daysBetween, formatDate, formatShortDate, relativeDays, todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Today" };

const TZ = process.env.APP_TIMEZONE ?? "America/New_York";

function Section({ title, icon: Icon, count, children }: { title: string; icon: typeof CalendarClock; count?: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon aria-hidden className="size-4 text-muted-foreground" /> {title}</CardTitle>
        {count ? <Badge tone="accent">{count}</Badge> : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function Row({ href, primary, secondary, trailing }: { href: string; primary: string; secondary?: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/50">
        <span className="min-w-0">
          <span className="block truncate font-medium">{primary}</span>
          {secondary ? <span className="block truncate text-sm text-muted-foreground">{secondary}</span> : null}
        </span>
        {trailing ? <span className="shrink-0 text-sm">{trailing}</span> : null}
      </Link>
    </li>
  );
}

export default async function TodayPage() {
  const trainer = await requireTrainer();
  const today = todayISO();
  const [clients, goals, recent] = await Promise.all([listClients({ sort: "name" }), listGoalsDueBy(addDaysISO(todayISO(), GOAL_WINDOW_DAYS)), listRecentSessions()]);
  const name = trainer.displayName.split(" ")[0];

  if (clients.length === 0) {
    return (
      <>
        <PageHeader title={`${greeting(new Date(), TZ)}${name ? `, ${name}` : ""}`} description="Let's get your first client set up." />
        <div className="grid place-items-center rounded-lg border border-dashed px-6 py-20 text-center">
          <UserPlus aria-hidden className="mb-4 size-8 text-muted-foreground" />
          <h2 className="text-xl">Add your first client</h2>
          <p className="mb-6 mt-2 max-w-sm text-muted-foreground">Create a profile, log a session and their progress starts building. Reviews, goals and activity will show up here.</p>
          <Button asChild><Link href="/clients/new"><Plus /> Add client</Link></Button>
        </div>
      </>
    );
  }

  const { reviews, quiet, prospects } = buildAttention(clients, today);
  const allClear = reviews.length === 0 && quiet.length === 0 && goals.length === 0;
  const active = clients.filter((c) => c.status === "active");

  return (
    <>
      <PageHeader
        title={`${greeting(new Date(), TZ)}${name ? `, ${name}` : ""}`}
        description={formatDate(today, "EEEE, MMMM d")}
        actions={<QuickLog clients={active.map((c) => ({ id: c.id, name: c.full_name }))} />}
      />

      {allClear ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border bg-success-subtle px-5 py-4 text-success">
          <CircleCheck aria-hidden className="size-5 shrink-0" />
          <p>You&apos;re all caught up. No reviews are due and everyone has trained recently.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {reviews.length > 0 ? (
          <Section title="Reviews due" icon={CalendarClock} count={reviews.length}>
            <ul className="divide-y">
              {reviews.map(({ client, kind, days }) => (
                <Row key={client.id} href={`/clients/${client.id}`} primary={client.full_name} secondary={client.primary_focus ?? undefined}
                  trailing={<Badge tone={kind === "overdue" ? "danger" : "warning"}>{kind === "overdue" ? `Overdue · ${relativeDays(days)}` : days === 0 ? "Today" : relativeDays(days)}</Badge>} />
              ))}
            </ul>
          </Section>
        ) : null}

        {quiet.length > 0 ? (
          <Section title="Haven't trained lately" icon={Hourglass} count={quiet.length}>
            <ul className="divide-y">
              {quiet.map(({ client, daysSince }) => (
                <Row key={client.id} href={`/clients/${client.id}`} primary={client.full_name}
                  secondary={daysSince == null ? "No sessions logged yet" : `Last session ${formatShortDate(client.last_session_date, today)}`}
                  trailing={<span className="text-muted-foreground">{daysSince == null ? "—" : `${daysSince} days`}</span>} />
              ))}
            </ul>
          </Section>
        ) : null}

        {goals.length > 0 ? (
          <Section title="Goals coming up" icon={CircleCheck} count={goals.length}>
            <ul className="divide-y">
              {goals.map((g) => {
                const d = daysBetween(today, g.target_date);
                return <Row key={g.id} href={`/clients/${g.client_id}/goals`} primary={g.title} secondary={g.client_name}
                  trailing={<Badge tone={d < 0 ? "danger" : "warning"}>{d < 0 ? `Overdue · ${relativeDays(d)}` : relativeDays(d)}</Badge>} />;
              })}
            </ul>
          </Section>
        ) : null}

        {prospects.length > 0 ? (
          <Section title="Prospects to follow up" icon={UserPlus} count={prospects.length}>
            <ul className="divide-y">
              {prospects.map((c) => (
                <Row key={c.id} href={`/clients/${c.id}`} primary={c.full_name} secondary={c.primary_focus ?? undefined}
                  trailing={c.assessment_date ? <span className="text-muted-foreground">Assessed {formatShortDate(c.assessment_date, today)}</span> : null} />
              ))}
            </ul>
          </Section>
        ) : null}

        <div className={allClear || reviews.length + quiet.length + goals.length + prospects.length === 0 ? "lg:col-span-2" : ""}>
          <Section title="Recent sessions" icon={CalendarClock}>
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sessions logged yet. Use “Log session” above to record the first one.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((s) => (
                  <Row key={s.id} href={`/clients/${s.client_id}/sessions`} primary={s.client_name}
                    secondary={[s.focus, `${s.exercise_count} ${s.exercise_count === 1 ? "exercise" : "exercises"}`].filter(Boolean).join(" · ")}
                    trailing={<span className="text-muted-foreground">{formatShortDate(s.session_date, today)}</span>} />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
