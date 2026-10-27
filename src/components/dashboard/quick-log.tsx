"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

/** Jump straight to a new session for any active client. */
export function QuickLog({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [id, setId] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (id) router.push(`/clients/${id}/sessions/new`);
      }}
    >
      <Select aria-label="Client to log a session for" value={id} onChange={(e) => setId(e.target.value)} className="min-w-44">
        <option value="">Choose a client…</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Button type="submit" disabled={!id}><Plus /> Log session</Button>
    </form>
  );
}
