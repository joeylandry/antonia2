"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteClientAction, setArchivedAction } from "@/app/(app)/clients/actions";

export function ArchiveButton({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  if (archived) {
    return (
      <Button variant="secondary" disabled={pending} onClick={() => start(() => setArchivedAction(id, false))}>
        <ArchiveRestore /> Restore client
      </Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="secondary"><Archive /> Archive</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Archive {name}?</DialogTitle>
        <DialogDescription>
          They&apos;ll move out of your active list and be marked inactive. All sessions, goals and notes are kept, and you can restore them any time.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button disabled={pending} onClick={() => start(() => setArchivedAction(id, true))}>Archive client</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost" className="text-destructive hover:text-destructive"><Trash2 /> Delete permanently</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete {name} permanently?</DialogTitle>
        <DialogDescription>
          This erases the profile and every session, set, goal and note. It can&apos;t be undone. Type the client&apos;s name to confirm.
        </DialogDescription>
        <Input className="mt-4" aria-label="Type the client's name to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={name} autoComplete="off" />
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button variant="destructive" disabled={!matches || pending} onClick={() => start(() => deleteClientAction(id, typed))}>Delete forever</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
