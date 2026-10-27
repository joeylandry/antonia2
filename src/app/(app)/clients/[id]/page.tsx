import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewBadge } from "@/components/clients/review-badge";
import { ArchiveButton, DeleteClientButton } from "@/components/clients/client-danger-zone";
import { scheduleLabel } from "@/lib/clients";
import { getClient } from "@/lib/data/clients";
import { formatDate, todayISO } from "@/lib/dates";
import { requireTrainer } from "@/lib/auth";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

export default async function ClientOverview({ params }: PageProps<"/clients/[id]">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  const today = todayISO();
  const archived = Boolean(client.archived_at);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Goal / focus</CardTitle></CardHeader>
          <CardContent>
            {client.primary_focus ? <p className="whitespace-pre-wrap">{client.primary_focus}</p> : <p className="text-muted-foreground">No goal recorded yet. Add one from Edit.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            {client.notes ? <p className="whitespace-pre-wrap">{client.notes}</p> : <p className="text-muted-foreground">No notes yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              <Fact label="Next review"><ReviewBadge date={client.next_review_date} today={today} /></Fact>
              <Fact label="Schedule">{scheduleLabel(client) ?? "—"}</Fact>
              <Fact label="Assessment">{formatDate(client.assessment_date)}</Fact>
              <Fact label="Training since">{formatDate(client.start_date)}</Fact>
            </dl>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <ArchiveButton id={id} name={client.full_name} archived={archived} />
          {archived ? <DeleteClientButton id={id} name={client.full_name} /> : null}
        </div>
      </div>
    </div>
  );
}
