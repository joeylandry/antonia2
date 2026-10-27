import { requireTrainer } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const trainer = await requireTrainer();
  return <AppShell trainer={{ name: trainer.displayName, email: trainer.email }}>{children}</AppShell>;
}
