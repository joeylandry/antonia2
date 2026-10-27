"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="mb-6 mt-2 max-w-sm text-muted-foreground">Your data is safe. Try again, and if it keeps happening, reload the page.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
