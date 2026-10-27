import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionForm } from "@/components/sessions/session-form";
import { getClient } from "@/lib/data/clients";
import { todayISO } from "@/lib/dates";
import { blankEntry } from "@/lib/session-draft";
import { requireTrainer } from "@/lib/auth";
import { loadSessionFormData } from "../session-page-data";

export const metadata: Metadata = { title: "Log session" };

export default async function NewSessionPage({ params }: PageProps<"/clients/[id]/sessions/new">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  if (client.archived_at) redirect(`/clients/${id}`);
  const data = await loadSessionFormData(id);

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-xl">Log a session</h2>
      <SessionForm
        clientId={id}
        sessionId={null}
        initial={{ date: todayISO(), focus: "", notes: "", entries: [blankEntry()] }}
        cancelHref={`/clients/${id}/sessions`}
        {...data}
      />
    </div>
  );
}
