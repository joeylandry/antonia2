import type { Metadata } from "next";
import { SessionForm } from "@/components/sessions/session-form";
import { DeleteSessionButton } from "@/components/sessions/delete-session-button";
import { getClient } from "@/lib/data/clients";
import { getSession } from "@/lib/data/sessions";
import { formatDate } from "@/lib/dates";
import { draftFromSession } from "@/lib/session-draft";
import { requireTrainer } from "@/lib/auth";
import { loadSessionFormData } from "../../session-page-data";

export const metadata: Metadata = { title: "Edit session" };

export default async function EditSessionPage({ params }: PageProps<"/clients/[id]/sessions/[sessionId]/edit">) {
  await requireTrainer();
  const { id, sessionId } = await params;
  await getClient(id);
  const session = await getSession(id, sessionId);
  const data = await loadSessionFormData(id, sessionId);

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-xl">Edit session</h2>
      <SessionForm
        clientId={id}
        sessionId={sessionId}
        initial={draftFromSession(session)}
        cancelHref={`/clients/${id}/sessions`}
        {...data}
        template={null}
        onDelete={<DeleteSessionButton clientId={id} sessionId={sessionId} dateLabel={formatDate(session.session_date)} />}
      />
    </div>
  );
}
