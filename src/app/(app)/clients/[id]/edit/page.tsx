import type { Metadata } from "next";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/lib/data/clients";
import { requireTrainer } from "@/lib/auth";
import { updateClientAction } from "../../actions";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  await requireTrainer();
  const { id } = await params;
  const client = await getClient(id);
  return (
    <div className="max-w-2xl">
      <ClientForm action={updateClientAction.bind(null, id)} client={client} cancelHref={`/clients/${id}`} submitLabel="Save changes" />
    </div>
  );
}
