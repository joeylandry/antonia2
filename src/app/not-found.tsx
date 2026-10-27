import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl">Page not found</h1>
        <p className="mb-6 mt-2 text-muted-foreground">That page doesn&apos;t exist, or it belongs to a client you can&apos;t access.</p>
        <Button asChild><Link href="/">Back to Today</Link></Button>
      </div>
    </main>
  );
}
