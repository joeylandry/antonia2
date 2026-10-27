import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientTabs } from "@/components/clients/client-tabs";
import { PageHeader } from "@/components/page-header";
import { CLIENT_STATUS_LABEL, CLIENT_TYPE_LABEL, STATUS_TONE } from "@/lib/clients";
import { getClient } from "@/lib/data/clients";
import { requireTrainer } from "@/lib/auth";

export async function generateMetadata({ params }: LayoutProps<"/clients/[id]">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  return { title: client.full_name };
}

export default async function ClientLayout({ children, params }: LayoutProps<"/clients/[id]">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  const archived = Boolean(client.archived_at);

  return (
    <>
      <PageHeader
        backHref="/clients"
        backLabel="Clients"
        title={client.full_name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={archived ? "neutral" : STATUS_TONE[client.status]}>{archived ? "Archived" : CLIENT_STATUS_LABEL[client.status]}</Badge>
            <span>{CLIENT_TYPE_LABEL[client.client_type]}</span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="secondary"><Link href={`/clients/${id}/edit`}><Pencil /> Edit</Link></Button>
            {!archived ? <Button asChild><Link href={`/clients/${id}/sessions/new`}><Plus /> Log session</Link></Button> : null}
          </>
        }
      />
      <ClientTabs clientId={id} />
      {children}
    </>
  );
}
