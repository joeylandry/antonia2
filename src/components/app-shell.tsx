"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex w-full items-center gap-2.5 rounded-md p-2 text-left hover:bg-accent"
      >
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
          {initial}
        </span>
        <span className="min-w-0 max-md:hidden">
          <span className="block truncate text-sm font-medium">{name || "Trainer"}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel>{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/api/export" download><Download /> Export all data</a>
        </DropdownMenuItem>
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ trainer, children }: { trainer: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-subtle p-4 md:flex">
        <Link href="/" className="mb-8 px-2 pt-1"><Brand /></Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(pathname, href) && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 border-t pt-3">
          <div className="min-w-0 flex-1"><UserMenu name={trainer.name} email={trainer.email} /></div>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-2.5 backdrop-blur md:hidden">
          <Link href="/"><Brand /></Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={trainer.name} email={trainer.email} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">{children}</main>
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground",
                isActive(pathname, href) && "text-primary",
              )}
            >
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
