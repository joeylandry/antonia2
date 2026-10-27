import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/sessions/session-card";
import { getClient } from "@/lib/data/clients";
import { listSessions } from "@/lib/data/sessions";
import { requireTrainer } from "@/lib/auth";

export const metadata: Metadata = { title: "Sessions" };

export default async function SessionsPage({ params }: PageProps<"/clients/[id]/sessions">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  const sessions = await listSessions(id);

  if (sessions.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed px-6 py-16 text-center">
        <ClipboardList aria-hidden className="mb-4 size-8 text-muted-foreground" />
        <h2 className="text-xl">No sessions logged yet</h2>
        <p className="mb-6 mt-2 max-w-sm text-muted-foreground">Log {client.full_name.split(" ")[0]}&apos;s first workout to start building their history.</p>
        {!client.archived_at ? <Button asChild><Link href={`/clients/${id}/sessions/new`}><Plus /> Log session</Link></Button> : null}
      </div>
    );
  }
  return (
    <div className="max-w-3xl space-y-5">
      {sessions.map((s) => <SessionCard key={s.id} session={s} editable={!client.archived_at} />)}
    </div>
  );
}
