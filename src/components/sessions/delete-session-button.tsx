"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteSessionAction } from "@/app/(app)/clients/[id]/sessions/actions";

export function DeleteSessionButton({ clientId, sessionId, dateLabel }: { clientId: string; sessionId: string; dateLabel: string }) {
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 /> Delete</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete the {dateLabel} session?</DialogTitle>
        <DialogDescription>All exercises, sets and notes from this session will be removed. This can&apos;t be undone.</DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild><Button variant="ghost">Keep session</Button></DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => start(() => deleteSessionAction(clientId, sessionId))}>Delete session</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
