import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "../actions";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New client" description="Only a name is required. You can fill in the rest later." backHref="/clients" backLabel="Clients" />
      <ClientForm action={createClientAction} cancelHref="/clients" submitLabel="Add client" />
    </div>
  );
}
