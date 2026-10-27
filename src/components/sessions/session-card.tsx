import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { summarizeSets, type SessionWithEntries } from "@/lib/sessions";

export function SessionCard({ session, editable = true }: { session: SessionWithEntries; editable?: boolean }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
        <div>
          <h3 className="font-sans text-base font-semibold">{formatDate(session.session_date, "EEEE, MMM d, yyyy")}</h3>
          {session.focus ? <p className="text-sm text-muted-foreground">{session.focus}</p> : null}
        </div>
        {editable ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/clients/${session.client_id}/sessions/${session.id}/edit`} aria-label={`Edit session on ${formatDate(session.session_date)}`}><Pencil /> Edit</Link>
          </Button>
        ) : null}
      </div>
      <ul className="divide-y">
        {session.session_entries.map((e) => (
          <li key={e.id} className="grid grid-cols-1 gap-x-6 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <div>
              <p className="font-medium">{e.exercise.name}</p>
              <p className="text-sm text-muted-foreground">{summarizeSets(e.entry_sets, e.per_side)}</p>
            </div>
            {e.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground sm:pt-0.5">{e.notes}</p> : null}
          </li>
        ))}
      </ul>
      {session.notes ? <p className="whitespace-pre-wrap border-t px-5 py-3 text-sm text-muted-foreground">{session.notes}</p> : null}
    </Card>
  );
}
